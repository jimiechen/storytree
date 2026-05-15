'use client';

import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`
          bg-white rounded-lg shadow-sm border border-gray-200
          ${className}
        `}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';

export const CardHeader = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`
          p-6 border-b border-gray-200
          ${className}
        `}
        {...props}
      />
    );
  }
);

CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className = '', ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={`
          text-lg font-medium text-gray-900
          ${className}
        `}
        {...props}
      />
    );
  }
);

CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className = '', ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={`
          text-sm text-gray-500
          ${className}
        `}
        {...props}
      />
    );
  }
);

CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`
          p-6
          ${className}
        `}
        {...props}
      />
    );
  }
);

CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`
          p-6 border-t border-gray-200 flex items-center justify-between
          ${className}
        `}
        {...props}
      />
    );
  }
);

CardFooter.displayName = 'CardFooter';
