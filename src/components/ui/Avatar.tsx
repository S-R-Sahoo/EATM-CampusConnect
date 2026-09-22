import React, { useState, useEffect } from 'react';
import { isCustomPhoto, getInitials, getAvatarBgGradient } from '../../constants/assets';

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
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

  // Reset imgError whenever the src prop updates (e.g. user uploads a photo)
  useEffect(() => {
    setImgError(false);
  }, [src]);

  const sizeStyles = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs font-semibold',
    md: 'w-10 h-10 text-xs sm:text-sm font-bold',
    lg: 'w-14 h-14 text-base sm:text-lg font-bold',
    xl: 'w-24 h-24 text-2xl sm:text-3xl font-black border-4 border-white dark:border-[#111d15] shadow-md',
    '2xl': 'w-32 h-32 sm:w-36 sm:h-36 text-4xl sm:text-5xl font-black ring-4 ring-white dark:ring-[#111d15] shadow-xl',
  };

  const dotSizes = {
    xs: 'w-1.5 h-1.5 bottom-0 right-0',
    sm: 'w-2 h-2 bottom-0 right-0',
    md: 'w-2.5 h-2.5 bottom-0.5 right-0.5',
    lg: 'w-3.5 h-3.5 bottom-0.5 right-0.5 ring-2 ring-white dark:ring-[#111d15]',
    xl: 'w-5 h-5 bottom-1 right-1 ring-4 ring-white dark:ring-[#111d15]',
    '2xl': 'w-6 h-6 bottom-2 right-2 ring-4 ring-white dark:ring-[#111d15]',
  };

  const hasPhoto = isCustomPhoto(src) && !imgError;
  const initials = getInitials(name);
  const bgGradient = getAvatarBgGradient(name);

  return (
    <div className={`relative inline-block shrink-0 select-none ${className}`}>
      {hasPhoto && src ? (
        <img
          src={src}
          alt={name || 'User'}
          onError={() => setImgError(true)}
          className={`rounded-full object-cover shadow-xs ring-1 ring-black/10 dark:ring-white/10 ${sizeStyles[size]}`}
        />
      ) : (
        <div
          className={`rounded-full bg-gradient-to-br ${bgGradient} text-white flex items-center justify-center shadow-xs ring-1 ring-white/20 tracking-wider font-sans uppercase ${sizeStyles[size]}`}
          title={name || 'User'}
        >
          <span>{initials}</span>
        </div>
      )}

      {online !== undefined && (
        <span
          className={`absolute rounded-full ring-1 ring-white dark:ring-[#111d15] ${dotSizes[size]} ${
            online ? 'bg-emerald-500' : 'bg-gray-400'
          }`}
        />
      )}
    </div>
  );
};
