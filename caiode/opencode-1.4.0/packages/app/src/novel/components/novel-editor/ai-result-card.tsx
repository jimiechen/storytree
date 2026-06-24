import { createSignal, For, Show } from 'solid-js';
import type { AITask, AITaskCostEstimate, AITaskStatus } from '../../types/ai-task';
import type { GenerationIssue } from '../../llm/generation-result-validator';

interface AIResultCardProps {
  task: AITask;
  onAccept: (text: string) => void;
  onSave: (text: string) => void;
  onDiscard: () => void;
  /** P3-C：生成结果校验问题列表 */
  validationIssues?: GenerationIssue[];
  /** P3-C：prompt 上下文是否被裁剪 */
  wasTrimmed?: boolean;
  /** P3-D：模型策略与成本（优先使用外部传入，否则取 task 自带） */
  modelProfileId?: string;
  modelId?: string;
  estimatedCost?: AITaskCostEstimate;
  fallback?: boolean;
  originalErrorCode?: string;
}

const statusConfig: Record<AITaskStatus, { label: string; color: string; bg: string; icon: string }> = {
  pending: { label: '等待中', color: 'text-yellow-600', bg: 'bg-yellow-50', icon: '⏳' },
  running: { label: '生成中', color: 'text-blue-600', bg: 'bg-blue-50', icon: '⚡' },
  completed: { label: '生成完成', color: 'text-green-600', bg: 'bg-green-50', icon: '✓' },
  failed: { label: '生成失败', color: 'text-red-600', bg: 'bg-red-50', icon: '✗' },
  cancelled: { label: '已取消', color: 'text-gray-600', bg: 'bg-gray-50', icon: '⊘' },
  denied: { label: '权限不足', color: 'text-orange-600', bg: 'bg-orange-50', icon: '⛔' },
  quota: { label: '额度不足', color: 'text-purple-600', bg: 'bg-purple-50', icon: '💰' }
};

const taskTypeLabels: Record<string, string> = {
  'continue-writing': 'AI 续写',
  'chapter-generation': 'AI 生成',
  'rewrite-selection': 'AI 改写',
  'summarize-chapter': 'AI 总结',
  'character-voice': '角色配音'
};

/** P3-D：格式化成本估算。货币 CNY-CENT 表示人民币分。 */
function formatCost(cost: AITaskCostEstimate | undefined): string {
  if (!cost) return '—';
  if (cost.currency === 'CNY-CENT') {
    return `¥${(cost.totalCost / 100).toFixed(2)}`;
  }
  return `${cost.totalCost.toFixed(4)} ${cost.currency}`;
}

