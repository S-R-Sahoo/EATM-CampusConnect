import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Comment } from '../../types';
import { fetchPostComments, addPostComment } from '../../supabase/db';
import { Avatar } from '../ui/Avatar';
import { Send } from 'lucide-react';

interface CommentSectionProps {
  postId: string;
  onCommentAdded: () => void;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ postId, onCommentAdded }) => {
  const { user } = useAuth();
  const { error } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPostComments(postId).then(data => setComments(data));
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !text.trim()) return;

    setSubmitting(true);
    try {
      const newCmt = await addPostComment(postId, {
        authorId: user.id,
        authorName: user.displayName,
        authorAvatar: user.photoURL,
        content: text.trim()
      });
      setComments(prev => [...prev, newCmt]);
      setText('');
      onCommentAdded();
    } catch (err: any) {
      error(err.message || 'Failed to post comment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-3 mt-3 border-t border-gray-100 space-y-3">
      {/* Existing Comments List */}
      {comments.length > 0 && (
        <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
          {comments.map(c => (
            <div key={c.id} className="flex items-start gap-2.5">
              <Avatar src={c.authorAvatar} name={c.authorName} size="xs" />
              <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2 text-xs border border-gray-100">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-bold text-gray-900">{c.authorName}</span>
                  <span className="text-[10px] text-gray-400">Just now</span>
                </div>
                <p className="text-gray-700">{c.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Input box */}
      {user && (
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <Avatar src={user.photoURL} name={user.displayName} size="xs" />
          <div className="relative flex-1">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a comment..."
              className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl pl-3 pr-9 py-2 focus:outline-none focus:ring-1 focus:ring-[#0b4627] focus:bg-white transition"
            />
            <button
              type="submit"
              disabled={submitting || !text.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#0b4627] disabled:opacity-30 p-1"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
