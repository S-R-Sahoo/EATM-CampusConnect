import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'green' | 'red' | 'blue' | 'amber' | 'purple' | 'gray';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'green',
  size = 'sm',
  className = ''
}) => {
  const sizeStyles = {
    sm: 'text-xs px-2.5 py-0.5 font-medium',
    md: 'text-sm px-3 py-1 font-medium',
  };

  const variantStyles = {
    green: 'bg-emerald-50 text-emerald-800 border border-emerald-200/60',
    red: 'bg-red-50 text-red-700 border border-red-200/60',
    blue: 'bg-sky-50 text-sky-800 border border-sky-200/60',
    amber: 'bg-amber-50 text-amber-800 border border-amber-200/60',
    purple: 'bg-purple-50 text-purple-800 border border-purple-200/60',
    gray: 'bg-gray-100 text-gray-700 border border-gray-200/60',
  };

  return (
    <span className={`inline-flex items-center rounded-full transition-colors ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
};
