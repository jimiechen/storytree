import type { Component } from 'solid-js';
import { NovelTag } from '../ui/novel-tag';
import { NovelIcon } from '../layout/novel-icon';

interface Props {
  name: string;
  tags: string[];
  description: string;
  extra?: string;
}

export const WorldEntryCard: Component<Props> = (props) => {
  return (
    <div class="relative group bg-white rounded-xl border border-[#cbc3d7] p-4 hover:shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-shadow">
      <div class="flex items-start justify-between">
        <div class="flex-1 min-w-0">
          <h3 class="text-sm font-bold text-[#0d1c2f]">{props.name}</h3>
          <div class="flex flex-wrap gap-1.5 mt-1.5">
            {props.tags.map((tag) => (
              <NovelTag>{tag}</NovelTag>
            ))}
          </div>
          <p class="text-sm text-[#494454] mt-2 line-clamp-2">{props.description}</p>
          {props.extra && (
            <p class="text-xs text-[#7b7486] mt-1">{props.extra}</p>
          )}
        </div>
        <div class="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white rounded-lg p-1 shadow-[0_2px_12px_rgba(0,0,0,0.04)] ml-2">
          <button type="button" class="p-1.5 text-[#7b7486] hover:text-[#6b38d4] hover:bg-[#e6eeff] rounded-md transition-colors">
            <NovelIcon name="edit" size={16} />
          </button>
          <button type="button" class="p-1.5 text-[#7b7486] hover:text-[#ba1a1a] hover:bg-red-50 rounded-md transition-colors">
            <NovelIcon name="delete" size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
