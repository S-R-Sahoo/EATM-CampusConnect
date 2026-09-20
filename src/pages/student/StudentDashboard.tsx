import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { fetchPosts } from '../../firebase/firestore';
import { Post } from '../../types';
import { CreatePostCard } from '../../components/posts/CreatePostCard';
import { PostCard } from '../../components/posts/PostCard';
import { RightSidebar } from '../../components/layout/RightSidebar';
import { PostCardSkeleton } from '../../components/ui/Skeleton';
import { Calendar, MessageSquare, Briefcase, Bell, Radio } from 'lucide-react';
import { Link } from 'react-router-dom';

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

  const firstName = user?.displayName ? user.displayName.split(' ')[0] : 'Student';

  return (
    <div className="flex gap-6 items-start">
      {/* Central Feed Column */}
      <div className="flex-1 min-w-0 space-y-6">
        {/* Welcome Banner Card */}
        <div className="bg-gradient-to-r from-emerald-900 via-[#0b4627] to-emerald-800 rounded-3xl p-6 sm:p-7 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-700/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-emerald-200 text-xs font-semibold mb-3">
              <Radio className="w-3.5 h-3.5 text-emerald-300" />
              <span>Campus Community Feed</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Good Morning, {firstName}!
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100 mt-1 font-medium">
              Keep learning, keep growing. Stay connected with your campus peers and societies today.
            </p>
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
