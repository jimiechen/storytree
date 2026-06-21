/**
 * @file scripts/trae-hooks/shared/hook-output.ts
 * @description 统一输出 Trae Hook 响应 JSON
 *
 * P2-E：所有 Hook 脚本统一使用此模块输出，保证 SessionStart / PreToolUse / PostToolUse / Stop
 * 四种事件的响应格式一致，便于 Trae IDE 解析。
 */

export type Decision = 'pass' | 'warning' | 'fail' | 'block' | 'allow' | 'deny' | 'ask';

export interface HookOutput {
  decision?: Decision;
  reason?: string;
  additionalContext?: string;
  summary?: string;
  hookSpecificOutput?: unknown;
}

export function outputSessionStart(additionalContext: string): void {
  const out: HookOutput = { additionalContext };
  console.log(JSON.stringify(out));
}

export function outputPreToolUse(decision: 'deny' | 'ask' | 'allow', reason: string): void {
  const out: HookOutput = {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: decision,
      permissionDecisionReason: reason,
    },
  };
  console.log(JSON.stringify(out));
}

export function outputPostToolUse(decision: Decision, reason: string, additionalContext?: string): void {
  const out: HookOutput = { decision, reason, additionalContext };
  console.log(JSON.stringify(out));
}

export function outputStop(decision: 'allow' | 'block', reason: string, summary?: string): void {
  const out: HookOutput = { decision, reason, summary };
  console.log(JSON.stringify(out));
}
