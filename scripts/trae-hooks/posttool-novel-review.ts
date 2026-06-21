/**
 * @file scripts/trae-hooks/posttool-novel-review.ts
 * @description PostToolUse Hook：Write/Edit 后快速代码审查
 *
 * P2-E：在 Agent 写入或修改代码后，基于文件路径和 git diff 做快速规则扫描。
 * 本 Hook 只做 fail/block 级判断，详细行数/注释/测试覆盖由 Stop 阶段与 novel:precommit 负责。
 */

import { readHookInput } from './shared/read-hook-input';
import { outputPostToolUse } from './shared/hook-output';
import { OPENCODE_CORE_PATHS, PSEUDO_SUCCESS_PATTERNS } from './shared/novel-rules';

function touchesOpenCodeCore(files: string[]): string | undefined {
  for (const file of files) {
    for (const core of OPENCODE_CORE_PATHS) {
      if (file.includes(core)) return file;
    }
  }
  return undefined;
}

function checkPseudoSuccess(output?: string): string | undefined {
  if (!output) return undefined;
  for (const pattern of PSEUDO_SUCCESS_PATTERNS) {
    if (pattern.test(output)) {
      return `检测到空 handler 或 TODO implement 占位：${pattern.source}`;
    }
  }
  return undefined;
}

async function main(): Promise<void> {
  const { input } = await readHookInput();
  const files = input.filesChanged ?? [];

  // 检查 OpenCode Core 被修改
  const coreFile = touchesOpenCodeCore(files);
  if (coreFile) {
    outputPostToolUse(
      'block',
      `检测到修改 OpenCode Core：${coreFile}。P2 阶段禁止修改 packages/opencode/、sdk/、plugin/、desktop/、ui/。`,
      `filesChanged: ${files.join(', ')}`,
    );
    return;
  }

  // 检查 Write/Edit 输出内容中是否存在明显空 handler
  const pseudoReason = checkPseudoSuccess(input.output);
  if (pseudoReason) {
    outputPostToolUse('fail', pseudoReason, '请在实现完成前不要暴露可点击的空 handler 或 TODO implement');
    return;
  }

  outputPostToolUse('pass', 'PostToolUse 快速审查通过', `filesChanged: ${files.join(', ')}`);
}

main().catch(() => {
  outputPostToolUse('fail', 'PostToolUse 审查脚本异常', '请检查脚本输出');
  process.exit(2);
});
