import { For, Show, createSignal } from 'solid-js';
import { createCanvasStore } from '../canvas-store';
import { StoryBlockNode } from './StoryBlockNode';
import { StoryEdgeLayer } from './StoryEdgeLayer';
import { BlockEditorPanel } from './BlockEditorPanel';
import { ConnectionEditorPanel } from './ConnectionEditorPanel';
import { BLOCK_TYPE_CONFIGS } from '../types';
import type { StoryBlockType } from '../types';

export function SolidStoryCanvas() {
  const store = createCanvasStore();
  const [showMockBanner] = createSignal(true);

  const handleCanvasClick = () => {
    // 点击空白处取消选中
    store.selectBlock(null);
    store.selectEdge(null);
  };

  const handleAddBlock = (type: StoryBlockType) => {
    const config = BLOCK_TYPE_CONFIGS[type];
    const id = `block-${Date.now()}`;
    store.addBlock({
      id,
      type,
      title: `新${config.label}`,
      content: '点击编辑内容...',
      position: {
        x: 100 + Math.random() * 200,
        y: 100 + Math.random() * 200
      },
      size: config.defaultSize,
      color: config.defaultColor,
      isSelected: false
    });
  };

  return (
    <div class="flex flex-col h-screen bg-gray-50">
      {/* Mock Mode Banner */}
      <Show when={showMockBanner()}>
        <div class="bg-amber-100 border-b border-amber-200 px-4 py-2 flex items-center justify-center gap-2">
          <span class="text-amber-600 text-sm">⚠️</span>
          <span class="text-amber-800 text-sm font-medium">StoryCanvas Mock 模式 - 使用模拟数据，不接真实模型</span>
        </div>
      </Show>

      {/* 工具栏 */}
      <div class="h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-4">
        <h1 class="text-lg font-semibold text-gray-900">故事画布</h1>

        <div class="h-6 w-px bg-gray-300 mx-2" />

        {/* 缩放控制 */}
        <div class="flex items-center gap-1">
          <button
            class="p-1.5 hover:bg-gray-100 rounded transition-colors"
            onClick={store.zoomOut}
            title="缩小"
          >
            <span class="text-sm">➖</span>
          </button>
          <span class="text-xs text-gray-500 w-12 text-center">{Math.round(store.scale() * 100)}%</span>
          <button
            class="p-1.5 hover:bg-gray-100 rounded transition-colors"
            onClick={store.zoomIn}
            title="放大"
          >
            <span class="text-sm">➕</span>
          </button>
          <button
            class="p-1.5 hover:bg-gray-100 rounded transition-colors text-xs"
            onClick={store.resetZoom}
            title="重置"
          >
            ⟲
          </button>
        </div>

        <div class="h-6 w-px bg-gray-300 mx-2" />

        {/* 添加块 */}
        <div class="flex items-center gap-1">
          <span class="text-xs text-gray-500 mr-2">添加:</span>
          <For each={Object.entries(BLOCK_TYPE_CONFIGS)}>
            {([type, config]) => (
              <button
                class="px-2 py-1 text-xs rounded hover:bg-gray-100 transition-colors flex items-center gap-1"
                onClick={() => handleAddBlock(type as StoryBlockType)}
                title={config.label}
              >
                <span>{config.icon}</span>
                <span class="hidden sm:inline">{config.label}</span>
              </button>
            )}
          </For>
        </div>
      </div>

      {/* 主画布区 */}
      <div class="flex-1 flex overflow-hidden">
        {/* 画布 */}
        <div
          class="flex-1 relative overflow-hidden bg-gray-100"
          style={{
            'background-image': 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
            'background-size': '20px 20px'
          }}
          onClick={handleCanvasClick}
        >
          {/* 连线层 */}
          <StoryEdgeLayer
            edges={store.edges()}
            blocks={store.blocks()}
            scale={store.scale()}
          />

          {/* 节点层 */}
          <For each={store.blocks()}>
            {(block) => (
              <StoryBlockNode
                block={block}
                store={store}
                scale={store.scale()}
              />
            )}
          </For>
        </div>

        {/* 右侧面板 */}
        <Show when={store.selectedBlock()}>
          <BlockEditorPanel store={store} />
        </Show>

        <Show when={store.selectedEdge() && !store.selectedBlock()}>
          <ConnectionEditorPanel store={store} />
        </Show>
      </div>
    </div>
  );
}
