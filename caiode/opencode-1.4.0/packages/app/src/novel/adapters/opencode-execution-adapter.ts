/**
 * @file adapters/opencode-execution-adapter.ts
 * @description OpenCode Execution Adapter Stub — P2-E
 *
 * P2-E 只建立接口边界，真实 OpenCode 接入放到 P3 或独立 gated adapter 阶段。
 * 本 stub 不调用真实 OpenCode Server、不读取真实 session/provider、不修改 OpenCode Core。
 * 当 FeatureGate 开启时，返回稳定的 stub 结果以验证路由链路；P2 默认 gate 关闭，由 Router 返回 ADAPTER_DISABLED。
 */

import type { NovelCommand } from '../workflows/novel-command';
import type { NovelAgentResult } from '../types/ai-task';
import type { AdapterContext, AdapterExecutionResult, AgentExecutionAdapter } from './adapter-types';

/**
 * OpenCode Stub 执行器。
 * 仅用于证明 AdapterRouter 可以路由到 opencode-stub；不执行真实外部调用。
 */
export class OpenCodeExecutionAdapter implements AgentExecutionAdapter {
  readonly name = 'opencode-stub' as const;

  canHandle(_command: NovelCommand, _context: AdapterContext): boolean {
    // P2-E 仅做边界，不根据 modelRole 过滤；任何命令都可被 stub 承接。
    return true;
  }

  /**
   * 返回稳定的 stub 结果，明确标识未调用真实服务。
   * 真实 OpenCode 接入前，此结果仅用于路由验证，不会进入 UI 作为正式生成内容。
   */
  async execute(command: NovelCommand, _context: AdapterContext): Promise<AdapterExecutionResult> {
    const result: NovelAgentResult = {
      taskId: `opencode-stub-${command.chapterId ?? 'none'}`,
      attemptId: 1,
      status: 'completed',
      text: '[OpenCode Stub] 未调用真实 OpenCode Server。P2-E 仅验证 AdapterRouter 路由边界。',
      wordCount: 0,
      summary: 'OpenCode Stub 占位结果',
      durationMs: 0,
    };
    return { success: true, result };
  }
}
