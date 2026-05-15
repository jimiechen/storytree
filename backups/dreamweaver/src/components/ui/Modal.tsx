'use client';

import React, { useRef, useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export const Modal = React.forwardRef<HTMLDivElement, ModalProps>(
  ({ isOpen, onOpenChange, children, title, className = '' }, ref) => {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
          onOpenChange(false);
        }
      };

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
        document.body.style.overflow = 'hidden';
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.body.style.overflow = 'unset';
      };
    }, [isOpen, onOpenChange]);

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm"></div>
        <div
          ref={modalRef}
          className={`
            relative bg-white rounded-lg shadow-xl max-w-md w-full
            ${className}
          `}
        >
          {title && (
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">{title}</h3>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                ✕
              </button>
            </div>
          )}
          <div className="p-6">{children}</div>
        </div>
      </div>
    );
  }
);

Modal.displayName = 'Modal';

// 为了保持与其他组件库的一致性，添加这些导出
export const ModalContent = Modal;
export const ModalHeader = Modal;
export const ModalTitle = Modal;
export const ModalFooter = Modal;
export const ModalClose = Modal;
