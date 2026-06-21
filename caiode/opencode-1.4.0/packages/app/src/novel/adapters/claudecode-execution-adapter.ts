/**
 * @file adapters/claudecode-execution-adapter.ts
 * @description ClaudeCode Execution Adapter Stub — P2-E
 *
 * P2-E 不允许调用真实 ClaudeCode CLI，避免引入本地环境、权限和不可控副作用。
 * 本 stub 不执行 shell command、不访问文件系统、不调用任何外部 CLI。
 * 真实 ClaudeCode 接入需等到 P3 或独立 gated adapter 阶段，并由专人审批。
 */

import type { NovelCommand } from '../workflows/novel-command';
import type { NovelAgentResult } from '../types/ai-task';
import type { AdapterContext, AdapterExecutionResult, AgentExecutionAdapter } from './adapter-types';

/**
 * ClaudeCode Stub 执行器。
 * 仅用于证明 AdapterRouter 可以路由到 claudecode-stub；不执行真实外部调用。
 */
export class ClaudeCodeExecutionAdapter implements AgentExecutionAdapter {
  readonly name = 'claudecode-stub' as const;

  canHandle(_command: NovelCommand, _context: AdapterContext): boolean {
    return true;
  }

  /**
   * 返回稳定的 stub 结果，明确标识未调用真实 ClaudeCode CLI。
   * 真实 ClaudeCode 接入前，此结果仅用于路由验证。
   */
  async execute(command: NovelCommand, _context: AdapterContext): Promise<AdapterExecutionResult> {
    const result: NovelAgentResult = {
      taskId: `claudecode-stub-${command.chapterId ?? 'none'}`,
      attemptId: 1,
      status: 'completed',
      text: '[ClaudeCode Stub] 未调用真实 ClaudeCode CLI。P2-E 仅验证 AdapterRouter 路由边界。',
      wordCount: 0,
      summary: 'ClaudeCode Stub 占位结果',
      durationMs: 0,
    };
    return { success: true, result };
  }
}
