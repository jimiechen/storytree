import type { Component } from 'solid-js';
import { NovelAvatar } from '../ui/novel-avatar';
import { NovelTag } from '../ui/novel-tag';

interface Props {
  name: string;
  role: string;
  tags: string[];
  description: string;
  relation?: string;
  size?: 'lg' | 'md';
}

export const CharacterCard: Component<Props> = (props) => {
  const size = () => props.size ?? 'md';
  return (
    <div class="bg-white rounded-xl border border-[#cbc3d7] p-4 flex gap-4 hover:shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-shadow">
      <NovelAvatar name={props.name} size={size() === 'lg' ? 'lg' : 'md'} />
      <div class="flex-1 min-w-0">
        <h3 class="text-sm font-bold text-[#0d1c2f]">{props.name}</h3>
        <div class="flex flex-wrap gap-1.5 mt-1">
          <NovelTag>{props.role}</NovelTag>
          {props.tags.slice(0, 2).map((tag) => (
            <NovelTag>{tag}</NovelTag>
          ))}
        </div>
        <p class="text-sm text-[#494454] mt-2 line-clamp-2">{props.description}</p>
        {props.relation && (
          <p class="text-xs text-[#7b7486] mt-1">{props.relation}</p>
        )}
      </div>
    </div>
  );
};
