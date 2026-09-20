import React, { useState } from 'react';
import { Post } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { toggleLikePost } from '../../firebase/firestore';
import { Avatar } from '../ui/Avatar';
import { CommentSection } from './CommentSection';
import { ReportModal } from '../common/ReportModal';
import { 
  Heart, MessageSquare, Share2, Bookmark, 
  MoreHorizontal, Flag, Trash2, Check 
} from 'lucide-react';

interface PostCardProps {
  post: Post;
  onPostDeleted?: () => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onPostDeleted }) => {
  const { user } = useAuth();
  const { success, info } = useToast();

  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [isLiked, setIsLiked] = useState(user ? post.likes.includes(user.id) : false);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount || 0);
  const [showComments, setShowComments] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const handleLike = async () => {
    if (!user) return;
    const previousState = isLiked;
    const previousCount = likesCount;

    // Optimistic UI update
    setIsLiked(!previousState);
    setLikesCount(previousState ? Math.max(0, previousCount - 1) : previousCount + 1);

    try {
      const res = await toggleLikePost(post.id, user.id);
      setIsLiked(res.liked);
      setLikesCount(res.count);
    } catch (e) {
      // Revert if error
      setIsLiked(previousState);
      setLikesCount(previousCount);
    }
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    success('Post link copied to clipboard!', 'Shared');
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    if (!isSaved) {
      success('Post saved to your bookmarks.');
    } else {
      info('Post removed from bookmarks.');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-card transition-all hover:border-gray-300/80">
      {/* Post Author Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <Avatar
            src={post.authorAvatar}
            name={post.authorName}
            size="md"
          />
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm text-gray-900">{post.authorName}</h4>
              {post.authorRole === 'faculty' && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded">
                  Faculty
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">
              {post.authorDept || 'CSE • EATM'} • 2h ago
            </p>
          </div>
        </div>

        {/* More Actions Dropdown */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
            aria-label="Post options"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-1 w-36 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setReportOpen(true);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-700 hover:bg-red-50 hover:text-red-700 transition"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Report Post</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Post Text Content */}
      <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line mb-3">
        {post.content}
      </p>

      {/* Post Image / Media Preview */}
      {post.mediaUrl && (
        <div className="rounded-xl overflow-hidden mb-4 border border-gray-100 max-h-[480px] bg-black/5">
          <img
            src={post.mediaUrl}
            alt="Post attachment"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Interaction Buttons Bar (Like, Comment, Share, Save) */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs text-gray-500">
        <div className="flex items-center gap-4 sm:gap-6">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 font-semibold transition group ${
              isLiked ? 'text-[#dc2626]' : 'hover:text-[#dc2626]'
            }`}
          >
            <Heart className={`w-4 h-4 transition-transform group-hover:scale-110 ${isLiked ? 'fill-current text-[#dc2626]' : ''}`} />
            <span>{likesCount}</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 font-semibold hover:text-[#0b4627] transition"
          >
            <MessageSquare className="w-4 h-4" />
            <span>{commentsCount}</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 font-semibold hover:text-blue-600 transition"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>

        <button
          onClick={handleSave}
          className={`p-1 rounded-lg transition ${
            isSaved ? 'text-[#0b4627]' : 'hover:text-gray-800'
          }`}
          aria-label="Bookmark post"
        >
          <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Expandable Comment Section */}
      {showComments && (
        <CommentSection
          postId={post.id}
          onCommentAdded={() => setCommentsCount(prev => prev + 1)}
        />
      )}

      {/* Report Modal */}
      <ReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        targetType="post"
        targetId={post.id}
        targetContent={post.content.slice(0, 100)}
      />
    </div>
  );
};
