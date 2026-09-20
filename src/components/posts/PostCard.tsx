import React, { useState } from 'react';
import { Post } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { toggleLikePost, votePoll } from '../../firebase/firestore';
import { Avatar } from '../ui/Avatar';
import { CommentSection } from './CommentSection';
import { ReportModal } from '../common/ReportModal';
import { 
  Heart, MessageSquare, Share2, Bookmark, 
  MoreHorizontal, Flag, BarChart2, CheckCircle2,
  Globe, Users
} from 'lucide-react';

interface PostCardProps {
  post: Post;
  onPostDeleted?: () => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onPostDeleted }) => {
  const { user } = useAuth();
  const { success, info } = useToast();

  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [isLiked, setIsLiked] = useState(user ? post.likes?.includes(user.id) : false);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount || 0);
  const [showComments, setShowComments] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  // Poll state
  const [pollData, setPollData] = useState(post.poll);
  const [voting, setVoting] = useState(false);

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

  const handleVote = async (optionId: string) => {
    if (!user || voting || !pollData) return;
    setVoting(true);

    // Optimistic vote update
    const previousPoll = pollData;
    const updatedOptions = pollData.options.map(opt => {
      const votes = opt.votes || [];
      if (opt.id === optionId) {
        if (votes.includes(user.id)) {
          return { ...opt, votes: votes.filter(id => id !== user.id) };
        } else {
          return { ...opt, votes: [...votes, user.id] };
        }
      } else {
        return { ...opt, votes: votes.filter(id => id !== user.id) };
      }
    });

    setPollData({ ...pollData, options: updatedOptions });

    try {
      const updatedPost = await votePoll(post.id, optionId, user.id);
      if (updatedPost?.poll) {
        setPollData(updatedPost.poll);
      }
    } catch (e) {
      setPollData(previousPoll);
    } finally {
      setVoting(false);
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

  const totalPollVotes = pollData?.options.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0) || 0;
  const hasVotedAny = pollData?.options.some(opt => opt.votes?.includes(user?.id || ''));

  return (
    <div className="bg-white dark:bg-[#111d15] rounded-2xl border border-gray-200/80 dark:border-[#1e3325] p-5 shadow-card transition-all hover:border-gray-300/80 dark:hover:border-[#2b4935]">
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
              <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">{post.authorName}</h4>
              {post.authorRole === 'faculty' && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 rounded">
                  Faculty
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span>{post.authorDept || 'CSE • EATM'}</span>
              <span>•</span>
              {post.visibility === 'connections' ? (
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium" title="Friends (People who followed each other)">
                  <Users className="w-3 h-3" /> Friends
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500 font-medium" title="Public (Everyone)">
                  <Globe className="w-3 h-3" /> Public
                </span>
              )}
            </div>
          </div>
        </div>

        {/* More Actions Dropdown */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#182b20] rounded-lg transition"
            aria-label="Post options"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-[#16251c] rounded-xl shadow-lg border border-gray-100 dark:border-[#1e3325] py-1 z-20">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setReportOpen(true);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-700 dark:hover:text-red-400 transition"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Report Post</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Post Text Content */}
      {post.content && (
        <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-line mb-3">
          {post.content}
        </p>
      )}

      {/* Campus Poll Card (if post has poll) */}
      {pollData && (
        <div className="mb-4 bg-gray-50/80 dark:bg-[#16251c] rounded-xl p-4 border border-gray-200/70 dark:border-[#1e3325]">
          <div className="flex items-center gap-1.5 mb-2.5 text-xs font-bold text-[#0b4627] dark:text-emerald-400">
            <BarChart2 className="w-4 h-4" />
            <span>Campus Poll</span>
          </div>
          <h5 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-3">
            {pollData.question}
          </h5>
          <div className="space-y-2 mb-2.5">
            {pollData.options.map(opt => {
              const optionVotes = opt.votes?.length || 0;
              const percentage = totalPollVotes > 0 ? Math.round((optionVotes / totalPollVotes) * 100) : 0;
              const isUserSelected = !!user && (opt.votes?.includes(user.id) || false);

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleVote(opt.id)}
                  disabled={!user || voting}
                  className={`w-full text-left relative overflow-hidden rounded-xl border p-2.5 transition-all text-xs ${
                    isUserSelected
                      ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/40 font-semibold'
                      : 'border-gray-200 dark:border-[#203728] hover:border-emerald-300 dark:hover:border-emerald-700 bg-white dark:bg-[#111d15]'
                  }`}
                >
                  {/* Percentage background fill bar */}
                  {totalPollVotes > 0 && (
                    <div
                      className={`absolute inset-y-0 left-0 transition-all duration-500 rounded-xl ${
                        isUserSelected
                          ? 'bg-emerald-200/60 dark:bg-emerald-800/50'
                          : 'bg-gray-100 dark:bg-[#1c3024]'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  )}
                  <div className="relative flex items-center justify-between z-10 gap-2">
                    <span className="flex items-center gap-2 text-gray-800 dark:text-gray-200">
                      {isUserSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                      <span className="truncate">{opt.text}</span>
                    </span>
                    <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 shrink-0">
                      {percentage}%
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium flex items-center justify-between">
            <span>{totalPollVotes} {totalPollVotes === 1 ? 'vote' : 'votes'}</span>
            {hasVotedAny && <span className="text-emerald-700 dark:text-emerald-400">Vote recorded</span>}
          </div>
        </div>
      )}

      {/* Post Image / Media Preview */}
      {post.mediaUrl && (
        <div className="rounded-xl overflow-hidden mb-4 border border-gray-100 dark:border-[#1e3325] max-h-[480px] bg-black/5 dark:bg-black/20">
          <img
            src={post.mediaUrl}
            alt="Post attachment"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Interaction Buttons Bar (Like, Comment, Share, Save) */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-[#1e3325] text-xs text-gray-500 dark:text-gray-400">
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
            className="flex items-center gap-1.5 font-semibold hover:text-[#0b4627] dark:hover:text-emerald-400 transition"
          >
            <MessageSquare className="w-4 h-4" />
            <span>{commentsCount}</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>

        <button
          onClick={handleSave}
          className={`p-1 rounded-lg transition ${
            isSaved ? 'text-[#0b4627] dark:text-emerald-400' : 'hover:text-gray-800 dark:hover:text-gray-200'
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
