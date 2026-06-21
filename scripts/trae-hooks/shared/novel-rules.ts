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

/** P3-0 禁止前端代码中硬编码 API Key / 直接读取 process.env 密钥 */
export const CLIENT_SIDE_SECRET_PATTERNS = [
  /process\.env\.[A-Z_]*(?:API_?KEY|TOKEN|SECRET)/i,
  /['"`]sk-[a-zA-Z0-9]{20,}['"`]/i,
  /['"`]Bearer\s+[a-zA-Z0-9\-_]{10,}['"`]/i,
  /api[_-]?key\s*[:=]\s*['"`][a-zA-Z0-9]{10,}['"`]/i,
];

/** P3-0 禁止真实 LLM endpoint 硬编码 */
export const LLM_ENDPOINT_PATTERNS = [
  /fetch\([\s\S]{0,120}https?:\/\/(?:api\.)?(?:openai|anthropic|openrouter|claude|opencode)\.[^\s)]*/i,
];

/** P3-0 禁止在日志中输出完整 prompt / response */
export const FULL_PROMPT_LOGGING_PATTERNS = [
  /console\.(log|warn|error|info)\([^)]*prompt\)/i,
  /console\.(log|warn|error|info)\([^)]*responseText\)/i,
  /console\.(log|warn|error|info)\([^)]*fullPrompt\)/i,
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
