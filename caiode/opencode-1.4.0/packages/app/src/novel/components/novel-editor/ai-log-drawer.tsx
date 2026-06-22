import { createSignal, For, Show } from 'solid-js';
import type { AILog } from '../../types/ai-log';
import type { AITaskStatus, AITaskType } from '../../types/ai-task';
import type { NovelWorkflowEvent } from '../../workflows/workflow-events';

interface AILogDrawerProps {
  logs: AILog[];
  isOpen: boolean;
  onClose: () => void;
  onClearLogs: () => void;
  /** 返修#2 VB15: 工作流事件日志（与旧 logs 并行展示） */
  workflowEvents?: readonly NovelWorkflowEvent[];
}

const taskTypeLabels: Record<AITaskType, string> = {
  'continue-writing': '续写',
  'chapter-generation': '章节生成',
  'rewrite-selection': '改写',
  'summarize-chapter': '总结',
  'character-voice': '角色配音'
};

// 返修#2 VB15: 工作流事件类型中文标签
const wfEventTypeLabels: Record<string, string> = {
  'chapter.generated': '章节生成',
  'chapter.extracted': '信息提取',
  'character.updated': '角色更新',
  'world.referenced': '世界引用',
  'achievement.progressed': '成就进度',
  'profile.stats.updated': '统计更新',
  'information.assessed': '信息审计',
};

const statusConfig: Record<AITaskStatus, { label: string; color: string }> = {
  pending: { label: '等待中', color: 'text-yellow-600' },
  running: { label: '运行中', color: 'text-blue-600' },
  completed: { label: '完成', color: 'text-green-600' },
  failed: { label: '失败', color: 'text-red-600' },
  cancelled: { label: '已取消', color: 'text-gray-600' },
  denied: { label: '被拒绝', color: 'text-orange-600' },
  quota: { label: '额度不足', color: 'text-purple-600' }
};

