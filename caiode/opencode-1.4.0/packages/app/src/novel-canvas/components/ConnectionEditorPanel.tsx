import { Show, For } from 'solid-js';
import type { StoryEdgeType } from '../types';
import { EDGE_TYPE_CONFIGS } from '../types';
import type { CanvasStore } from '../canvas-store';

interface ConnectionEditorPanelProps {
  store: CanvasStore;
}

export function ConnectionEditorPanel(props: ConnectionEditorPanelProps) {
  const edge = () => props.store.selectedEdge();
  const blocks = () => props.store.blocks();

  const handleTypeChange = (type: StoryEdgeType) => {
    const currentEdge = edge();
    if (currentEdge) {
      props.store.updateEdge(currentEdge.id, { type });
    }
  };

  const handleLabelChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const currentEdge = edge();
    if (currentEdge) {
      props.store.updateEdge(currentEdge.id, { label: target.value });
    }
  };

  const handleDelete = () => {
    const currentEdge = edge();
    if (currentEdge) {
      props.store.deleteEdge(currentEdge.id);
    }
  };

  const getBlockTitle = (blockId: string) => {
    const block = blocks().find(b => b.id === blockId);
    return block?.title || '未知块';
  };

  return (
    <Show when={edge()}>
      <div class="w-72 bg-white border-l border-gray-200 h-full flex flex-col">
        {/* 头部 */}
        <div class="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h2 class="text-sm font-semibold text-gray-900">编辑连线</h2>
          <button
            class="text-xs text-red-600 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors"
            onClick={handleDelete}
          >
            删除
          </button>
        </div>

        {/* 表单 */}
        <div class="flex-1 overflow-y-auto p-4 space-y-4">
          {/* 连接信息 */}
          <div class="bg-gray-50 rounded-lg p-3">
            <div class="text-xs text-gray-500 mb-1">从</div>
            <div class="text-sm font-medium text-gray-800">{getBlockTitle(edge()?.sourceId || '')}</div>
            <div class="flex justify-center my-2">
              <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
            <div class="text-xs text-gray-500 mb-1">到</div>
            <div class="text-sm font-medium text-gray-800">{getBlockTitle(edge()?.targetId || '')}</div>
          </div>

          {/* 类型选择 */}
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-2">连线类型</label>
            <div class="space-y-1">
              <For each={Object.entries(EDGE_TYPE_CONFIGS)}>
                {([type, config]) => (
                  <button
                    class={`w-full px-3 py-2 text-xs rounded-lg border-2 flex items-center gap-2 transition-all ${
                      edge()?.type === type
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                    onClick={() => handleTypeChange(type as StoryEdgeType)}
                  >
                    <span
                      class="w-6 h-0.5"
                      style={{
                        'background-color': config.color,
                        'border-style': config.dashed ? 'dashed' : 'solid',
                        'border-width': '1px',
                        'border-color': config.color
                      }}
                    />
                    <span>{config.label}</span>
                  </button>
                )}
              </For>
            </div>
          </div>

          {/* 标签 */}
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">标签</label>
            <input
              type="text"
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={edge()?.label || ''}
              onInput={handleLabelChange}
              placeholder="输入连线标签..."
            />
          </div>

          {/* 当前类型说明 */}
          <Show when={edge()}>
            <div class="bg-blue-50 rounded-lg p-3">
              <div class="text-xs text-blue-700 font-medium mb-1">
                {EDGE_TYPE_CONFIGS[edge()!.type].label}
              </div>
              <div class="text-xs text-blue-600">
                {getTypeDescription(edge()!.type)}
              </div>
            </div>
          </Show>
        </div>
      </div>
    </Show>
  );
}

function getTypeDescription(type: StoryEdgeType): string {
  const descriptions: Record<StoryEdgeType, string> = {
    'sequence': '表示事件按时间顺序发生',
    'branch': '表示故事产生分支',
    'converge': '表示多条线索汇聚',
    'parallel': '表示事件同时发生',
    'flashback': '表示回忆或倒叙',
    'foreshadow': '表示为后续剧情埋下伏笔',
    'contrast': '表示对比或反差',
    'cause-effect': '表示因果关系'
  };
  return descriptions[type];
}
