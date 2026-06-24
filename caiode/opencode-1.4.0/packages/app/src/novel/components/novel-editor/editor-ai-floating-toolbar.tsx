import type { Component } from 'solid-js';
import type { AIWritingCommand } from '../../types/editor';

interface EditorAIFloatingToolbarProps {
  visible: boolean;
  top: number;
  left: number;
  onCommand: (cmd: AIWritingCommand) => void;
}

export const EditorAIFloatingToolbar: Component<EditorAIFloatingToolbarProps> = (
  props
) => {
  if (!props.visible) return null;

  const commands: { cmd: AIWritingCommand; label: string }[] = [
    { cmd: 'continue', label: '续写' },
    { cmd: 'rewrite', label: '改写' },
    { cmd: 'expand', label: '扩写' },
    { cmd: 'polish', label: '润色' },
    { cmd: 'summarize', label: '摘要' },
  ];

  return (
    <div
      data-testid="editor-ai-floating-toolbar"
      class="fixed z-50 bg-white border border-[#cbc3d7] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.08)] px-3 py-2 flex items-center gap-1"
      style={{
        top: `${props.top}px`,
        left: `${props.left}px`,
        transform: 'translate(-50%, -100%)',
      }}
    >
      {commands.map((c, i) => {
        const isLast = i === commands.length - 1;
        return (
          <div class="flex items-center gap-1">
            <button
              type="button"
              class="text-sm text-[#6b38d4] hover:bg-[#e9ddff] rounded-md px-2 py-1 transition-colors"
              onClick={() => props.onCommand(c.cmd)}
            >
              {c.label}
            </button>
            {!isLast && <div class="w-px h-4 bg-[#cbc3d7]" />}
          </div>
        );
      })}
    </div>
  );
};
