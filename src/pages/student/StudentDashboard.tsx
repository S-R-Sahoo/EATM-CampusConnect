import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { fetchPosts } from '../../supabase/db';
import { Post } from '../../types';
import { CreatePostCard } from '../../components/posts/CreatePostCard';
import { PostCard } from '../../components/posts/PostCard';
import { RightSidebar } from '../../components/layout/RightSidebar';
import { PostCardSkeleton } from '../../components/ui/Skeleton';
import { 
  Calendar, MessageSquare, Briefcase, Bell, Radio,
  CheckCircle2, ArrowRight, GraduationCap, Building2, IdCard, Sparkles, User
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { DEFAULT_ENGINEER_AVATAR } from '../../constants/assets';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFeed = async () => {
    try {
      const data = await fetchPosts();
      setPosts(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();
  }, []);

  return (
    <div className="flex gap-6 items-start">
      {/* Central Feed Column */}
      <div className="flex-1 min-w-0 space-y-6">
        {/* Official EATM Student Identity & Welcome Card */}
        <div className="bg-gradient-to-r from-[#062615] via-[#0b4627] to-[#0e5631] rounded-3xl p-6 sm:p-7 text-white shadow-xl relative overflow-hidden border border-emerald-800/40">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4 sm:gap-5">
              <div className="relative shrink-0">
                <img
                  src={user?.photoURL || DEFAULT_ENGINEER_AVATAR}
                  alt={user?.displayName || 'Student'}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-4 ring-emerald-400/30 shadow-lg bg-emerald-950"
                />
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 ring-2 ring-[#0b4627] flex items-center justify-center text-white" title="Verified Active Student">
                  <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
                </span>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                    {user?.displayName || 'Campus Scholar'}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-400/15 border border-emerald-400/30 text-emerald-300 text-[11px] font-semibold">
                    <GraduationCap className="w-3 h-3 text-emerald-300" />
                    <span>{user?.role === 'student' ? 'Official Student' : user?.role ? user.role.toUpperCase() : 'Student'}</span>
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-emerald-200/90 font-medium">
                  {user?.rollNumber && (
                    <span className="flex items-center gap-1 font-mono text-emerald-100 bg-white/10 px-2 py-0.5 rounded-md border border-white/10">
                      <IdCard className="w-3 h-3 text-emerald-300" />
                      {user.rollNumber}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-emerald-300" />
                    {user?.department || 'Computer Science & Engineering'}
                  </span>
                  {(user?.year || user?.semester) && (
                    <span className="hidden sm:inline-block text-emerald-300/70">•</span>
                  )}
                  {(user?.year || user?.semester) && (
                    <span>
                      {user?.year ? `${user.year}` : ''} {user?.semester ? `(${user.semester})` : ''}
                    </span>
                  )}
                </div>

                <p className="text-xs text-emerald-100/80 mt-2 line-clamp-1 max-w-lg">
                  {user?.bio || 'Student at Einstein Academy of Technology and Management (EATM).'}
                </p>
              </div>
            </div>

            <div className="flex sm:flex-col md:items-end justify-between gap-2.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-emerald-800/60">
              <Link
                to="/student/profile"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-emerald-50 text-[#0b4627] font-bold text-xs shadow-md hover:shadow-lg transition-all"
              >
                <User className="w-3.5 h-3.5" />
                <span>My Official Profile</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <span className="text-[11px] text-emerald-300/80 font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>EATM Digital Campus</span>
              </span>
            </div>
          </div>
        </div>

        {/* 4 Stats Cards (Matching Reference Layout) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <Link
            to="/student/events"
            className="bg-white dark:bg-[#111d15] rounded-2xl p-4 border border-gray-200/80 dark:border-[#1e3325] shadow-card hover:shadow-card-hover transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Upcoming Events</span>
              <div className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-gray-900 dark:text-gray-100">3</div>
          </Link>

          <Link
            to="/student/messages"
            className="bg-white dark:bg-[#111d15] rounded-2xl p-4 border border-gray-200/80 dark:border-[#1e3325] shadow-card hover:shadow-card-hover transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Unread Messages</span>
              <div className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950/60 text-[#dc2626] dark:text-red-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <MessageSquare className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-gray-900 dark:text-gray-100">5</div>
          </Link>

          <Link
            to="/student/opportunities"
            className="bg-white dark:bg-[#111d15] rounded-2xl p-4 border border-gray-200/80 dark:border-[#1e3325] shadow-card hover:shadow-card-hover transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Opportunities</span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Briefcase className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-gray-900 dark:text-gray-100">8</div>
          </Link>

          <Link
            to="/student/notifications"
            className="bg-white dark:bg-[#111d15] rounded-2xl p-4 border border-gray-200/80 dark:border-[#1e3325] shadow-card hover:shadow-card-hover transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Notifications</span>
              <div className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Bell className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-gray-900 dark:text-gray-100">12</div>
          </Link>
        </div>

        {/* Create Post Component */}
        <CreatePostCard onPostCreated={loadFeed} />

        {/* Feed Posts */}
        <div className="space-y-5">
          {loading ? (
            <>
              <PostCardSkeleton />
              <PostCardSkeleton />
            </>
          ) : posts.length === 0 ? (
            <div className="bg-white dark:bg-[#111d15] rounded-2xl p-12 text-center border border-gray-200 dark:border-[#1e3325] text-gray-500 dark:text-gray-400">
              <p className="font-semibold text-base">No posts yet in the campus feed.</p>
              <p className="text-xs mt-1">Be the first to share an achievement, question, or note!</p>
            </div>
          ) : (
            posts.map(post => (
              <PostCard key={post.id} post={post} onPostDeleted={loadFeed} />
            ))
          )}
        </div>
      </div>

      {/* Right Sidebar Column */}
      <RightSidebar />
    </div>
  );
};
