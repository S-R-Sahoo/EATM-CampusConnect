import React, { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { createPost } from '../../firebase/firestore';
import { uploadFile } from '../../firebase/storage';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { Image, Video, FileText, Smile, X, Globe, Users } from 'lucide-react';

interface CreatePostCardProps {
  onPostCreated: () => void;
}

export const CreatePostCard: React.FC<CreatePostCardProps> = ({ onPostCreated }) => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<'campus' | 'connections'>('campus');
  const [feeling, setFeeling] = useState<string | undefined>(undefined);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const feelings = ['happy 😊', 'excited 🚀', 'proud ❤️', 'studying 📚', 'coding 💻', 'celebrating 🎉'];

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!content.trim() && !mediaFile) {
      error('Please enter some text or select media to post.');
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
        feeling,
        visibility
      });

      setContent('');
      setFeeling(undefined);
      removeMedia();
      success('Your post has been shared with the campus community!', 'Post Published');
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
    <div className="bg-white rounded-2xl border border-gray-200/80 p-4 sm:p-5 shadow-card">
      <div className="flex gap-3">
        <Avatar src={user.photoURL} name={user.displayName} size="md" />
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`What's on your mind, ${user.displayName.split(' ')[0]}?`}
            rows={2}
            className="w-full text-sm placeholder:text-gray-400 bg-transparent border-none focus:outline-none resize-none"
          />

          {feeling && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-medium mb-2">
              <span>Feeling {feeling}</span>
              <button onClick={() => setFeeling(undefined)} className="text-gray-400 hover:text-gray-700">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Media Preview Box */}
          {mediaPreview && (
            <div className="relative rounded-xl overflow-hidden border border-gray-200 mb-3 max-h-64 bg-gray-50">
              <img src={mediaPreview} alt="Upload preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={removeMedia}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2 overflow-hidden">
              <div className="bg-[#0b4627] h-1.5 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between pt-3 border-t border-gray-100 gap-2">
            {/* Media Attachment Actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*,video/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-600 hover:text-[#0b4627] hover:bg-emerald-50 transition"
              >
                <Image className="w-4 h-4 text-emerald-600" />
                <span className="hidden sm:inline">Photo</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-600 hover:text-blue-700 hover:bg-blue-50 transition"
              >
                <Video className="w-4 h-4 text-blue-600" />
                <span className="hidden sm:inline">Video</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-600 hover:text-amber-700 hover:bg-amber-50 transition"
              >
                <FileText className="w-4 h-4 text-amber-600" />
                <span className="hidden sm:inline">File</span>
              </button>

              {/* Feelings dropdown */}
              <div className="relative group">
                <button
                  type="button"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-600 hover:text-purple-700 hover:bg-purple-50 transition"
                >
                  <Smile className="w-4 h-4 text-purple-600" />
                  <span className="hidden sm:inline">Feeling</span>
                </button>
                <div className="absolute left-0 bottom-full mb-1 hidden group-hover:flex bg-white rounded-xl shadow-lg border border-gray-100 p-1.5 gap-1 z-20">
                  {feelings.map(f => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFeeling(f)}
                      className="px-2 py-1 text-xs hover:bg-gray-100 rounded-lg whitespace-nowrap"
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Visibility & Submit Button */}
            <div className="flex items-center gap-2">
              <select
                value={visibility}
                onChange={(e: any) => setVisibility(e.target.value)}
                className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 outline-none"
              >
                <option value="campus">🌍 Campus</option>
                <option value="connections">👥 Connections</option>
              </select>

              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleSubmit}
                isLoading={loading}
                className="px-4 shadow-sm"
              >
                Post
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
