/**
 * @file scripts/trae-hooks/shared/novel-rules.ts
 * @description NovelForge 项目级规则常量
 *
 * P2-E：定义 P2 阶段硬性边界、禁止命令、风险关键字与代码检查规则。
 * 所有 Trae Hook 脚本和 novel-precommit-check.ts 共享此常量，避免规则散落在多个文件中。
 */

/** P2 阶段明确禁止的真实外部操作 */
export const BLOCKED_COMMAND_PATTERNS = [
  /git\s+worktree\s+(add|remove|move|prune)/i,
  /git\s+(merge|rebase|checkout\s+-f)/i,
  /git\s+push\s+--force/i,
];

/** P2 阶段禁止在代码中出现的关键词或调用 */
export const BLOCKED_CODE_PATTERNS = [
  /openai\.com\/v\d+/i,
  /anthropic\.com\/v\d+/i,
  /api\.openrouter\.ai/i,
  /claude\.ai\/api/i,
  /api\.opencode\.ai/i,
];

/** 伪成功相关风险模式 */
export const PSEUDO_SUCCESS_PATTERNS = [
  /onClick=\{\(\)\s*=>\s*\{\s*\}\}/,
  /onClick=\{async\s*\(\)\s*=>\s*\{\s*\}\}/,
  /handler=\{\(\)\s*=>\s*\{\s*\}\}/,
  /TODO:\s*implement/i,
  /FIXME:\s*implement/i,
];

/** 真实 LLM / OpenCode / ClaudeCode / git worktree 等高风险命令 */
export const HIGH_RISK_TOOL_COMMANDS = [
  'opencode serve',
  'opencode dev',
  'claude',
  'claude-code',
  'git worktree',
  'git merge',
  'git rebase',
  'git checkout -f',
];

/** OpenCode Core 保护路径 */
export const OPENCODE_CORE_PATHS = [
  'packages/opencode/',
  'packages/sdk/',
  'packages/plugin/',
  'packages/desktop/',
  'packages/ui/',
];

/** 代码文件行数限制 */
export const MAX_CODE_FILE_LINES = 500;

/** 需要中文注释说明的复杂文件关键词 */
export const COMPLEX_FILE_KEYWORDS = [
  'dispatcher',
  'engine',
  'workflow',
  'tool',
  'adapter',
  'router',
  'registry',
  'mutations',
];

/** SolidJS ViewModel 中应优先用 createStore 的相关状态名 */
export const RELATED_VIEWMODEL_STATES = [
  'chapterUiState',
  'generationConfig',
  'contextOptions',
  'editorState',
  'workspaceState',
];

/** P2 阶段默认关闭的 FeatureGate */
export const P2_DISABLED_GATES = [
  'realLLMEnabled',
  'openCodeAdapterEnabled',
  'claudeCodeAdapterEnabled',
  'paymentEnabled',
  'cloudSyncEnabled',
  'exportEnabled',
  'importEnabled',
  'bookAnalysisEnabled',
  'nameGeneratorEnabled',
  'batchGenerationEnabled',
  'gitWorktreeEnabled',
  'customSkillEnabled',
  'projectCommandEnabled',
];
