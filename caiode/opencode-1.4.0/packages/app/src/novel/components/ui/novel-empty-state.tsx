import type { Component } from 'solid-js';
import { NovelIcon } from '../layout/novel-icon';
import { NovelButton } from './novel-button';

interface NovelEmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const NovelEmptyState: Component<NovelEmptyStateProps> = (props) => {
  return (
    <div class="flex flex-col items-center justify-center gap-4 py-8 text-center">
      <NovelIcon name={props.icon ?? 'description'} size={64} class="text-[#7b7486]" />
      <h3 class="text-lg font-semibold text-[#494454]">{props.title}</h3>
      {props.description && (
        <p class="text-sm text-[#7b7486] max-w-xs">{props.description}</p>
      )}
      {props.action && (
        <NovelButton variant="tonal" onClick={props.action.onClick}>
          {props.action.label}
        </NovelButton>
      )}
    </div>
  );
};
