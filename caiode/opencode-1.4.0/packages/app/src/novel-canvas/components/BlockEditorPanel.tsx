import { Show, For } from 'solid-js';
import type { StoryBlockType } from '../types';
import { BLOCK_TYPE_CONFIGS } from '../types';
import type { CanvasStore } from '../canvas-store';

interface BlockEditorPanelProps {
  store: CanvasStore;
}

export function BlockEditorPanel(props: BlockEditorPanelProps) {
  const block = () => props.store.selectedBlock();

  const handleTitleChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const currentBlock = block();
    if (currentBlock) {
      props.store.updateBlock(currentBlock.id, { title: target.value });
    }
  };

  const handleContentChange = (e: Event) => {
    const target = e.target as HTMLTextAreaElement;
    const currentBlock = block();
    if (currentBlock) {
      props.store.updateBlock(currentBlock.id, { content: target.value });
    }
  };

  const handleTypeChange = (type: StoryBlockType) => {
    const currentBlock = block();
    if (currentBlock) {
      const config = BLOCK_TYPE_CONFIGS[type];
      props.store.updateBlock(currentBlock.id, {
        type,
        color: config.defaultColor
      });
    }
  };

  const handleDelete = () => {
    const currentBlock = block();
    if (currentBlock) {
      props.store.deleteBlock(currentBlock.id);
    }
  };

  return (
    <Show when={block()}>
      <div class="w-72 bg-white border-l border-gray-200 h-full flex flex-col">
        {/* 头部 */}
        <div class="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h2 class="text-sm font-semibold text-gray-900">编辑块</h2>
          <button
            class="text-xs text-red-600 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors"
            onClick={handleDelete}
          >
            删除
          </button>
        </div>

        {/* 表单 */}
        <div class="flex-1 overflow-y-auto p-4 space-y-4">
          {/* 类型选择 */}
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-2">块类型</label>
            <div class="grid grid-cols-3 gap-2">
              <For each={Object.entries(BLOCK_TYPE_CONFIGS)}>
                {([type, config]) => {
                  const currentBlock = block();
                  return (
                    <button
                      class={`px-2 py-2 text-xs rounded-lg border-2 transition-all ${
                        currentBlock?.type === type
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                      onClick={() => handleTypeChange(type as StoryBlockType)}
                    >
                      <span class="block text-lg mb-1">{config.icon}</span>
                      <span>{config.label}</span>
                    </button>
                  );
                }}
              </For>
            </div>
          </div>

          {/* 标题 */}
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">标题</label>
            <input
              type="text"
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={block()?.title || ''}
              onInput={handleTitleChange}
            />
          </div>

          {/* 内容 */}
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">内容</label>
            <textarea
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={6}
              value={block()?.content || ''}
              onInput={handleContentChange}
            />
          </div>

          {/* 颜色 */}
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-2">颜色</label>
            <div class="flex gap-2">
              <For each={Object.values(BLOCK_TYPE_CONFIGS)}>
                {(config) => (
                  <button
                    class="w-8 h-8 rounded-full border-2 transition-all"
                    style={{
                      'background-color': config.defaultColor,
                      'border-color': block()?.color === config.defaultColor ? '#1D4ED8' : 'transparent'
                    }}
                    onClick={() => {
                      const currentBlock = block();
                      if (currentBlock) {
                        props.store.updateBlock(currentBlock.id, { color: config.defaultColor });
                      }
                    }}
                  />
                )}
              </For>
            </div>
          </div>

          {/* 元数据 */}
          <Show when={block()?.metadata && Object.keys(block()?.metadata || {}).length > 0}>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-2">元数据</label>
              <div class="space-y-1">
                <For each={Object.entries(block()?.metadata || {})}>
                  {([key, value]) => (
                    <div class="flex items-center justify-between text-xs px-2 py-1 bg-gray-50 rounded">
                      <span class="text-gray-500">{key}:</span>
                      <span class="text-gray-700">{String(value)}</span>
                    </div>
                  )}
                </For>
              </div>
            </div>
          </Show>
        </div>
      </div>
    </Show>
  );
}
