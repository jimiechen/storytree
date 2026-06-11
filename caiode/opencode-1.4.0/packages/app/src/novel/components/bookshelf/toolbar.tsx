import type { Component } from 'solid-js';
import type { ToolbarItem } from '../../types/bookshelf';

interface ToolbarProps {
  items: ToolbarItem[];
}

/** 工具栏行：彩色图标按钮 */
export const Toolbar: Component<ToolbarProps> = (props) => {
  return (
    <div class="px-6 py-2 flex items-center gap-2 flex-wrap">
      {props.items.map((item) => (
        <button
          class={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium hover:opacity-80 transition-opacity ${item.color}`}
          onClick={item.action}
          title={item.label}
        >
          <span>{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
};
