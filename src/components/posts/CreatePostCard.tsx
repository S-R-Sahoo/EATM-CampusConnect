import React, { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { createPost } from '../../firebase/firestore';
import { uploadFile } from '../../firebase/storage';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { 
  Plus, 
  Image as ImageIcon, 
  Smile, 
  BarChart2, 
  X, 
  Trash2 
} from 'lucide-react';

interface CreatePostCardProps {
  onPostCreated: () => void;
}

const EMOJI_CATEGORIES = [
  {
    name: 'Campus & Tech',
    emojis: ['🎓', '💻', '🚀', '📚', '💡', '🔬', '⚡', '🤖', '📐', '🎯', '🏆', '☕', '✍️', '🏢']
  },
  {
    name: 'Faces & Expressions',
    emojis: ['😊', '😄', '😎', '🔥', '🤔', '🙌', '🎉', '✨', '👏', '💪', '🤝', '💯', '❤️', '🤩']
  },
  {
    name: 'Reactions & Icons',
    emojis: ['👍', '⭐', '📢', '📌', '🔔', '✅', '💬', '🌟', '🚀', '🛠️', '💼', '📊', '🥇', '⚡']
  }
];

export const CreatePostCard: React.FC<CreatePostCardProps> = ({ onPostCreated }) => {
  const { user } = useAuth();
  const { success, error } = useToast();
  
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<'campus' | 'connections'>('campus');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Poll state
  const [showPoll, setShowPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);

  // Emoji picker state
  const [showEmoji, setShowEmoji] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setMediaFile(file);
      const url = URL.createObjectURL(file);
      setMediaPreview(url);
    }
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleInsertEmoji = (emoji: string) => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart || content.length;
      const end = textareaRef.current.selectionEnd || content.length;
      const updated = content.substring(0, start) + emoji + content.substring(end);
      setContent(updated);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + emoji.length;
          textareaRef.current.focus();
        }
      }, 0);
    } else {
      setContent(prev => prev + emoji);
    }
  };

  const handleAddPollOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions(prev => [...prev, '']);
    }
  };

  const handlePollOptionChange = (idx: number, val: string) => {
    const updated = [...pollOptions];
    updated[idx] = val;
    setPollOptions(updated);
  };

  const handleRemovePollOption = (idx: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(prev => prev.filter((_, i) => i !== idx));
    }
  };

  const resetForm = () => {
    setContent('');
    removeMedia();
    setShowPoll(false);
    setPollQuestion('');
    setPollOptions(['', '']);
    setShowEmoji(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Check poll validity if poll creator is active
    let pollPayload: { question: string; options: { id: string; text: string; votes: string[] }[] } | undefined = undefined;
    if (showPoll) {
      if (!pollQuestion.trim()) {
        error('Please enter a question for your poll.');
        return;
      }
      const validOpts = pollOptions.map(o => o.trim()).filter(Boolean);
      if (validOpts.length < 2) {
        error('Please provide at least 2 choices for your poll.');
        return;
      }
      pollPayload = {
        question: pollQuestion.trim(),
        options: validOpts.map((text, idx) => ({
          id: `opt_${Date.now()}_${idx}`,
          text,
          votes: []
        }))
      };
    }

    if (!content.trim() && !mediaFile && !pollPayload) {
      error('Please write something, upload a photo, or create a poll.');
      return;
    }

    setLoading(true);
    try {
      let uploadedUrl: string | undefined = undefined;
      if (mediaFile) {
        uploadedUrl = await uploadFile(
          `posts/${user.id}/${Date.now()}_${mediaFile.name}`,
          mediaFile,
          (prog) => setUploadProgress(prog)
        );
      }

      await createPost({
        authorId: user.id,
        authorName: user.displayName,
        authorAvatar: user.photoURL,
        authorRole: user.role,
        authorDept: `${user.department || 'Student'} ${user.year ? '• ' + user.year : ''}`,
        content: content.trim(),
        mediaUrl: uploadedUrl,
        mediaType: mediaFile ? 'image' : undefined,
        visibility,
        poll: pollPayload
      });

      resetForm();
      success('Your post has been published to the campus!', 'Post Created');
      onPostCreated();
    } catch (err: any) {
      error(err.message || 'Failed to publish post.');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  if (!user) return null;

  return (
    <div className="bg-white dark:bg-[#111d15] rounded-2xl border border-gray-200/90 dark:border-[#1e3325] p-4 sm:p-5 shadow-card transition-colors duration-150">
      {/* Hidden file input for Photo Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        className="hidden"
      />

      {/* 1. UPPER SECTION: User info & Direct '+' upload picture button */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-[#1e3325]">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar src={user.photoURL} name={user.displayName} size="md" />
          <div className="min-w-0">
            <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">
              {user.displayName}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {user.department || 'CSE'} {user.year ? `• ${user.year}` : ''}
            </p>
          </div>
        </div>

        {/* Upper '+' button to upload picture directly */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title="Upload photo"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-[#0b4627] dark:text-emerald-300 text-xs font-semibold border border-emerald-200/70 dark:border-emerald-800/60 transition shadow-xs active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span className="hidden sm:inline">Add Photo</span>
        </button>
      </div>

      {/* 2. JUST UNDER: Write what's on your mind? */}
      <div className="pt-3">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          rows={3}
          className="w-full text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-900 dark:text-gray-100 bg-transparent border-none focus:outline-none resize-none leading-relaxed"
        />

        {/* Media Preview Box */}
        {mediaPreview && (
          <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-[#1e3325] mb-3 max-h-72 bg-gray-50 dark:bg-[#16251c]">
            <img src={mediaPreview} alt="Upload preview" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={removeMedia}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-black text-white transition shadow-md"
              aria-label="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Upload Progress Bar */}
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="w-full bg-gray-100 dark:bg-[#1a2d21] rounded-full h-1.5 mb-2 overflow-hidden">
            <div className="bg-[#0b4627] dark:bg-emerald-500 h-1.5 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
          </div>
        )}

        {/* Poll Builder Drawer */}
        {showPoll && (
          <div className="mb-3 p-3.5 bg-gray-50/90 dark:bg-[#16251c] rounded-xl border border-gray-200/90 dark:border-[#1e3325] space-y-2.5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200/70 dark:border-[#203728]">
              <div className="flex items-center gap-2 text-xs font-bold text-[#0b4627] dark:text-emerald-400">
                <BarChart2 className="w-4 h-4" />
                <span>Campus Poll</span>
              </div>
              <button
                type="button"
                onClick={() => setShowPoll(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
                aria-label="Cancel poll"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <input
              type="text"
              value={pollQuestion}
              onChange={(e) => setPollQuestion(e.target.value)}
              placeholder="Ask a question..."
              className="w-full px-3 py-2 text-xs bg-white dark:bg-[#111d15] border border-gray-200 dark:border-[#1e3325] rounded-lg text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-[#0b4627]"
            />

            <div className="space-y-2">
              {pollOptions.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => handlePollOptionChange(idx, e.target.value)}
                    placeholder={`Option ${idx + 1}`}
                    className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-[#111d15] border border-gray-200 dark:border-[#1e3325] rounded-lg text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-[#0b4627]"
                  />
                  {pollOptions.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePollOption(idx)}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded transition"
                      title="Remove option"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {pollOptions.length < 4 && (
              <button
                type="button"
                onClick={handleAddPollOption}
                className="text-xs text-[#0b4627] dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1 pt-1"
              >
                <Plus className="w-3 h-3" /> Add Choice
              </button>
            )}
          </div>
        )}

        {/* Emoji Tray Drawer */}
        {showEmoji && (
          <div className="mb-3 p-3 bg-white dark:bg-[#16251c] rounded-xl border border-gray-200 dark:border-[#1e3325] shadow-lg animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100 dark:border-[#203728]">
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Insert Emoji</span>
              <button
                type="button"
                onClick={() => setShowEmoji(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
                aria-label="Close emoji picker"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {EMOJI_CATEGORIES.map((cat) => (
                <div key={cat.name}>
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                    {cat.name}
                  </p>
                  <div className="grid grid-cols-7 sm:grid-cols-10 gap-1.5">
                    {cat.emojis.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => handleInsertEmoji(emoji)}
                        className="p-1.5 text-base sm:text-lg hover:bg-gray-100 dark:hover:bg-[#1f3527] rounded-lg transition active:scale-125 flex items-center justify-center"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. UNDER: Actions Bar (Emoji, Gallery, Poll, Visibility, Post Button) */}
        <div className="flex flex-wrap items-center justify-between pt-3 border-t border-gray-100 dark:border-[#1e3325] gap-2">
          {/* Action icons */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Emoji icon */}
            <button
              type="button"
              onClick={() => setShowEmoji(!showEmoji)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                showEmoji 
                  ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#182b20]'
              }`}
              title="Add emoji"
            >
              <Smile className="w-4 h-4 text-amber-500" />
              <span className="hidden sm:inline">Emoji</span>
            </button>

            {/* Gallery icon */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#182b20] transition"
              title="Upload photo"
            >
              <ImageIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">Gallery</span>
            </button>

            {/* Poll icon */}
            <button
              type="button"
              onClick={() => setShowPoll(!showPoll)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                showPoll 
                  ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#182b20]'
              }`}
              title="Create poll"
            >
              <BarChart2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="hidden sm:inline">Poll</span>
            </button>
          </div>

          {/* Visibility selector & Submit Post Button */}
          <div className="flex items-center gap-2">
            <select
              value={visibility}
              onChange={(e: any) => setVisibility(e.target.value)}
              className="text-xs bg-gray-50 dark:bg-[#16251c] border border-gray-200 dark:border-[#1e3325] text-gray-700 dark:text-gray-200 rounded-lg px-2.5 py-1.5 font-medium outline-none focus:ring-1 focus:ring-[#0b4627] cursor-pointer"
              title="Post visibility"
            >
              <option value="campus" className="bg-white dark:bg-[#111d15] text-gray-900 dark:text-gray-100">
                🌐 Public (Everyone)
              </option>
              <option value="connections" className="bg-white dark:bg-[#111d15] text-gray-900 dark:text-gray-100">
                👥 Friends (People who followed each other)
              </option>
            </select>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleSubmit}
              isLoading={loading}
              disabled={loading || (!content.trim() && !mediaFile && !(showPoll && pollQuestion.trim()))}
              className="px-4 shadow-sm font-semibold"
            >
              Post
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
