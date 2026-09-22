import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { Post } from '../../types';
import { fetchPostById } from '../../supabase/db';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { PostCard } from '../../components/posts/PostCard';
import { PostCardSkeleton } from '../../components/ui/Skeleton';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { EATM_EMBLEM } from '../../constants/assets';
import { 
  ArrowLeft, 
  Home, 
  Share2, 
  AlertCircle, 
  Sun, 
  Moon, 
  LogIn, 
  UserPlus,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';

export const PostDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Determine if this page is rendered inside a parent layout (e.g. /student/post/:id)
  const isNestedInsideLayout = 
    location.pathname.startsWith('/student/') || 
    location.pathname.startsWith('/faculty/');

  useEffect(() => {
    let isMounted = true;

    const loadPost = async () => {
      if (!id) {
        if (isMounted) {
          setError('No post ID provided');
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const rawId = id.trim();
        // Remove 'post-' or 'post_' prefix if present
        const strippedId = rawId.replace(/^post[-_]/, '');

        // Try primary lookup
        let found = await fetchPostById(rawId);

        // Fallback variants if not found
        if (!found && strippedId !== rawId) {
          found = await fetchPostById(strippedId);
        }
        if (!found && !rawId.startsWith('post_')) {
          found = await fetchPostById(`post_${strippedId}`);
        }
        if (!found && !rawId.startsWith('post-')) {
          found = await fetchPostById(`post-${strippedId}`);
        }

        if (isMounted) {
          if (found) {
            setPost(found);
          } else {
            setError('Post not found');
          }
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('Failed to load post:', err);
          setError('Unable to load this post');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadPost();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else if (user) {
      navigate(`/${user.role}/dashboard`);
    } else {
      navigate('/');
    }
  };

  const postDeletedHandler = () => {
    if (user) {
      navigate(`/${user.role}/dashboard`);
    } else {
      navigate('/');
    }
  };

  return (
    <div className={`min-h-screen ${isNestedInsideLayout ? '' : 'bg-[#f8faf9] dark:bg-[#0a120d]'} text-gray-800 dark:text-gray-100 font-sans transition-colors duration-150`}>
      {/* Standalone Header if rendered at root /post/:id */}
      {!isNestedInsideLayout && (
        <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#0f1b14]/95 backdrop-blur-md border-b border-gray-200/80 dark:border-[#1e3326] px-4 lg:px-8 py-2.5 transition-colors">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <Link to={user ? `/${user.role}/dashboard` : '/'} className="flex items-center gap-2.5 group">
              <img 
                src={EATM_EMBLEM} 
                alt="EATM Logo" 
                className="w-8 h-8 object-contain transition-transform group-hover:scale-105" 
              />
              <div className="flex flex-col">
                <span className="font-bold text-[#0b4627] dark:text-emerald-400 text-sm leading-tight tracking-tight">
                  EATM
                </span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">
                  CampusConnect
                </span>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              {/* Theme Toggle Button */}
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-[#0b4627] dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-[#182b20] rounded-xl transition focus:outline-none"
                title={`Switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} Mode`}
                aria-label="Toggle visual theme"
              >
                {resolvedTheme === 'dark' ? (
                  <Sun className="w-5 h-5 text-amber-400 transition-transform duration-200 hover:rotate-45" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-600 transition-transform duration-200 hover:-rotate-12" />
                )}
              </button>

              {user ? (
                <Link
                  to={`/${user.role}/dashboard`}
                  className="group inline-flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-emerald-50/90 dark:bg-[#16251c] hover:bg-emerald-100 dark:hover:bg-[#1b2f23] text-xs font-semibold text-[#0b4627] dark:text-emerald-300 border border-emerald-200/80 dark:border-[#1e3326] transition shadow-sm"
                >
                  <Avatar src={user.photoURL} name={user.displayName} size="xs" />
                  <span className="hidden sm:inline font-bold text-gray-900 dark:text-gray-100 group-hover:text-[#0b4627] dark:group-hover:text-emerald-300">
                    {user.displayName.split(' ')[0]}
                  </span>
                  <span className="hidden md:inline text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
                    • Portal
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login">
                    <Button variant="ghost" size="sm" icon={<LogIn className="w-4 h-4" />}>
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/register" className="hidden sm:block">
                    <Button variant="primary" size="sm" icon={<UserPlus className="w-4 h-4" />}>
                      Join Campus
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className="max-w-3xl mx-auto px-4 py-6 sm:py-8 space-y-6">
        {/* Navigation Bar */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-[#111d15] hover:bg-gray-50 dark:hover:bg-[#182b20] border border-gray-200/80 dark:border-[#1e3325] shadow-sm transition"
          >
            <ArrowLeft className="w-4 h-4 text-[#0b4627] dark:text-emerald-400" />
            <span>{user ? 'Back to Campus Feed' : 'Back to Home'}</span>
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-4">
            <PostCardSkeleton />
          </div>
        )}

        {/* Error / Not Found State */}
        {!loading && (error || !post) && (
          <div className="bg-white dark:bg-[#111d15] rounded-3xl p-8 sm:p-10 border border-gray-200/80 dark:border-[#1e3325] shadow-card text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200/60 dark:border-amber-900/40">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Post Not Available
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mt-1.5 leading-relaxed">
                This post may have been removed by its author, expired, or the shared link is incomplete.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                variant="primary"
                onClick={handleBack}
                icon={<Home className="w-4 h-4" />}
              >
                {user ? 'Return to Feed' : 'Go to Campus Home'}
              </Button>
            </div>
          </div>
        )}

        {/* Post Card View */}
        {!loading && post && (
          <div className="space-y-6">
            <PostCard 
              post={post} 
              onPostDeleted={postDeletedHandler} 
            />

            {/* Guest Sign-up Callout Banner if not logged in */}
            {!user && (
              <div className="bg-gradient-to-r from-emerald-950 via-[#0b4627] to-emerald-900 rounded-2xl p-6 text-white shadow-card flex flex-col sm:flex-row items-center justify-between gap-5 border border-emerald-800/50">
                <div className="space-y-1 text-center sm:text-left">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-emerald-200 text-[11px] font-semibold border border-white/10">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Official EATM Community</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold">
                    Join the conversation on CampusConnect
                  </h3>
                  <p className="text-xs text-emerald-100/80 max-w-md">
                    Sign in with your verified college credentials to like, share notes, comment, and connect with peers and faculty.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <Link to="/login">
                    <Button variant="outline" size="sm" className="bg-white/10 text-white border-white/30 hover:bg-white/20">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button variant="primary" size="sm" className="bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-bold border-none">
                      Join EATM
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
export default PostDetailPage;
