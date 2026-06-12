import type { Component } from 'solid-js';
import type { ToolbarItem } from '../../types/bookshelf';

interface ToolbarProps {
  items: ToolbarItem[];
}

/**
 * 工具栏 — Stitch 原型 02 风格
 *
 * 彩色圆形图标按钮行，匹配原型的工具栏布局
 */
export const Toolbar: Component<ToolbarProps> = (props) => {
  return (
    <div class="px-[40px] py-2 flex items-center gap-2 flex-wrap">
      {props.items.map((item) => (
        <button
          class={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium hover:opacity-80 transition-opacity duration-150 ${item.color}`}
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
