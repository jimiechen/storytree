// 沙箱规则接口定义
export interface SandboxRule {
  // 文件访问约束
  allowedPaths: string[];       // 允许读写的路径 glob
  deniedPaths: string[];        // 禁止访问的路径 glob
  
  // 命令执行约束  
  allowedCommands: string[];    // 白名单命令
  deniedCommands: string[];     // 黑名单命令
  
  // 模型约束
  allowedModels: string[];      // 该沙箱允许使用的模型
  maxTokensPerRequest: number;  // 单次请求 token 上限
  
  // 任务约束
  taskScope: string;            // 任务描述（自然语言，注入 system prompt）
  maxIterations: number;        // Agent Loop 最大迭代次数
}

// 规则评估结果
export interface RuleResult {
  allowed: boolean;
  reason?: string;
  violatedRule?: keyof SandboxRule;
}

// 操作类型
export type ActionType = 'fileRead' | 'fileWrite' | 'commandExecute' | 'modelCall' | 'taskIteration';

// 操作上下文
export interface ActionContext {
  type: ActionType;
  path?: string;           // 适用于文件操作
  command?: string;        // 适用于命令执行
  model?: string;          // 适用于模型调用
  tokens?: number;         // 适用于模型调用
  iteration?: number;      // 适用于任务迭代
  sandboxName: string;     // 沙箱名称
}