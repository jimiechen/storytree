/**
 * @file scripts/trae-hooks/pretool-guard.ts
 * @description PreToolUse Hook：拦截高风险 RunCommand
 *
 * P2-E：在 Agent 调用 RunCommand 前检查命令内容，命中 P2 禁止的真实外部操作时返回 deny。
 * 允许测试、构建、类型检查、Git status / add / commit 等常规命令。
 */

import { readHookInput } from './shared/read-hook-input';
import { outputPreToolUse } from './shared/hook-output';
import { BLOCKED_COMMAND_PATTERNS, HIGH_RISK_TOOL_COMMANDS } from './shared/novel-rules';

function isBlockedCommand(command: string): { blocked: boolean; reason?: string } {
  for (const pattern of BLOCKED_COMMAND_PATTERNS) {
    if (pattern.test(command)) {
      return { blocked: true, reason: `P2 阶段禁止执行真实 git 操作：${command}` };
    }
  }
  for (const risk of HIGH_RISK_TOOL_COMMANDS) {
    if (command.includes(risk)) {
      return { blocked: true, reason: `P2 阶段禁止调用真实外部服务或 CLI：${risk}` };
    }
  }
  return { blocked: false };
}

async function main(): Promise<void> {
  const { input } = await readHookInput();
  const commandText = (input.tool?.input as { command?: string } | undefined)?.command ?? '';

  if (!commandText) {
    outputPreToolUse('allow', '未检测到命令内容');
    return;
  }

  const check = isBlockedCommand(commandText);
  if (check.blocked) {
    outputPreToolUse('deny', check.reason ?? 'P2 阶段禁止的高风险命令');
    return;
  }

  outputPreToolUse('allow', '命令通过 P2 安全审查');
}

main().catch(() => {
  // 脚本异常时保守阻断
  outputPreToolUse('deny', 'PreToolUse Guard 异常，保守阻断');
  process.exit(2);
});