export function AILogDrawer(props: AILogDrawerProps) {
  const [filterStatus, setFilterStatus] = createSignal<AITaskStatus | 'all'>('all');
  const [filterType, setFilterType] = createSignal<AITaskType | 'all'>('all');

  const filteredLogs = () => {
    return props.logs.filter(log => {
      const statusMatch = filterStatus() === 'all' || log.status === filterStatus();
      const typeMatch = filterType() === 'all' || log.taskType === filterType();
      return statusMatch && typeMatch;
    });
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <Show when={props.isOpen}>
      <div class="fixed inset-0 z-50 flex justify-end">
        {/* 遮罩层 */}
        <div
          class="absolute inset-0 bg-black/30 backdrop-blur-sm"
          onClick={props.onClose}
        />

        {/* 抽屉面板 */}
        <div class="relative w-[480px] h-full bg-white shadow-2xl flex flex-col animate-slide-in-right">
          {/* 头部 */}
          <div class="px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
            <div>
              <h2 class="text-base font-semibold text-gray-900">AI 运行日志</h2>
              <p class="text-xs text-gray-500 mt-0.5">
                共 {props.logs.length + (props.workflowEvents?.length ?? 0)} 条记录
                {props.workflowEvents && props.workflowEvents.length > 0
                  ? `（含 ${props.workflowEvents.length} 条工作流事件）`
                  : ''}
              </p>
            </div>
            <div class="flex items-center gap-2">
              <button
                class="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
                onClick={props.onClearLogs}
              >
                清空
              </button>
              <button
                class="p-1.5 hover:bg-gray-200 rounded transition-colors"
                onClick={props.onClose}
              >
                <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* 筛选器 */}
          <div class="px-5 py-3 border-b border-gray-200 space-y-2">
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-500 shrink-0">状态:</span>
              <div class="flex gap-1 flex-wrap">
                <button
                  class={`px-2 py-1 text-xs rounded ${filterStatus() === 'all' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  onClick={() => setFilterStatus('all')}
                >
                  全部
                </button>
                <For each={Object.entries(statusConfig)}>
                  {([status, config]) => (
                    <button
                      class={`px-2 py-1 text-xs rounded ${filterStatus() === status ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                      onClick={() => setFilterStatus(status as AITaskStatus)}
                    >
                      {config.label}
                    </button>
                  )}
                </For>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-500 shrink-0">类型:</span>
              <div class="flex gap-1">
                <button
                  class={`px-2 py-1 text-xs rounded ${filterType() === 'all' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  onClick={() => setFilterType('all')}
                >
                  全部
                </button>
                <For each={Object.entries(taskTypeLabels)}>
                  {([type, label]) => (
                    <button
                      class={`px-2 py-1 text-xs rounded ${filterType() === type ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                      onClick={() => setFilterType(type as AITaskType)}
                    >
                      {label}
                    </button>
                  )}
                </For>
              </div>
            </div>
          </div>

          {/* 日志列表 */}
          <div class="flex-1 overflow-y-auto">
            <Show when={filteredLogs().length === 0}>
              <div class="flex flex-col items-center justify-center h-32 text-gray-400 text-sm">
                <span class="text-2xl mb-2">📋</span>
                <span>暂无匹配日志</span>
              </div>
            </Show>

            <For each={filteredLogs()}>
              {(log) => {
                const status = statusConfig[log.status];

                return (
                  <div class="px-5 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <span class={`text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                        <span class="text-xs text-gray-500">
                          {taskTypeLabels[log.taskType]}
                        </span>
                      </div>
                      <span class="text-xs text-gray-400">{formatTime(log.createdAt)}</span>
                    </div>

                    <div class="mt-2 space-y-1">
                      <div class="text-xs text-gray-600">
                        <span class="font-medium">输入:</span> {log.inputSummary}
                      </div>
                      <Show when={log.outputSummary}>
                        <div class="text-xs text-gray-600">
                          <span class="font-medium">输出:</span> {log.outputSummary}
                        </div>
                      </Show>
                      <Show when={log.errorMessage}>
                        <div class="text-xs text-red-600">
                          <span class="font-medium">错误:</span> {log.errorMessage}
                        </div>
                      </Show>
                    </div>

                    <div class="mt-2 flex items-center gap-3 text-xs text-gray-400">
                      <span>耗时: {formatDuration(log.duration)}</span>
                      <span>Provider: {log.provider}</span>
                    </div>
                  </div>
                );
              }}
            </For>
          </div>

          {/* 返修#2 VB15: 工作流事件日志列表 */}
          <Show when={props.workflowEvents && props.workflowEvents.length > 0}>
            <For each={props.workflowEvents}>
              {(event) => {
                const typeLabel = wfEventTypeLabels[event.type] || event.type;

                return (
                  <div class="px-5 py-3 border-b border-gray-100 hover:bg-indigo-50/30 transition-colors">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <span class="text-xs font-medium text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                          WF
                        </span>
                        <span class="text-xs font-medium text-gray-700">{typeLabel}</span>
                      </div>
                      <span class="text-xs text-gray-400">
                        {new Date(event.timestamp).toLocaleTimeString('zh-CN')}
                      </span>
                    </div>

                    {/* 事件详情（按类型差异化显示） */}
                    <div class="mt-2 space-y-1">
                      {'content' in event && (
                        <div class="text-xs text-gray-600">
                          <span class="font-medium">内容:</span>{' '}
                          {(event as any).content?.slice(0, 80)}
                          {((event as any).content?.length ?? 0) > 80 ? '...' : ''}
                        </div>
                      )}
                      {'summary' in event && (event as any).summary && (
                        <div class="text-xs text-gray-600">
                          <span class="font-medium">摘要:</span> {(event as any).summary}
                        </div>
                      )}
                      {'wordCount' in event && (event as any).wordCount > 0 && (
                        <div class="text-xs text-gray-500">
                          字数: {(event as any).wordCount}
                        </div>
                      )}
                      {'auditScore' in event && (event as any).auditScore != null && (
                        <div class="text-xs text-gray-500">
                          审计评分: {(event as any).auditScore}/100
                        </div>
                      )}
                      {'entropyDelta' in event && (event as any).entropyDelta != null && (
                        <div class="text-xs text-gray-500">
                          熵变化: +{(event as any).entropyDelta} bit
                        </div>
                      )}
                    </div>

                    <div class="mt-1 text-[10px] text-gray-300">
                      workflowId: {event.workflowId}
                    </div>
                  </div>
                );
              }}
            </For>
          </Show>
        </div>
      </div>
    </Show>
  );
}
