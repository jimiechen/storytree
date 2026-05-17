import { createSignal, createResource } from 'solid-js';
import type { AILog, AITaskStatus } from '../types';
import { AILogProvider } from '../providers/providers-index';

const logProvider = new AILogProvider();

export function useAILog() {
  const [filter, setFilter] = createSignal<AITaskStatus | undefined>(undefined);
  const [limit, setLimit] = createSignal<number>(50);

  const [logs, { refetch }] = createResource(
    () => ({ status: filter(), limit: limit() }),
    async (options) => {
      return logProvider.listLogs(options);
    }
  );

  const addLog = async (task: { id: string; type: string; status: AITaskStatus; input: { text: string }; output?: { text: string }; error?: string; duration?: number }) => {
    // 创建符合 AITask 接口的简化对象用于日志记录
    const mockTask = {
      ...task,
      type: task.type as any,
      chapterId: '',
      createdAt: new Date(),
      input: task.input
    } as any;
    await logProvider.logTask(mockTask);
    refetch();
  };

  return {
    logs,
    filter,
    setFilter,
    limit,
    setLimit,
    addLog,
    refetch
  };
}
