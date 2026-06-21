/**
 * @file adapters/mock-execution-adapter.ts
 * @description Mock Execution Adapter — P2-E
 *
 * P2-E 的 AdapterRouter 默认执行器。
 * 内部包装已有的 MockAgentAdapter，不调用真实 LLM，只生成确定性 Mock 数据。
 * dryRun=true 时仍返回稳定结果，不写真实文件、不接网络。
 */

import type { NovelCommand } from '../workflows/novel-command';
import type { NovelAgentResult } from '../types/ai-task';
import type { AdapterContext, AdapterExecutionResult, AgentExecutionAdapter } from './adapter-types';
import { MockAgentAdapter } from './mock-agent-adapter';

export interface MockExecutionAdapterOptions {
  /** 延迟倍数；测试可设为 0 跳过等待 */
  delayMultiplier?: number;
  /** 是否静默日志 */
  silent?: boolean;
}

/**
 * Mock 执行器。
 * 作为 P2 阶段唯一可用的真实执行路径，保证所有 AI 工作流都有确定性输出。
 */
export class MockExecutionAdapter implements AgentExecutionAdapter {
  readonly name = 'mock' as const;

  private readonly adapter: MockAgentAdapter;

  constructor(options?: MockExecutionAdapterOptions) {
    this.adapter = new MockAgentAdapter({
      delayMultiplier: options?.delayMultiplier ?? 1,
      silent: options?.silent ?? false,
    });
  }

  /**
   * Mock 适配器能处理所有 P2 支持的命令。
   * 后续真实 adapter 接入后，可在这里按 command / modelRole 做更细判断。
   */
  canHandle(_command: NovelCommand, _context: AdapterContext): boolean {
    return true;
  }

  /**
   * 执行命令并返回结构化结果。
   * 包装 MockAgentAdapter.run()，把终态 NovelAgentResult 转成 AdapterExecutionResult。
   */
  async execute(command: NovelCommand, _context: AdapterContext): Promise<AdapterExecutionResult> {
    const result: NovelAgentResult = await this.adapter.run(command);
    return { success: true, result };
  }
}
