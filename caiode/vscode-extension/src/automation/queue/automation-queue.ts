import { AgentTask, AutomationQueue as AutomationQueueInterface } from '../types';
import { TaskOrchestrator } from '../orchestrator/task-orchestrator';

// 优先级队列实现
class PriorityQueue<T> {
  private items: { element: T; priority: string }[] = [];

  enqueue(element: T, priority: string = 'medium'): void {
    const priorityLevels = { high: 0, medium: 1, low: 2 };
    const priorityValue = priorityLevels[priority as keyof typeof priorityLevels] || 1;

    let inserted = false;
    for (let i = 0; i < this.items.length; i++) {
      const itemPriority = priorityLevels[this.items[i].priority as keyof typeof priorityLevels] || 1;
      if (priorityValue < itemPriority) {
        this.items.splice(i, 0, { element, priority });
        inserted = true;
        break;
      }
    }

    if (!inserted) {
      this.items.push({ element, priority });
    }
  }

  dequeue(): T | null {
    if (this.isEmpty()) {
      return null;
    }
    return this.items.shift()?.element || null;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  length(): number {
    return this.items.length;
  }

  remove(taskId: string): boolean {
    const index = this.items.findIndex(item => (item.element as AgentTask).id === taskId);
    if (index !== -1) {
      this.items.splice(index, 1);
      return true;
    }
    return false;
  }
}

export class AutomationQueue implements AutomationQueueInterface {
  private queue: PriorityQueue<AgentTask>;
  private isProcessing: boolean = false;
  private currentTask: AgentTask | null = null;
  private orchestrator: TaskOrchestrator;

  constructor(orchestrator: TaskOrchestrator) {
    this.queue = new PriorityQueue<AgentTask>();
    this.orchestrator = orchestrator;
  }

  enqueue(task: AgentTask, priority?: string): void {
    this.queue.enqueue(task, priority);
    // 自动开始处理队列
    this.process();
  }

  dequeue(): AgentTask | null {
    return this.queue.dequeue();
  }

  isEmpty(): boolean {
    return this.queue.isEmpty();
  }

  async process(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (!this.queue.isEmpty()) {
      const task = this.queue.dequeue();
      if (!task) break;

      this.currentTask = task;

      try {
        const result = await this.orchestrator.executeTask(task);
        task.onComplete(result);
      } catch (error) {
        if (task.maxRetries > 0) {
          // 重新入队，重试次数减一
          this.queue.enqueue({ ...task, maxRetries: task.maxRetries - 1 }, 'high');
        } else {
          task.onError({ 
            taskId: task.id, 
            error: (error as Error).message, 
            retryCount: task.maxRetries, 
            timestamp: Date.now() 
          });
        }
      } finally {
        this.currentTask = null;
        // 任务间隔：给 IDE 一点喘息时间
        await this.sleep(1000);
      }
    }

    this.isProcessing = false;
  }

  cancelTask(taskId: string): boolean {
    // 如果是当前任务，无法取消
    if (this.currentTask && this.currentTask.id === taskId) {
      return false;
    }
    // 从队列中移除
    return this.queue.remove(taskId);
  }

  getQueueLength(): number {
    return this.queue.length();
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
