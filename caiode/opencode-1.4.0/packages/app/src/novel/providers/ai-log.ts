import type { AITask, AITaskStatus, AILog } from '../types';
import type { IAILogProvider } from './index';

export class AILogProvider implements IAILogProvider {
  private logs: AILog[] = [];

  async logTask(task: AITask): Promise<void> {
    const log: AILog = {
      id: `log-${Date.now()}`,
      taskId: task.id,
      taskType: task.type,
      inputSummary: task.input.text.slice(0, 100) + (task.input.text.length > 100 ? '...' : ''),
      outputSummary: task.output?.text.slice(0, 100) + (task.output?.text && task.output.text.length > 100 ? '...' : '') || 'N/A',
      status: task.status,
      duration: task.duration || 0,
      errorMessage: task.error,
      provider: 'FakeAgentProvider',
      createdAt: new Date()
    };
    this.logs.unshift(log);
  }

  async listLogs(options?: { status?: AITaskStatus; limit?: number }): Promise<AILog[]> {
    let result = [...this.logs];
    if (options?.status) {
      result = result.filter(l => l.status === options.status);
    }
    if (options?.limit) {
      result = result.slice(0, options.limit);
    }
    return result;
  }

  async getLog(taskId: string): Promise<AILog | null> {
    return this.logs.find(l => l.taskId === taskId) || null;
  }
}
