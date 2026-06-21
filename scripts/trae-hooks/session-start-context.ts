/**
 * @file scripts/trae-hooks/session-start-context.ts
 * @description SessionStart Hook：注入 P2 阶段边界与项目上下文
 *
 * P2-E：在每次会话开始时，向当前 Agent 附加 NovelForge P2 阶段边界、
 * 中文注释规范、FeatureGate 默认值、提交前检查要求等上下文。
 * 本脚本不阻断会话，只追加上下文提示。
 */

import { readHookInput } from './shared/read-hook-input';
import { outputSessionStart } from './shared/hook-output';

async function main(): Promise<void> {
  await readHookInput();

  const additionalContext = `## NovelForge P2 阶段边界（项目级 Hook 注入）
- 禁止接真实 LLM / OpenCode Server / ClaudeCode CLI
- 禁止执行真实 git worktree / merge / rebase / checkout -f
- 禁止写真实小说项目文件到用户工作区
- 禁止引入数据库 / ORM / 支付 / 云同步代码或依赖
- 禁止修改 OpenCode Core（packages/opencode/、sdk/、plugin/、desktop/、ui/）
- 禁止加载项目级 / 用户自定义 Skill（customSkillEnabled / projectCommandEnabled 关闭）
- 禁止未 FeatureGate 的未完成功能直接暴露为可用
- 复杂逻辑必须补充中文注释（说明为什么这样设计、阶段边界、失败策略）
- ViewModel 中相关 UI 状态优先使用 createStore，避免多个独立 createSignal 管理同一组状态
- 任务完成前必须运行：cd packages/app && bun run novel:precommit
- 任务完成前必须执行 Git 提交，且不得混入无关文件（tabbit 提示词、截图等）`;

  outputSessionStart(additionalContext);
}

main().catch(() => {
  // SessionStart 不阻断，即使失败也输出空上下文
  outputSessionStart('');
  process.exit(0);
});
