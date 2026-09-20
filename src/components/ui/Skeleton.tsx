import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return <div className={`animate-pulse bg-gray-200/80 dark:bg-[#1c3224] rounded-xl ${className}`} />;
};

export const PostCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-[#111d15] rounded-2xl p-6 border border-gray-100 dark:border-[#1e3325] shadow-sm space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="w-11 h-11 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="w-1/3 h-4" />
          <Skeleton className="w-1/5 h-3" />
        </div>
      </div>
      <Skeleton className="w-full h-12" />
      <Skeleton className="w-full h-52 rounded-xl" />
      <div className="flex justify-between pt-2">
        <Skeleton className="w-20 h-6" />
        <Skeleton className="w-20 h-6" />
        <Skeleton className="w-20 h-6" />
      </div>
    </div>
  );
};