export function AIResultCard(props: AIResultCardProps) {
  const [isExpanded, setIsExpanded] = createSignal(true);

  const status = () => statusConfig[props.task.status];
  const isSuccess = () => props.task.status === 'completed';
  const isError = () => ['failed', 'cancelled', 'denied', 'quota'].includes(props.task.status);

  const handleAccept = () => {
    if (props.task.output?.text) {
      props.onAccept(props.task.output.text);
    }
  };

  const handleSave = () => {
    if (props.task.output?.text) {
      props.onSave(props.task.output.text);
    }
  };

  return (
    <div data-testid="ai-result-card" class="mx-6 my-3 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      {/* 头部 */}
      <div class="px-4 py-3 flex items-center justify-between bg-gray-50 border-b border-gray-100">
        <div class="flex items-center gap-2">
          <span class="text-lg">{status().icon}</span>
          <div>
            <span class="text-sm font-medium text-gray-900">
              {taskTypeLabels[props.task.type] || props.task.type}
            </span>
            <span class={`ml-2 text-xs px-2 py-0.5 rounded-full ${status().bg} ${status().color}`}>
              {status().label}
            </span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <Show when={props.task.duration}>
            <span class="text-xs text-gray-400">{props.task.duration}ms</span>
          </Show>
          <button
            class="p-1 hover:bg-gray-200 rounded transition-colors"
            onClick={() => setIsExpanded(!isExpanded())}
          >
            <svg
              class={`w-4 h-4 text-gray-500 transition-transform ${isExpanded() ? '' : 'rotate-180'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* 内容区 */}
      <Show when={isExpanded()}>
        <div class="p-4">
          {/* 输入摘要 */}
          <div class="mb-3">
            <span class="text-xs text-gray-500 font-medium">输入：</span>
            <span class="text-xs text-gray-600 truncate">
              {props.task.input.text.substring(0, 80)}
              {props.task.input.text.length > 80 ? '...' : ''}
            </span>
          </div>

          {/* 成功结果 */}
          <Show when={isSuccess()}>
            <div class="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
              <div class="text-xs text-green-700 font-medium mb-1">AI 生成内容：</div>
              <div class="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                {props.task.output?.text}
              </div>
              <div class="mt-2 text-xs text-gray-500">
                {props.task.output?.wordCount} 字
              </div>

              {/* P3-D：模型策略与成本 */}
              <Show when={props.task.modelProfileId || props.modelProfileId}>
                <div class="mt-2 text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded px-2 py-1">
                  <span class="font-medium">模型策略：</span>
                  {props.modelProfileId ?? props.task.modelProfileId}
                  <Show when={props.modelId ?? props.task.modelId}>
                    <span class="text-gray-500 ml-1">({props.modelId ?? props.task.modelId})</span>
                  </Show>
                  <Show when={props.estimatedCost ?? props.task.estimatedCost}>
                    <span class="ml-2">
                      预估成本：
                      {formatCost(props.estimatedCost ?? props.task.estimatedCost!)}
                    </span>
                  </Show>
                </div>
              </Show>
              <Show when={props.fallback ?? props.task.fallback}>
                <div class="mt-2 text-xs text-orange-700 bg-orange-50 border border-orange-100 rounded px-2 py-1">
                  <span class="font-medium">已回退到 mock：</span>
                  真实模型调用失败，当前结果为模拟生成。
                  <Show when={props.originalErrorCode ?? props.task.originalErrorCode}>
                    （原错误：{props.originalErrorCode ?? props.task.originalErrorCode}）
                  </Show>
                </div>
              </Show>

              {/* P3-C：校验信息提示 */}
              <Show when={props.wasTrimmed}>
                <div class="mt-2 text-xs text-orange-600 bg-orange-50 border border-orange-100 rounded px-2 py-1">
                  提示：上下文较长，系统已自动裁剪，请重点检查生成内容是否连贯。
                </div>
              </Show>
              <Show when={props.validationIssues && props.validationIssues.length > 0}>
                <div class="mt-2 text-xs text-yellow-700 bg-yellow-50 border border-yellow-100 rounded px-2 py-1">
                  <div class="font-medium mb-0.5">生成结果校验提示：</div>
                  <ul class="list-disc pl-4 space-y-0.5">
                    <For each={props.validationIssues!}>
                      {(issue) => <li>{issue.message}</li>}
                    </For>
                  </ul>
                </div>
              </Show>
            </div>

            {/* 操作按钮 */}
            <div class="flex items-center gap-2">
              <button
                class="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1"
                onClick={handleAccept}
              >
                <span>✓</span>
                <span>采纳</span>
              </button>
              <button
                class="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1"
                onClick={handleSave}
              >
                <span>💡</span>
                <span>存为灵感</span>
              </button>
              <button
                class="px-3 py-2 text-gray-500 text-sm hover:text-gray-700 transition-colors"
                onClick={props.onDiscard}
              >
                忽略
              </button>
            </div>
          </Show>

          {/* 错误状态 */}
          <Show when={isError()}>
            <div class="bg-red-50 border border-red-200 rounded-lg p-3">
              <div class="text-xs text-red-700 font-medium mb-1">错误信息：</div>
              <div class="text-sm text-red-600">{props.task.error || '未知错误'}</div>
            </div>
          </Show>

          {/* 运行中 */}
          <Show when={props.task.status === 'running'}>
            <div class="flex flex-col gap-3 py-4">
              <div class="flex items-center">
                <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3" />
                <span class="text-sm text-gray-600">AI 正在生成内容...</span>
              </div>
              {/* P3-B：流式结果作为临时草稿展示，用户仍需点击采纳才会写入正文 */}
              <Show when={props.task.preview}>
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div class="text-xs text-blue-700 font-medium mb-1">实时预览：</div>
                  <div class="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {props.task.preview}
                  </div>
                </div>
              </Show>
            </div>
          </Show>

          {/* 等待中 */}
          <Show when={props.task.status === 'pending'}>
            <div class="flex items-center justify-center py-6">
              <span class="text-sm text-gray-500">等待 AI 处理...</span>
            </div>
          </Show>
        </div>
      </Show>
    </div>
  );
}
