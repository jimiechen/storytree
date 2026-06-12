import { For } from 'solid-js';
import type { Component } from 'solid-js';

export interface ContextOption {
  id: string;
  label: string;
  enabled: boolean;
}

export interface WorkspaceContextOptionsActions {
  onToggleOption?: (id: string) => void;
}

interface WorkspaceContextOptionsProps extends WorkspaceContextOptionsActions {
  options: ContextOption[];
}

/** 参考上下文选项 — Stitch 04 code.html */
export const WorkspaceContextOptions: Component<WorkspaceContextOptionsProps> = (props) => {
  return (
    <div class="space-y-3">
      <label class="text-sm text-[#7b7486] font-bold block mb-2">参考上下文</label>
      <For each={props.options}>
        {(option) => (
          <label class="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={option.enabled}
              onChange={() => props.onToggleOption?.(option.id)}
              class="h-4 w-4 text-[#6b38d4] rounded border-[#cbc3d7] focus:ring-[#6b38d4] focus:ring-offset-0 transition-colors"
            />
            <span class="text-sm text-[#0d1c2f] group-hover:text-[#6b38d4] transition-colors">
              {option.label}
            </span>
          </label>
        )}
      </For>
    </div>
  );
};
