'use client';

import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'outline';
  children: React.ReactNode;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'default', className = '', children, ...props }, ref) => {
    const variantClasses = {
      default: 'bg-gray-100 text-gray-800',
      primary: 'bg-indigo-100 text-indigo-800',
      secondary: 'bg-green-100 text-green-800',
      outline: 'bg-transparent border border-gray-300 text-gray-700',
    };

    return (
      <span
        ref={ref}
        className={`
          inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
          ${variantClasses[variant]}
          ${className}
        `}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
