import type { Component } from 'solid-js';

interface NovelTagProps {
  children: string;
  class?: string;
}

export const NovelTag: Component<NovelTagProps> = (props) => {
  return (
    <span
      class={`inline-block bg-[#eff4ff] text-[#494454] rounded-full px-2 py-0.5 text-xs whitespace-nowrap ${props.class ?? ''}`.trim()}
    >
      {props.children}
    </span>
  );
};
