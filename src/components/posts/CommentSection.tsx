import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Comment } from '../../types';
import { fetchPostComments, addPostComment, subscribeToComments } from '../../supabase/db';
import { Avatar } from '../ui/Avatar';
import { Send, Loader2 } from 'lucide-react';

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

    // Subscribe to live comments for this post
    const unsubscribe = subscribeToComments(postId, (newComment) => {
      setComments(prev => {
        if (prev.some(c => c.id === newComment.id)) return prev;
        return [...prev, newComment];
      });
      onCommentAdded();
    });

    return () => {
      unsubscribe();
    };
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

  const formatCommentTime = (isoString?: string) => {
    if (!isoString) return 'Just now';
    try {
      const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
      if (diff < 60) return 'Just now';
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
      return `${Math.floor(diff / 86400)}d ago`;
    } catch {
      return 'Just now';
    }
  };

  return (
    <div className="pt-3 mt-3 border-t border-gray-100 dark:border-[#1e3325] space-y-3">
      {/* Existing Comments List */}
      {comments.length > 0 && (
        <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
          {comments.map(c => (
            <div key={c.id} className="flex items-start gap-2.5">
              <Link to={c.authorId ? `/profile/${c.authorId}` : '#'} className="shrink-0 hover:opacity-90 transition" title="View Profile">
                <Avatar src={c.authorAvatar} name={c.authorName} size="xs" />
              </Link>
              <div className="flex-1 bg-gray-50 dark:bg-[#16251c] rounded-xl px-3 py-2 text-xs border border-gray-100 dark:border-[#1e3325] transition-colors">
                <div className="flex items-center justify-between mb-0.5">
                  <Link
                    to={c.authorId ? `/profile/${c.authorId}` : '#'}
                    className="font-bold text-gray-900 dark:text-gray-100 hover:text-[#0b4627] dark:hover:text-emerald-400 transition-colors"
                  >
                    {c.authorName}
                  </Link>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">
                    {formatCommentTime(c.createdAt)}
                  </span>
                </div>
                <p className="text-gray-800 dark:text-gray-200 leading-relaxed break-words">{c.content}</p>
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
              disabled={submitting}
              className="w-full text-xs text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 bg-gray-100/90 dark:bg-[#16251c] border border-gray-200/80 dark:border-[#1e3325] rounded-xl pl-3 pr-9 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#0b4627] dark:focus:ring-emerald-500 focus:bg-white dark:focus:bg-[#111d15] focus:border-transparent transition"
            />
            <button
              type="submit"
              disabled={submitting || !text.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 disabled:opacity-30 disabled:text-gray-400 p-1 transition"
              aria-label="Submit comment"
              title="Post comment"
            >
              {submitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
