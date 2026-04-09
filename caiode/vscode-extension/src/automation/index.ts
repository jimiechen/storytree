import { IDEAdapterLoader } from './adapters/adapter-loader';
import { TaskOrchestrator } from './orchestrator/task-orchestrator';
import { AutomationQueue } from './queue/automation-queue';
import { AgentTask, IDEAdapter } from './types';

// CDP 客户端接口
interface CDPClient {
  send(method: string, params?: any): Promise<any>;
}

export class AutomationSystem {
  private adapter: IDEAdapter | null = null;
  private orchestrator: TaskOrchestrator | null = null;
  private queue: AutomationQueue | null = null;
  private cdpClient: CDPClient;
  private adapterDir: string;

  constructor(cdpClient: CDPClient, adapterDir: string) {
    this.cdpClient = cdpClient;
    this.adapterDir = adapterDir;
  }

  async initialize(): Promise<void> {
    // 加载 IDE 适配器
    const loader = new IDEAdapterLoader(this.cdpClient, this.adapterDir);
    this.adapter = await loader.detectAndLoad();

    // 检查适配器健康状态
    const healthReport = await this.adapter.checkHealth();
    if (!healthReport.healthy) {
      console.warn('IDE 适配器健康检查失败:', healthReport.failedSelectors);
    }

    // 初始化任务编排器
    this.orchestrator = new TaskOrchestrator(this.adapter);

    // 初始化任务队列
    this.queue = new AutomationQueue(this.orchestrator);

    // 监听适配器配置变化
    await loader.watchAdapterConfig(async () => {
      console.log('适配器配置已更新，重新加载...');
      await this.reloadAdapter();
    });
  }

  async reloadAdapter(): Promise<void> {
    const loader = new IDEAdapterLoader(this.cdpClient, this.adapterDir);
    this.adapter = await loader.detectAndLoad();
    this.orchestrator = new TaskOrchestrator(this.adapter);
    this.queue = new AutomationQueue(this.orchestrator);
  }

  enqueueTask(task: AgentTask): void {
    if (!this.queue) {
      throw new Error('Automation system not initialized');
    }
    this.queue.enqueue(task);
  }

  getQueueLength(): number {
    return this.queue?.getQueueLength() || 0;
  }

  cancelTask(taskId: string): boolean {
    return this.queue?.cancelTask(taskId) || false;
  }

  async executeTask(task: AgentTask): Promise<any> {
    if (!this.orchestrator) {
      throw new Error('Automation system not initialized');
    }
    return this.orchestrator.executeTask(task);
  }
}

export * from './types';
export { CDPDriver } from './drivers/cdp-driver';
export { CDPBasedAdapter } from './adapters/cdp-based-adapter';
export { IDEAdapterLoader } from './adapters/adapter-loader';
export { TaskOrchestrator } from './orchestrator/task-orchestrator';
export { AutomationQueue } from './queue/automation-queue';
