import React, { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padded?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  hover = false,
  padded = true,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`bg-white dark:bg-[#111d15] rounded-2xl border border-gray-200/80 dark:border-[#1e3325] text-gray-900 dark:text-gray-100 shadow-card transition-colors duration-150 ${
        hover ? 'transition-all duration-200 hover:shadow-card-hover hover:border-emerald-200 dark:hover:border-emerald-800/80' : ''
      } ${padded ? 'p-5 sm:p-6' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
