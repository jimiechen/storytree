'use client';

import React, { useState, useRef, useEffect } from 'react';

interface SelectItem {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  items: SelectItem[];
  placeholder?: string;
  error?: string;
  className?: string;
}

export const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  ({ label, value, onChange, items, placeholder = '请选择', error, className = '' }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedValue, setSelectedValue] = useState(value || '');
    const [selectedLabel, setSelectedLabel] = useState('');
    const selectRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (value) {
        setSelectedValue(value);
        const item = items.find(item => item.value === value);
        if (item) {
          setSelectedLabel(item.label);
        }
      }
    }, [value, items]);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);

    const handleSelect = (item: SelectItem) => {
      setSelectedValue(item.value);
      setSelectedLabel(item.label);
      setIsOpen(false);
      if (onChange) {
        onChange(item.value);
      }
    };

    return (
      <div className={`w-full ${className}`} ref={ref}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <div 
          ref={selectRef}
          className={`
            relative
            ${error ? 'border-red-500' : 'border-gray-300'}
          `}
        >
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`
              w-full px-3 py-2 
              border rounded-md shadow-sm 
              focus:outline-none focus:ring-indigo-500 focus:border-indigo-500
              ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}
              flex justify-between items-center
            `}
          >
            <span className={selectedValue ? 'text-gray-900' : 'text-gray-500'}>
              {selectedValue ? selectedLabel : placeholder}
            </span>
            <span className={`
              ml-2
              ${isOpen ? 'rotate-180' : ''}
              transition-transform duration-200
            `}>
              ▼
            </span>
          </button>
          {isOpen && (
            <div className="
              absolute z-10 mt-1 w-full 
              bg-white border border-gray-300 rounded-md shadow-sm
              max-h-60 overflow-auto
            ">
              {items.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => handleSelect(item)}
                  className={`
                    w-full text-left px-3 py-2
                    hover:bg-gray-100
                    ${selectedValue === item.value ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'}
                  `}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

// 为了保持与其他组件库的一致性，添加这些导出
export const SelectContent = Select;
export const SelectItem = Select;
export const SelectTrigger = Select;
export const SelectValue = Select;
