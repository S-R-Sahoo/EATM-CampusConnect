import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { createPost } from '../../supabase/db';
import { uploadFile } from '../../supabase/storage';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { 
  Plus, 
  Image as ImageIcon, 
  Smile, 
  BarChart2, 
  Globe, 
  Users, 
  X, 
  Trash2, 
  ChevronDown, 
  Check,
  ChevronLeft,
  ChevronRight,
  Layers
} from 'lucide-react';

interface StagedMediaItem {
  id: string;
  file: File;
  previewUrl: string;
}

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
    emojis: ['👍', '⭐', '📢', '📌', '🔔', '✅', '💬', '🌟', '🛠️', '💼', '📊', '🥇', '⚡', '🎯']
  }
];

export const CreatePostCard: React.FC<CreatePostCardProps> = ({ onPostCreated }) => {
  const { user } = useAuth();
  const { success, error } = useToast();
  
  // Expanded state: collapsed by default, shows full composer after click
  const [isExpanded, setIsExpanded] = useState(false);

  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<'campus' | 'connections'>('campus');
  const [showVisibilityMenu, setShowVisibilityMenu] = useState(false);

  const [mediaFiles, setMediaFiles] = useState<StagedMediaItem[]>([]);
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Poll state
  const [showPoll, setShowPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);

  // Emoji drawer state
  const [showEmoji, setShowEmoji] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const visibilityRef = useRef<HTMLDivElement>(null);

  // Focus textarea when expanding
  useEffect(() => {
    if (isExpanded && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isExpanded]);

  // Click outside to close visibility popup
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (visibilityRef.current && !visibilityRef.current.contains(e.target as Node)) {
        setShowVisibilityMenu(false);
      }
    };
    if (showVisibilityMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showVisibilityMenu]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files);
      const newItems: StagedMediaItem[] = selected.map((file, i) => ({
        id: `img_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
        file,
        previewUrl: URL.createObjectURL(file)
      }));

      setMediaFiles(prev => {
        // Enforce maximum 10 images like Instagram
        const combined = [...prev, ...newItems].slice(0, 10);
        return combined;
      });

      if (!isExpanded) setIsExpanded(true);
      setTimeout(() => textareaRef.current?.focus(), 150);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeMediaAt = (index: number) => {
    setMediaFiles(prev => {
      const updated = prev.filter((_, i) => i !== index);
      if (activePreviewIndex >= updated.length) {
        setActivePreviewIndex(Math.max(0, updated.length - 1));
      }
      return updated;
    });
  };

  const clearAllMedia = () => {
    setMediaFiles([]);
    setActivePreviewIndex(0);
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
    clearAllMedia();
    setShowPoll(false);
    setPollQuestion('');
    setPollOptions(['', '']);
    setShowEmoji(false);
    setShowVisibilityMenu(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

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

    if (!content.trim() && mediaFiles.length === 0 && !pollPayload) {
      error('Please write something, upload photos, or create a poll.');
      return;
    }

    setLoading(true);
    try {
      const uploadedUrls: string[] = [];
      if (mediaFiles.length > 0) {
        for (let i = 0; i < mediaFiles.length; i++) {
          const item = mediaFiles[i];
          const cleanName = item.file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
          const url = await uploadFile(
            `posts/${user.id}/${Date.now()}_${i}_${cleanName}`,
            item.file,
            (prog) => {
              const overall = Math.round(((i + prog / 100) / mediaFiles.length) * 100);
              setUploadProgress(overall);
            }
          );
          if (url) uploadedUrls.push(url);
        }
      }

      await createPost({
        authorId: user.id,
        authorName: user.displayName,
        authorAvatar: user.photoURL,
        authorRole: user.role,
        authorDept: `${user.department || 'Student'} ${user.year ? '• ' + user.year : ''}`,
        content: content.trim(),
        mediaUrl: uploadedUrls[0] || undefined,
        mediaUrls: uploadedUrls,
        mediaType: uploadedUrls.length > 0 ? 'image' : undefined,
        visibility,
        poll: pollPayload
      });

      resetForm();
      setIsExpanded(false);
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
    <div className="bg-white dark:bg-[#111d15] rounded-2xl border border-gray-200/90 dark:border-[#1e3325] p-4 sm:p-5 shadow-card transition-all duration-200">
      {/* Hidden file input for Photo Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        multiple
        className="hidden"
      />

      {/* 1. COLLAPSED VIEW (Default): Clean teaser prompt to click on */}
      {!isExpanded ? (
        <div className="flex items-center gap-3">
          <Avatar src={user.photoURL} name={user.displayName} size="md" />
          
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="flex-1 text-left px-4 py-2.5 rounded-full bg-gray-100/90 dark:bg-[#16251c] hover:bg-gray-200/70 dark:hover:bg-[#1c3224] text-gray-500 dark:text-gray-400 text-sm transition font-medium border border-transparent hover:border-gray-200/70 dark:hover:border-[#284532]"
          >
            What's on your mind?
          </button>

          <button
            type="button"
            onClick={() => {
              setIsExpanded(true);
              setTimeout(() => fileInputRef.current?.click(), 100);
            }}
            title="Upload photo"
            className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-[#0b4627] dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60 transition shadow-xs active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      ) : (
        /* 2. EXPANDED VIEW: Revealed after clicking on post */
        <div className="space-y-3 animate-in fade-in zoom-in-95 duration-150">
          {/* Top Header: User info, Public Visibility selector with "Who can see this post?", & Close button */}
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#1e3325]">
            <div className="flex items-center gap-3">
              <Avatar src={user.photoURL} name={user.displayName} size="md" />
              <div>
                <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">
                  {user.displayName}
                </h4>

                {/* Visibility Trigger Button: Shows Public / Friends */}
                <div className="relative" ref={visibilityRef}>
                  <button
                    type="button"
                    onClick={() => setShowVisibilityMenu(!showVisibilityMenu)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100/90 dark:bg-[#16251c] hover:bg-gray-200/70 dark:hover:bg-[#1f3527] text-gray-700 dark:text-gray-200 text-xs font-semibold border border-gray-200/70 dark:border-[#1e3325] transition mt-0.5"
                  >
                    {visibility === 'campus' ? (
                      <>
                        <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Public</span>
                      </>
                    ) : (
                      <>
                        <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>Friends</span>
                      </>
                    )}
                    <ChevronDown className="w-3 h-3 text-gray-400" />
                  </button>

                  {/* "Who can see this post?" Popover Menu */}
                  {showVisibilityMenu && (
                    <div className="absolute left-0 top-full mt-1.5 w-72 bg-white dark:bg-[#16251c] rounded-2xl shadow-xl border border-gray-200 dark:border-[#1e3325] p-3 z-30 animate-in fade-in zoom-in-95">
                      <div className="mb-2 pb-2 border-b border-gray-100 dark:border-[#203728]">
                        <h5 className="font-bold text-xs text-gray-900 dark:text-gray-100">
                          Who can see this post?
                        </h5>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                          Choose who can view and interact with your post.
                        </p>
                      </div>

                      <div className="space-y-1">
                        {/* Option 1: Public (Everyone) */}
                        <button
                          type="button"
                          onClick={() => {
                            setVisibility('campus');
                            setShowVisibilityMenu(false);
                          }}
                          className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition ${
                            visibility === 'campus'
                              ? 'bg-emerald-50/80 dark:bg-emerald-950/50 text-[#0b4627] dark:text-emerald-300'
                              : 'hover:bg-gray-50 dark:hover:bg-[#1b2f23] text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-emerald-100/70 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
                              <Globe className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs font-bold">Public (Everyone)</p>
                              <p className="text-[10px] text-gray-400 dark:text-gray-500">Visible to all students & faculty</p>
                            </div>
                          </div>
                          {visibility === 'campus' && (
                            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          )}
                        </button>

                        {/* Option 2: Friends (Followed Each Other) */}
                        <button
                          type="button"
                          onClick={() => {
                            setVisibility('connections');
                            setShowVisibilityMenu(false);
                          }}
                          className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition ${
                            visibility === 'connections'
                              ? 'bg-blue-50/80 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                              : 'hover:bg-gray-50 dark:hover:bg-[#1b2f23] text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-blue-100/70 dark:bg-blue-900/60 flex items-center justify-center text-blue-700 dark:text-blue-300">
                              <Users className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs font-bold">Friends (Followed Each Other)</p>
                              <p className="text-[10px] text-gray-400 dark:text-gray-500">Only people who follow each other</p>
                            </div>
                          </div>
                          {visibility === 'connections' && (
                            <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Close / Collapse button */}
            <button
              type="button"
              onClick={() => {
                resetForm();
                setIsExpanded(false);
              }}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1b2f23] transition"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Textarea: Post Message / Caption */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={mediaFiles.length > 0 ? "Write a caption or message for your photos..." : "What's on your mind?"}
            rows={mediaFiles.length > 0 ? 2 : 3}
            className="w-full text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-900 dark:text-gray-100 bg-transparent border-none focus:outline-none resize-none leading-relaxed py-1"
          />

          {/* Multi-Image Carousel Preview Box */}
          {mediaFiles.length > 0 && (
            <div className="space-y-2 mb-2">
              <div className="relative rounded-2xl overflow-hidden border border-gray-200/90 dark:border-[#1e3325] bg-gray-900 aspect-[16/10] max-h-80 flex items-center justify-center select-none group">
                <img
                  src={mediaFiles[activePreviewIndex]?.previewUrl}
                  alt={`Preview ${activePreviewIndex + 1}`}
                  className="w-full h-full object-contain bg-black/40"
                />

                {/* Top Overlay Bar */}
                <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between pointer-events-none">
                  {/* Instagram-style counter pill */}
                  {mediaFiles.length > 1 ? (
                    <div className="px-2.5 py-1 rounded-full bg-black/65 backdrop-blur-md text-white text-[11px] font-semibold flex items-center gap-1.5 shadow-md border border-white/10">
                      <Layers className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{activePreviewIndex + 1} / {mediaFiles.length}</span>
                    </div>
                  ) : (
                    <div className="px-2.5 py-1 rounded-full bg-black/65 backdrop-blur-md text-white text-[11px] font-medium flex items-center gap-1.5 shadow-md border border-white/10">
                      <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                      <span>1 photo</span>
                    </div>
                  )}

                  {/* Actions: Add more + Delete */}
                  <div className="flex items-center gap-1.5 pointer-events-auto">
                    {mediaFiles.length < 10 && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1 rounded-full bg-black/65 hover:bg-black/85 backdrop-blur-md text-white text-[11px] font-semibold flex items-center gap-1 transition shadow-md border border-white/10"
                        title="Add more photos (up to 10)"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add photos</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeMediaAt(activePreviewIndex)}
                      className="p-1.5 rounded-full bg-black/65 hover:bg-red-600/90 backdrop-blur-md text-white transition shadow-md border border-white/10"
                      aria-label="Remove this photo"
                      title="Remove this photo"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Chevron Navigation Arrows */}
                {mediaFiles.length > 1 && (
                  <>
                    {activePreviewIndex > 0 && (
                      <button
                        type="button"
                        onClick={() => setActivePreviewIndex(prev => Math.max(0, prev - 1))}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/55 hover:bg-black/80 backdrop-blur-md text-white transition shadow-lg border border-white/10 active:scale-95"
                        aria-label="Previous preview photo"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                    )}
                    {activePreviewIndex < mediaFiles.length - 1 && (
                      <button
                        type="button"
                        onClick={() => setActivePreviewIndex(prev => Math.min(mediaFiles.length - 1, prev + 1))}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/55 hover:bg-black/80 backdrop-blur-md text-white transition shadow-lg border border-white/10 active:scale-95"
                        aria-label="Next preview photo"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </>
                )}

                {/* Bottom Pagination Dots */}
                {mediaFiles.length > 1 && (
                  <div className="absolute bottom-2.5 left-0 right-0 flex justify-center items-center gap-1.5 pointer-events-none">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10">
                      {mediaFiles.map((_, idx) => (
                        <div
                          key={idx}
                          className={`rounded-full transition-all duration-200 ${
                            idx === activePreviewIndex
                              ? 'w-5 h-1.5 bg-emerald-400'
                              : 'w-1.5 h-1.5 bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Thumbnails strip (Instagram style) showing all staged photos and + Add slot */}
              {mediaFiles.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto py-1 px-0.5 no-scrollbar">
                  {mediaFiles.map((item, idx) => (
                    <div
                      key={item.id}
                      onClick={() => setActivePreviewIndex(idx)}
                      className={`relative w-14 h-14 rounded-lg overflow-hidden shrink-0 cursor-pointer border-2 transition ${
                        idx === activePreviewIndex
                          ? 'border-emerald-500 scale-105 shadow-sm'
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={item.previewUrl} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeMediaAt(idx);
                        }}
                        className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/70 hover:bg-red-600 text-white transition"
                        title="Delete photo"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}

                  {mediaFiles.length < 10 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-14 h-14 rounded-lg border-2 border-dashed border-gray-300 dark:border-[#203728] hover:border-emerald-500 dark:hover:border-emerald-500 flex flex-col items-center justify-center text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition shrink-0 text-[10px] font-medium gap-0.5"
                      title="Add another photo"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add</span>
                    </button>
                  )}
                </div>
              )}
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
            <div className="p-3.5 bg-gray-50/90 dark:bg-[#16251c] rounded-xl border border-gray-200/90 dark:border-[#1e3325] space-y-2.5 animate-in fade-in zoom-in-95">
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
            <div className="p-3 bg-white dark:bg-[#16251c] rounded-xl border border-gray-200 dark:border-[#1e3325] shadow-lg animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100 dark:border-[#203728]">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Select an Emoji</span>
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

          {/* 3. INSIDE POST ACTIONS: Professional single line with ONLY ICONS (no text) on the left, and Post on the right */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-[#1e3325]">
            {/* Single horizontal line of professional icon-only buttons */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              {/* Upper '+' direct picture upload icon */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-xl text-[#0b4627] dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200/60 dark:border-emerald-800/50 transition active:scale-95"
                title="Add Picture"
                aria-label="Add Picture"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
              </button>

              {/* Gallery icon */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-xl text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50/80 dark:hover:bg-[#182b20] transition active:scale-95"
                title="Upload Photo / Gallery"
                aria-label="Upload Photo"
              >
                <ImageIcon className="w-4 h-4" />
              </button>

              {/* Poll icon */}
              <button
                type="button"
                onClick={() => setShowPoll(!showPoll)}
                className={`p-2 rounded-xl transition active:scale-95 ${
                  showPoll 
                    ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' 
                    : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50/80 dark:hover:bg-[#16251c]'
                }`}
                title="Create Poll"
                aria-label="Create Poll"
              >
                <BarChart2 className="w-4 h-4" />
              </button>

              {/* Emoji icon */}
              <button
                type="button"
                onClick={() => setShowEmoji(!showEmoji)}
                className={`p-2 rounded-xl transition active:scale-95 ${
                  showEmoji 
                    ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300' 
                    : 'text-amber-500 hover:bg-amber-50/80 dark:hover:bg-[#1a291f]'
                }`}
                title="Add Emoji"
                aria-label="Add Emoji"
              >
                <Smile className="w-4 h-4" />
              </button>
            </div>

            {/* Official Post submit button */}
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleSubmit}
              isLoading={loading}
              disabled={loading || (!content.trim() && mediaFiles.length === 0 && !(showPoll && pollQuestion.trim()))}
              className="px-5 py-2 font-semibold shadow-sm text-xs rounded-xl"
            >
              Post
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
