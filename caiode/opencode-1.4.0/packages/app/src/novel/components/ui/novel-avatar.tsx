import type { Component } from 'solid-js';

interface NovelAvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  class?: string;
}

export const NovelAvatar: Component<NovelAvatarProps> = (props) => {
  const size = () => props.size ?? 'md';

  const sizeClasses = () => {
    switch (size()) {
      case 'sm':
        return 'w-8 h-8 text-xs';
      case 'md':
        return 'w-10 h-10 text-sm';
      case 'lg':
        return 'w-14 h-14 text-xl';
      case 'xl':
        return 'w-20 h-20 text-2xl';
      default:
        return '';
    }
  };

  const initial = () => props.name?.[0]?.toUpperCase?.() ?? '?';

  return (
    <div
      class={`inline-flex items-center justify-center rounded-full overflow-hidden border border-[#cbc3d7] shrink-0 ${sizeClasses()} ${props.class ?? ''}`.trim()}
    >
      {props.src ? (
        <img src={props.src} alt={props.name} class="w-full h-full object-cover" />
      ) : (
        <div class="w-full h-full flex items-center justify-center font-bold bg-[#e9ddff] text-[#6b38d4]">
          {initial()}
        </div>
      )}
    </div>
  );
};
