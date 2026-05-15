import React, { FormEvent, useState, ReactNode } from 'react';

interface FormProps {
  children: ReactNode;
  onSubmit: (e: FormEvent) => void;
  className?: string;
}

export const Form: React.FC<FormProps> = ({ children, onSubmit, className = '' }) => {
  return (
    <form className={`space-y-6 ${className}`} onSubmit={onSubmit}>
      {children}
    </form>
  );
};
