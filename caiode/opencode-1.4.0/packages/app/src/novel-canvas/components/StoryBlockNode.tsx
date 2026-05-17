import type { StoryBlock } from '../types';
import { BLOCK_TYPE_CONFIGS } from '../types';
import type { CanvasStore } from '../canvas-store';

interface StoryBlockNodeProps {
  block: StoryBlock;
  store: CanvasStore;
  scale: number;
}

export function StoryBlockNode(props: StoryBlockNodeProps) {
  const config = () => BLOCK_TYPE_CONFIGS[props.block.type];

  const handleMouseDown = (e: MouseEvent) => {
    e.stopPropagation();
    props.store.selectBlock(props.block.id);
    props.store.startDrag(props.block.id, { x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (props.store.isDragging() && props.store.dragBlockId() === props.block.id) {
      props.store.updateDrag({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    props.store.endDrag();
  };

  return (
    <div
      class="absolute cursor-move select-none transition-shadow"
      style={{
        left: `${props.block.position.x}px`,
        top: `${props.block.position.y}px`,
        width: `${props.block.size.width}px`,
        height: `${props.block.size.height}px`,
        transform: `scale(${props.scale})`,
        'transform-origin': 'top left',
        'z-index': props.block.isSelected ? 10 : 1
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        class="w-full h-full rounded-lg border-2 overflow-hidden flex flex-col"
        style={{
          'background-color': props.block.color || config().defaultColor,
          'border-color': props.block.isSelected ? '#1D4ED8' : 'transparent',
          'box-shadow': props.block.isSelected
            ? '0 0 0 3px rgba(59, 130, 246, 0.3), 0 4px 12px rgba(0,0,0,0.15)'
            : '0 2px 8px rgba(0,0,0,0.1)'
        }}
      >
        {/* 头部 */}
        <div class="px-3 py-2 flex items-center gap-2 bg-white/90 border-b border-black/10">
          <span class="text-sm">{config().icon}</span>
          <span class="text-xs font-semibold text-gray-800 truncate">{props.block.title}</span>
        </div>

        {/* 内容 */}
        <div class="flex-1 px-3 py-2 overflow-hidden">
          <p class="text-xs text-white/90 leading-relaxed line-clamp-3">
            {props.block.content}
          </p>
        </div>

        {/* 底部标签 */}
        <Show when={props.block.metadata && Object.keys(props.block.metadata).length > 0}>
          <div class="px-3 py-1 bg-black/10 flex gap-1 flex-wrap">
            <For each={Object.entries(props.block.metadata || {}).slice(0, 2)}>
              {([key, value]) => (
                <span class="text-[10px] px-1.5 py-0.5 bg-white/60 rounded text-gray-700">
                  {value}
                </span>
              )}
            </For>
          </div>
        </Show>
      </div>
    </div>
  );
}

// 需要导入 Show 和 For
import { Show, For } from 'solid-js';
