import type { Component, JSX } from 'solid-js';
import { NovelIcon } from '../layout/novel-icon';

type ButtonVariant = 'filled' | 'tonal' | 'outlined' | 'text' | 'icon';
type ButtonSize = 'sm' | 'md' | 'lg';

interface NovelButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  iconPosition?: 'left' | 'right';
  onClick?: (e: MouseEvent) => void;
  class?: string;
  children?: JSX.Element;
  type?: 'button' | 'submit' | 'reset';
}

export const NovelButton: Component<NovelButtonProps> = (props) => {
  const variant = () => props.variant ?? 'filled';
  const size = () => props.size ?? 'md';

  const baseClasses =
    'rounded-lg transition-all duration-150 active:scale-95 inline-flex items-center justify-center gap-1.5 font-medium disabled:opacity-50 disabled:pointer-events-none';

  const variantClasses = () => {
    switch (variant()) {
      case 'filled':
        return 'bg-[#6b38d4] text-white hover:bg-[#6d3bd7]';
      case 'tonal':
        return 'bg-[#e9ddff] text-[#6b38d4] hover:bg-[#d0bcff]';
      case 'outlined':
        return 'border border-[#7b7486] text-[#6b38d4] hover:bg-[#e9ddff] bg-transparent';
      case 'text':
        return 'text-[#6b38d4] hover:bg-[#e9ddff]/50 bg-transparent';
      case 'icon':
        return 'text-[#494454] hover:text-[#6b38d4] hover:bg-[#e6eeff] rounded-full p-2';
      default:
        return '';
    }
  };

  const sizeClasses = () => {
    if (variant() === 'icon') return '';
    switch (size()) {
      case 'sm':
        return 'px-4 py-1 text-xs';
      case 'md':
        return 'px-4 py-2 text-sm';
      case 'lg':
        return 'px-6 py-2.5 text-sm';
      default:
        return '';
    }
  };

  const cls = () =>
    `${baseClasses} ${variantClasses()} ${sizeClasses()} ${props.class ?? ''}`.trim();

  return (
    <button
      type={props.type ?? 'button'}
      class={cls()}
      disabled={props.disabled || props.loading}
      onClick={props.onClick}
    >
      {props.loading && <NovelIcon name="sync" size={16} class="animate-spin" />}
      {props.icon && props.iconPosition !== 'right' && !props.loading && (
        <NovelIcon name={props.icon} size={16} />
      )}
      {props.children}
      {props.icon && props.iconPosition === 'right' && (
        <NovelIcon name={props.icon} size={16} />
      )}
    </button>
  );
};
