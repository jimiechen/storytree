import { createSignal, For, Show } from 'solid-js';
import type { AITask, AITaskType, AITaskStatus } from '../../types/ai-task';

interface AITaskPanelProps {
  tasks: AITask[];
  onCancelTask: (taskId: string) => void;
  onRetryTask: (taskId: string) => void;
}

const taskTypeLabels: Record<AITaskType, string> = {
  'continue-writing': '续写',
  'rewrite-selection': '改写',
  'summarize-chapter': '总结',
  'character-voice': '角色配音'
};

const statusConfig: Record<AITaskStatus, { label: string; color: string; bg: string; icon: string }> = {
  pending: { label: '等待中', color: 'text-yellow-600', bg: 'bg-yellow-50', icon: '⏳' },
  running: { label: '运行中', color: 'text-blue-600', bg: 'bg-blue-50', icon: '⚡' },
  success: { label: '成功', color: 'text-green-600', bg: 'bg-green-50', icon: '✓' },
  failed: { label: '失败', color: 'text-red-600', bg: 'bg-red-50', icon: '✗' },
  cancelled: { label: '已取消', color: 'text-gray-600', bg: 'bg-gray-50', icon: '⊘' },
  denied: { label: '被拒绝', color: 'text-orange-600', bg: 'bg-orange-50', icon: '⛔' },
  quota: { label: '额度不足', color: 'text-purple-600', bg: 'bg-purple-50', icon: '💰' }
};

export function AITaskPanel(props: AITaskPanelProps) {
  const [expandedTaskId, setExpandedTaskId] = createSignal<string | null>(null);

  const runningTasks = () => props.tasks.filter(t => t.status === 'running');
  const completedTasks = () => props.tasks.filter(t => ['success', 'failed', 'cancelled', 'denied', 'quota'].includes(t.status));

  const toggleExpand = (taskId: string) => {
    setExpandedTaskId(prev => prev === taskId ? null : taskId);
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div class="w-72 bg-white border-l border-gray-200 h-full flex flex-col">
      {/* 头部 */}
      <div class="px-4 py-3 border-b border-gray-200">
        <h2 class="text-sm font-semibold text-gray-900">AI 任务队列</h2>
        <div class="flex items-center gap-3 mt-1 text-xs text-gray-500">
          <span class="flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            运行中: {runningTasks().length}
          </span>
          <span>已完成: {completedTasks().length}</span>
        </div>
      </div>

      {/* 任务列表 */}
      <div class="flex-1 overflow-y-auto">
        <Show when={props.tasks.length === 0}>
          <div class="flex flex-col items-center justify-center h-32 text-gray-400 text-sm">
            <span class="text-2xl mb-2">🤖</span>
            <span>暂无 AI 任务</span>
          </div>
        </Show>

        <For each={props.tasks}>
          {(task) => {
            const status = statusConfig[task.status];
            const isExpanded = () => expandedTaskId() === task.id;
            const canCancel = () => ['pending', 'running'].includes(task.status);
            const canRetry = () => ['failed', 'cancelled', 'denied', 'quota'].includes(task.status);

            return (
              <div class="border-b border-gray-100 last:border-b-0">
                {/* 任务摘要行 */}
                <button
                  class="w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors text-left"
                  onClick={() => toggleExpand(task.id)}
                >
                  <span class="text-lg shrink-0">{status.icon}</span>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between">
                      <span class="text-sm font-medium text-gray-900 truncate">
                        {taskTypeLabels[task.type]}
                      </span>
                      <span class={`text-xs px-2 py-0.5 rounded-full ${status.bg} ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    <div class="text-xs text-gray-500 mt-1">
                      {formatTime(task.createdAt)} · {formatDuration(task.duration)}
                    </div>
                  </div>
                </button>

                {/* 展开详情 */}
                <Show when={isExpanded()}>
                  <div class="px-4 pb-3 pl-11">
                    <div class="text-xs text-gray-600 space-y-1">
                      <div>
                        <span class="font-medium">输入:</span>
                        <span class="truncate block">{task.input.text.substring(0, 50)}...</span>
                      </div>
                      <Show when={task.output}>
                        <div>
                          <span class="font-medium">输出:</span>
                          <span class="truncate block">{task.output!.text.substring(0, 50)}...</span>
                          <span class="text-gray-400">({task.output!.wordCount} 字)</span>
                        </div>
                      </Show>
                      <Show when={task.error}>
                        <div class="text-red-600">
                          <span class="font-medium">错误:</span> {task.error}
                        </div>
                      </Show>
                    </div>

                    {/* 操作按钮 */}
                    <div class="flex gap-2 mt-2">
                      <Show when={canCancel()}>
                        <button
                          class="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                          onClick={() => props.onCancelTask(task.id)}
                        >
                          取消
                        </button>
                      </Show>
                      <Show when={canRetry()}>
                        <button
                          class="px-3 py-1 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition-colors"
                          onClick={() => props.onRetryTask(task.id)}
                        >
                          重试
                        </button>
                      </Show>
                    </div>
                  </div>
                </Show>
              </div>
            );
          }}
        </For>
      </div>
    </div>
  );
}
