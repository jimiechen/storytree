import { For } from 'solid-js';
import type { Component } from 'solid-js';

interface WorkspaceChapterContentProps {
  paragraphs: string[];
}

/** 章节正文内容 — Stitch 04 code.html */
export const WorkspaceChapterContent: Component<WorkspaceChapterContentProps> = (props) => {
  return (
    <div class="flex-1 overflow-y-auto px-10 py-6 bg-white">
      <div class="max-w-3xl mx-auto">
        <For each={props.paragraphs}>
          {(paragraph, index) => (
            <p
              class={`font-body-lg text-body-lg leading-loose mb-6 ${
                index() === props.paragraphs.length - 1 && paragraph.startsWith('...')
                  ? 'text-[#7b7486] italic opacity-70'
                  : 'text-[#0d1c2f]'
              }`}
              style={{ 'font-family': "'Noto Serif SC', 'Songti SC', serif", 'font-size': '18px', 'line-height': '1.8' }}
            >
              {paragraph}
            </p>
          )}
        </For>
      </div>
    </div>
  );
};
