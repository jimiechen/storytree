// CDP 驱动层接口
export interface IDEDriver {
  // 找到聊天输入框并输入文本
  typeInChatInput(text: string): Promise<void>;
  
  // 提交消息（回车或点击发送按钮）
  submitMessage(): Promise<void>;
  
  // 等待 Agent 响应完成（检测"停止生成"按钮消失 或 流式输出停止）
  waitForResponseComplete(timeoutMs: number): Promise<string>;
  
  // 读取最新一条 Agent 响应内容
  getLastResponse(): Promise<string>;
  
  // 检测当前 IDE 是否处于可接受输入状态
  isReady(): Promise<boolean>;
  
  // 新建对话（清空上下文）
  newConversation(): Promise<void>;
}

// IDE 适配器配置
export interface IDEAdapterConfig {
  id: string;
  name: string;
  version: string;
  debugPort: number;
  
  selectors: {
    chatInput: string;
    submitButton: string;
    responseContainer: string;
    streamingIndicator: string;
    stopButton: string;
    newChatButton: string;
    taskListItem: string;
    taskTitle: string;
  };
  
  waitStrategies: {
    responseComplete: {
      type: string;
      selector: string;
      pollInterval: number;
      timeout: number;
    };
    inputReady: {
      type: string;
      selector: string;
      pollInterval: number;
      timeout: number;
    };
  };
  
  submitMethod: string;
  
  inputMethod: {
    type: string;
    property: string;
    triggerEvents: string[];
  };
}

// Agent 任务接口
export interface AgentTask {
  id: string;
  sandboxId: string;        // 对应哪个 Worktree 沙箱
  prompt: string;           // 发给 Agent 的指令
  skillId?: string;         // 使用哪个 Skill
  maxRetries: number;       // 失败重试次数
  timeoutMs: number;        // 单次执行超时
  onComplete: (result: TaskResult) => void;
  onError: (error: TaskError) => void;
}

// 任务结果
export interface TaskResult {
  taskId: string;
  success: boolean;
  response: string;
  durationMs: number;
  timestamp: number;
}

// 任务错误
export interface TaskError {
  taskId: string;
  error: string;
  retryCount: number;
  timestamp: number;
}

// 健康检查结果
export interface SelectorCheckResult {
  key: string;
  selector: string;
  exists: boolean;
}

export interface HealthReport {
  healthy: boolean;
  failedSelectors: SelectorCheckResult[];
}

// IDE 适配器接口
export interface IDEAdapter {
  config: IDEAdapterConfig;
  waitForReady(): Promise<void>;
  typeInChatInput(text: string): Promise<void>;
  submitMessage(): Promise<void>;
  waitForResponseComplete(timeoutMs: number): Promise<string>;
  getLastResponse(): Promise<string>;
  newConversation(): Promise<void>;
  isReady(): Promise<boolean>;
  checkHealth(): Promise<HealthReport>;
}

// 任务队列接口
export interface AutomationQueue {
  enqueue(task: AgentTask, priority?: string): void;
  dequeue(): AgentTask | null;
  isEmpty(): boolean;
  process(): Promise<void>;
  cancelTask(taskId: string): boolean;
  getQueueLength(): number;
}

// 任务编排器接口
export interface TaskOrchestrator {
  executeTask(task: AgentTask): Promise<TaskResult>;
  buildPrompt(task: AgentTask): string;
  parseResponse(response: string, task: AgentTask): TaskResult;
  writeTaskReport(task: AgentTask, result: TaskResult): Promise<void>;
  switchToSandbox(sandboxId: string): Promise<void>;
}