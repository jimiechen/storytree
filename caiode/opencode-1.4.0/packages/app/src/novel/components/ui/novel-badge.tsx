import type { Component } from 'solid-js';

type BadgeStatus = 'draft' | 'revising' | 'completed' | 'published' | 'vip';

interface NovelBadgeProps {
  status: BadgeStatus;
  children: string;
  class?: string;
}

export const NovelBadge: Component<NovelBadgeProps> = (props) => {
  const classes = () => {
    switch (props.status) {
      case 'draft':
        return 'bg-[#eff4ff] text-[#494454] border-[#cbc3d7]';
      case 'completed':
        return 'bg-[#e9ddff] text-[#6b38d4] border-[#e9ddff]';
      case 'published':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'vip':
        return 'bg-amber-100 text-amber-700 font-bold';
      default:
        return '';
    }
  };

  return (
    <span
      class={`inline-flex items-center rounded-full px-2 py-0.5 text-xs border ${classes()} ${props.class ?? ''}`.trim()}
    >
      {props.children}
    </span>
  );
};
