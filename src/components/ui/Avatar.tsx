import React, { useState } from 'react';

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  online?: boolean;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  online,
  className = ''
}) => {
  const [imgError, setImgError] = useState(false);

  const sizeStyles = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm font-semibold',
    lg: 'w-14 h-14 text-base font-bold',
    xl: 'w-24 h-24 text-2xl font-bold border-4 border-white shadow-md',
  };

  const dotSizes = {
    xs: 'w-1.5 h-1.5 bottom-0 right-0',
    sm: 'w-2 h-2 bottom-0 right-0',
    md: 'w-2.5 h-2.5 bottom-0.5 right-0.5',
    lg: 'w-3.5 h-3.5 bottom-0.5 right-0.5 ring-2 ring-white',
    xl: 'w-5 h-5 bottom-1 right-1 ring-4 ring-white',
  };

  const getInitials = (n: string) => {
    if (!n) return 'U';
    const parts = n.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  };

  return (
    <div className={`relative inline-block shrink-0 ${className}`}>
      {src && !imgError ? (
        <img
          src={src}
          alt={name}
          onError={() => setImgError(true)}
          className={`rounded-full object-cover shadow-sm ring-1 ring-gray-200/80 ${sizeStyles[size]}`}
        />
      ) : (
        <div
          className={`rounded-full flex items-center justify-center bg-gradient-to-br from-[#0b4627] to-[#146841] text-white shadow-sm ring-1 ring-emerald-800 ${sizeStyles[size]}`}
        >
          {getInitials(name)}
        </div>
      )}

      {online !== undefined && (
        <span
          className={`absolute rounded-full ring-1 ring-white ${dotSizes[size]} ${
            online ? 'bg-emerald-500' : 'bg-gray-400'
          }`}
        />
      )}
    </div>
  );
};
