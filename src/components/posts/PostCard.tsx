import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Post } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { toggleLikePost, votePoll, deletePost, getPostShareUrl, normalizePostMedia } from '../../supabase/db';
import { Avatar } from '../ui/Avatar';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { CommentSection } from './CommentSection';
import { ReportModal } from '../common/ReportModal';
import { ShareModal } from './ShareModal';
import { 
  Heart, MessageSquare, Share2, Bookmark, 
  MoreHorizontal, Flag, BarChart2, CheckCircle2,
  Globe, Users, Trash2, Copy, EyeOff,
  ChevronLeft, ChevronRight, Layers, X
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
  const [isLiking, setIsLiking] = useState(false);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount || 0);
  const [sharesCount, setSharesCount] = useState(post.sharesCount || 0);
  const [showComments, setShowComments] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [hidden, setHidden] = useState(false);

  // Poll state
  const [pollData, setPollData] = useState(post.poll);
  const [voting, setVoting] = useState(false);

  // Instagram-style media carousel normalization
  const { mediaUrls: mediaList } = normalizePostMedia(post);

  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);
  const touchEndYRef = useRef<number | null>(null);

  // Keep active index in bounds if mediaList changes
  useEffect(() => {
    if (activeMediaIndex >= mediaList.length) {
      setActiveMediaIndex(0);
    }
  }, [mediaList.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches && e.touches.length > 0) {
      touchStartXRef.current = e.touches[0].clientX;
      touchStartYRef.current = e.touches[0].clientY;
      touchEndXRef.current = e.touches[0].clientX;
      touchEndYRef.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches && e.touches.length > 0) {
      touchEndXRef.current = e.touches[0].clientX;
      touchEndYRef.current = e.touches[0].clientY;
    }
  };

  const handleTouchEnd = () => {
    if (
      touchStartXRef.current === null ||
      touchEndXRef.current === null ||
      touchStartYRef.current === null ||
      touchEndYRef.current === null
    ) {
      touchStartXRef.current = null;
      touchStartYRef.current = null;
      touchEndXRef.current = null;
      touchEndYRef.current = null;
      return;
    }

    const diffX = touchStartXRef.current - touchEndXRef.current;
    const diffY = touchStartYRef.current - touchEndYRef.current;

    // Only recognize as a carousel swipe if the gesture is predominantly horizontal
    // This allows smooth natural vertical scrolling without accidental image switching or page wobbling
    if (Math.abs(diffX) > Math.abs(diffY)) {
      const minSwipeDistance = 35;
      if (diffX > minSwipeDistance && activeMediaIndex < mediaList.length - 1) {
        // Swiped left -> Go to next image
        setActiveMediaIndex(prev => prev + 1);
      } else if (diffX < -minSwipeDistance && activeMediaIndex > 0) {
        // Swiped right -> Go to previous image
        setActiveMediaIndex(prev => prev - 1);
      }
    }

    touchStartXRef.current = null;
    touchStartYRef.current = null;
    touchEndXRef.current = null;
    touchEndYRef.current = null;
  };

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxOpen(false);
      } else if (e.key === 'ArrowLeft' && mediaList.length > 1) {
        setActiveMediaIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight' && mediaList.length > 1) {
        setActiveMediaIndex(prev => Math.min(mediaList.length - 1, prev + 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, mediaList.length]);

  // Synchronize component state whenever incoming post props update
  useEffect(() => {
    if (isLiking) return;
    setLikesCount(post.likesCount ?? 0);
    setIsLiked(user ? (post.likes || []).includes(user.id) : false);
    setCommentsCount(post.commentsCount ?? 0);
    setSharesCount(post.sharesCount ?? 0);
    setPollData(post.poll);
  }, [post.id, post.likesCount, post.likes, post.commentsCount, post.sharesCount, post.poll, user?.id, isLiking]);

  // Live broadcast listener for instant cross-tab / feed updates
  useEffect(() => {
    const handleLikeEvent = (e: CustomEvent<{ postId: string; likes: string[]; likesCount: number }>) => {
      if (e.detail && e.detail.postId === post.id) {
        setLikesCount(e.detail.likesCount);
        post.likesCount = e.detail.likesCount;
        post.likes = e.detail.likes;
        if (user) {
          setIsLiked(e.detail.likes.includes(user.id));
        }
      }
    };
    window.addEventListener('eatm_post_like', handleLikeEvent as EventListener);
    return () => {
      window.removeEventListener('eatm_post_like', handleLikeEvent as EventListener);
    };
  }, [post.id, user?.id]);

  const menuRef = useRef<HTMLDivElement>(null);

  // Whether current user is the author or admin
  const isAuthor = (user && post.authorId && user.id === post.authorId) || user?.role === 'admin';

  // Click outside to close dropdown menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  const handleLike = async () => {
    if (!user || isLiking) return;
    setIsLiking(true);
    const previousState = isLiked;
    const previousCount = likesCount;

    // Optimistic UI update
    const nextState = !previousState;
    const nextCount = nextState ? previousCount + 1 : Math.max(0, previousCount - 1);
    setIsLiked(nextState);
    setLikesCount(nextCount);

    // Update post prop in-place immediately so any re-renders retain the new like state
    if (nextState) {
      post.likes = Array.from(new Set([...(post.likes || []), user.id]));
    } else {
      post.likes = (post.likes || []).filter(id => id !== user.id);
    }
    post.likesCount = nextCount;

    try {
      const res = await toggleLikePost(post.id, user.id);
      setIsLiked(res.liked);
      setLikesCount(res.count);
      if (res.post?.likes) {
        post.likes = res.post.likes;
      }
      post.likesCount = res.count;
    } catch (e) {
      // Revert if error
      setIsLiked(previousState);
      setLikesCount(previousCount);
      post.likesCount = previousCount;
      if (previousState) {
        post.likes = Array.from(new Set([...(post.likes || []), user.id]));
      } else {
        post.likes = (post.likes || []).filter(id => id !== user.id);
      }
    } finally {
      setIsLiking(false);
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
    setShareModalOpen(true);
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    if (!isSaved) {
      success('Post saved to your bookmarks.');
    } else {
      info('Post removed from bookmarks.');
    }
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      await deletePost(post.id);
      success('Your post has been permanently deleted.', 'Post Deleted');
      setDeleteModalOpen(false);
      onPostDeleted?.();
    } catch (err: any) {
      console.error('Delete post error:', err);
    } finally {
      setDeleting(false);
    }
  };

  if (hidden) {
    return (
      <div className="bg-gray-50/90 dark:bg-[#111d15] rounded-2xl border border-dashed border-gray-200 dark:border-[#1e3325] p-4 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between transition-all">
        <span>Post hidden from your feed.</span>
        <button
          type="button"
          onClick={() => setHidden(false)}
          className="text-[#0b4627] dark:text-emerald-400 font-semibold hover:underline"
        >
          Undo
        </button>
      </div>
    );
  }

  const totalPollVotes = pollData?.options.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0) || 0;
  const hasVotedAny = pollData?.options.some(opt => opt.votes?.includes(user?.id || ''));

  return (
    <div id={`post-${post.id}`} className="bg-white dark:bg-[#111d15] rounded-2xl border border-gray-200/80 dark:border-[#1e3325] p-5 shadow-card transition-all hover:border-gray-300/80 dark:hover:border-[#2b4935]">
      {/* Post Author Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <Link
          to={post.authorId ? `/profile/${post.authorId}` : '#'}
          className="flex items-center gap-3 group/author hover:opacity-95 transition"
          title="View Author Profile"
        >
          <Avatar
            src={post.authorAvatar}
            name={post.authorName}
            size="md"
          />
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100 group-hover/author:text-[#0b4627] dark:group-hover/author:text-emerald-400 transition-colors">
                {post.authorName}
              </h4>
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
        </Link>

        {/* More Actions Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#182b20] rounded-lg transition"
            aria-label="Post options"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-1.5 w-60 bg-white dark:bg-[#16251c] rounded-2xl shadow-xl border border-gray-100 dark:border-[#1e3325] py-1.5 z-20 animate-in fade-in zoom-in-95">
              {/* Save / Bookmark Post */}
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  handleSave();
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1f3527] transition text-left"
              >
                <Bookmark className={`w-4 h-4 text-gray-400 dark:text-gray-500 ${isSaved ? 'fill-current text-[#0b4627] dark:text-emerald-400' : ''}`} />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {isSaved ? 'Remove Bookmark' : 'Save Post'}
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500">
                    {isSaved ? 'Remove from your saved posts' : 'Add this to your saved posts'}
                  </p>
                </div>
              </button>

              {/* Copy Link */}
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  const postUrl = getPostShareUrl(post.id);
                  navigator.clipboard?.writeText(postUrl);
                  success('Post link copied to clipboard!');
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1f3527] transition text-left"
              >
                <Copy className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">Copy Link</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500">Copy direct link to this post</p>
                </div>
              </button>

              {/* Share */}
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setShareModalOpen(true);
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1f3527] transition text-left"
              >
                <Share2 className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">Share Post</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500">Share via WhatsApp, X, etc.</p>
                </div>
              </button>

              {!isAuthor && (
                <>
                  {/* Hide Post */}
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setHidden(true);
                      info('Post hidden from your feed.');
                    }}
                    className="w-full flex items-center gap-3 px-3.5 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1f3527] transition text-left"
                  >
                    <EyeOff className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">Hide Post</p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500">See fewer posts like this</p>
                    </div>
                  </button>

                  <div className="my-1 border-t border-gray-100 dark:border-[#1e3325]" />

                  {/* Report Post */}
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setReportOpen(true);
                    }}
                    className="w-full flex items-center gap-3 px-3.5 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition text-left"
                  >
                    <Flag className="w-4 h-4 text-red-500" />
                    <div>
                      <p className="font-semibold">Report Post</p>
                      <p className="text-[10px] text-red-400 dark:text-red-500">I'm concerned about this post</p>
                    </div>
                  </button>
                </>
              )}

              {isAuthor && (
                <>
                  <div className="my-1 border-t border-gray-100 dark:border-[#1e3325]" />

                  {/* Delete Post (Official Destructive Action) */}
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setDeleteModalOpen(true);
                    }}
                    className="w-full flex items-center gap-3 px-3.5 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition text-left group"
                  >
                    <Trash2 className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform" />
                    <div>
                      <p className="font-semibold">Delete Post</p>
                      <p className="text-[10px] text-red-400 dark:text-red-500">Permanently remove this post</p>
                    </div>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Post Text Content */}
      {post.content && (
        <p className="text-sm sm:text-base text-gray-900 dark:text-gray-100 font-normal leading-relaxed whitespace-pre-line mb-3.5">
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

      {/* Post Image(s) / Instagram-Style Clean Smooth Carousel */}
      {mediaList.length > 0 && (
        <div 
          className="relative rounded-2xl overflow-hidden mb-3.5 border border-gray-100 dark:border-[#1e3325] bg-neutral-900 select-none group touch-pan-y overscroll-x-contain"
          style={{ touchAction: 'pan-y' }}
        >
          {/* Smooth Horizontal Sliding Carousel Track */}
          <div 
            className="flex w-full transition-transform duration-300 ease-out will-change-transform touch-pan-y"
            style={{ transform: `translateX(-${activeMediaIndex * 100}%)`, touchAction: 'pan-y' }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {mediaList.map((url, idx) => (
              <div 
                key={idx} 
                className="w-full shrink-0 relative aspect-square sm:aspect-[4/3] max-h-[500px] flex items-center justify-center overflow-hidden bg-neutral-900"
              >
                <img
                  src={url}
                  alt={`Post photo ${idx + 1}`}
                  onClick={() => setLightboxOpen(true)}
                  className="w-full h-full object-cover cursor-pointer select-none"
                  loading={idx === 0 ? "eager" : "lazy"}
                />
              </div>
            ))}
          </div>

          {/* Instagram-style Top-Right Counter Badge (Minimalist) */}
          {mediaList.length > 1 && (
            <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-medium tracking-wide shadow-sm pointer-events-none z-10">
              {activeMediaIndex + 1}/{mediaList.length}
            </div>
          )}

          {/* Desktop-only subtle hover chevrons (Completely hidden on mobile) */}
          {mediaList.length > 1 && activeMediaIndex > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveMediaIndex(prev => Math.max(0, prev - 1));
              }}
              className="hidden sm:flex absolute left-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/30 hover:bg-black/60 text-white/80 hover:text-white backdrop-blur-xs items-center justify-center transition-all opacity-0 group-hover:opacity-100 z-10 active:scale-90"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-4 h-4 stroke-[2]" />
            </button>
          )}

          {mediaList.length > 1 && activeMediaIndex < mediaList.length - 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveMediaIndex(prev => Math.min(mediaList.length - 1, prev + 1));
              }}
              className="hidden sm:flex absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/30 hover:bg-black/60 text-white/80 hover:text-white backdrop-blur-xs items-center justify-center transition-all opacity-0 group-hover:opacity-100 z-10 active:scale-90"
              aria-label="Next image"
            >
              <ChevronRight className="w-4 h-4 stroke-[2]" />
            </button>
          )}

          {/* Instagram-style Delicate Floating Bottom Pagination Dots */}
          {mediaList.length > 1 && (
            <div className="absolute bottom-2.5 inset-x-0 flex justify-center items-center gap-1.5 pointer-events-none z-10">
              {mediaList.map((_, idx) => (
                <span
                  key={idx}
                  className={`rounded-full transition-all duration-300 ${
                    idx === activeMediaIndex
                      ? 'w-1.5 h-1.5 bg-[#0095f6] dark:bg-emerald-400 scale-125 shadow-sm'
                      : 'w-1.5 h-1.5 bg-white/60 drop-shadow-xs'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Interaction Buttons Bar (Like, Comment, Share, Save) */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-[#1e3325] text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-4 sm:gap-6">
          <button
            type="button"
            onClick={handleLike}
            disabled={isLiking}
            className={`flex items-center gap-1.5 font-semibold transition group ${
              isLiked ? 'text-[#dc2626]' : 'hover:text-[#dc2626]'
            } ${isLiking ? 'opacity-80 cursor-not-allowed' : ''}`}
          >
            <Heart className={`w-4 h-4 transition-transform group-hover:scale-110 ${isLiked ? 'fill-current text-[#dc2626]' : ''}`} />
            <span>{likesCount}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 font-semibold hover:text-[#0b4627] dark:hover:text-emerald-400 transition"
          >
            <MessageSquare className="w-4 h-4" />
            <span>{commentsCount}</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-1.5 font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition"
            title="Share post"
          >
            <Share2 className="w-4 h-4" />
            <span>{sharesCount > 0 ? sharesCount : 'Share'}</span>
          </button>
        </div>

        <button
          type="button"
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

      {/* Share Modal */}
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        post={post}
        onShared={(newCount) => setSharesCount(newCount)}
      />

      {/* Official Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => !deleting && setDeleteModalOpen(false)}
        title="Delete Post"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">
                Delete this post?
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                This action cannot be undone. This post will be permanently removed from the campus feed.
              </p>
            </div>
          </div>

          {post.content && (
            <div className="p-3 bg-gray-50 dark:bg-[#16251c] rounded-xl border border-gray-100 dark:border-[#1e3325] text-xs text-gray-600 dark:text-gray-300 italic line-clamp-2">
              "{post.content}"
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-[#1e3325]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeleteModalOpen(false)}
              disabled={deleting}
              className="px-4 text-xs font-semibold"
            >
              Cancel
            </Button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
            >
              {deleting ? (
                <span>Deleting...</span>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Post</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Full-Screen Image Lightbox Modal */}
      {lightboxOpen && mediaList.length > 0 && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-between p-3 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Top Bar with Author Info, Photo Counter & Close Button */}
          <div 
            className="w-full max-w-5xl flex items-center justify-between pb-3 text-white shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <Avatar src={post.authorAvatar} name={post.authorName} size="sm" />
              <div className="text-left">
                <p className="text-sm font-bold leading-none text-white">{post.authorName}</p>
                {mediaList.length > 1 ? (
                  <p className="text-xs text-emerald-400 mt-1 font-semibold">
                    Photo {activeMediaIndex + 1} of {mediaList.length}
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 mt-1">{post.authorDept || 'Campus Post'}</p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              className="p-2 rounded-full bg-white/15 hover:bg-white/25 text-white transition active:scale-95 border border-white/10"
              aria-label="Close full view"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Lightbox Main Image & Navigation Chevrons */}
          <div 
            className="relative flex-1 w-full max-w-5xl flex items-center justify-center overflow-hidden my-auto touch-pan-y"
            style={{ touchAction: 'pan-y' }}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Smooth Slide Track */}
            <div 
              className="flex w-full h-full items-center transition-transform duration-300 ease-out will-change-transform touch-pan-y"
              style={{ transform: `translateX(-${activeMediaIndex * 100}%)`, touchAction: 'pan-y' }}
            >
              {mediaList.map((url, idx) => (
                <div key={idx} className="w-full shrink-0 h-full flex items-center justify-center p-2">
                  <img
                    src={url}
                    alt={`Full size attachment ${idx + 1}`}
                    className="max-h-[75vh] max-w-full object-contain rounded-xl shadow-2xl select-none"
                  />
                </div>
              ))}
            </div>

            {mediaList.length > 1 && activeMediaIndex > 0 && (
              <button
                type="button"
                onClick={() => setActiveMediaIndex(prev => Math.max(0, prev - 1))}
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/30 hover:bg-black/60 text-white/70 hover:text-white backdrop-blur-xs border border-white/10 transition-all flex items-center justify-center active:scale-90 z-20 group"
                aria-label="Previous photo"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.75] transition-transform group-hover:-translate-x-0.5" />
              </button>
            )}

            {mediaList.length > 1 && activeMediaIndex < mediaList.length - 1 && (
              <button
                type="button"
                onClick={() => setActiveMediaIndex(prev => Math.min(mediaList.length - 1, prev + 1))}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/30 hover:bg-black/60 text-white/70 hover:text-white backdrop-blur-xs border border-white/10 transition-all flex items-center justify-center active:scale-90 z-20 group"
                aria-label="Next photo"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.75] transition-transform group-hover:translate-x-0.5" />
              </button>
            )}
          </div>

          {/* Lightbox Thumbnails Strip (if > 1 image) */}
          {mediaList.length > 1 && (
            <div 
              className="w-full max-w-2xl flex items-center justify-center gap-2 pt-3 shrink-0 overflow-x-auto overscroll-x-contain no-scrollbar"
              onClick={(e) => e.stopPropagation()}
            >
              {mediaList.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveMediaIndex(idx)}
                  className={`w-12 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition ${
                    idx === activeMediaIndex
                      ? 'border-emerald-500 scale-105 shadow-md ring-2 ring-emerald-400/40'
                      : 'border-transparent opacity-50 hover:opacity-100'
                  }`}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
