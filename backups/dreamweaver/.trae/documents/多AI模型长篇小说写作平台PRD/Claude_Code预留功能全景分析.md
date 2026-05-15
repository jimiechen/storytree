# Claude Code 预留功能全景分析

> 基于 Claude Code v2.1.88 反编译源码（1902 个 TypeScript/TSX 文件）的预留/实验性/未来功能完整清单

---

## 一、总览

Claude Code 通过 **四层功能门控体系** 管理功能的发布节奏：

| 门控层级 | 技术手段 | 数量 | 用途 |
|---------|---------|------|------|
| **L1: 编译时 DCE** | `feature()` + Bun 死代码消除 | ~40 个 | 功能模块在未启用时从产物中完全移除 |
| **L2: 运行时 Feature Gate** | GrowthBook/Statsig `tengu_*` flag | ~80 个 | 灰度发布、A/B 测试、远程配置 |
| **L3: 环境变量开关** | `CLAUDE_CODE_DISABLE_*` 等 | ~40 个 | 用户/运维手动控制 |
| **L4: API Beta Header** | `beta` 参数 | ~20 个 | API 层面的实验性功能 |

---

## 二、编译时条件编译功能（`feature()` 标记）

通过 `import { feature } from 'bun:bundle'` 控制，未启用时整个功能模块被死代码消除（DCE）移除。

### 2.1 🔴 完整子系统（代码已实现，等待发布）

这些是最大的预留功能，每个都控制一个完整的子系统：

| Feature Flag | 功能名称 | 规模 | 状态推测 |
|-------------|---------|------|---------|
| **`KAIROS`** | 助手模式（Agent SDK） | 🔴🔴🔴 最大子系统之一 | 内部测试中，包含 assistant 模式、频道通信、Brief、Dream 等子功能 |
| **`COORDINATOR_MODE`** | 多代理协调器 | 🔴🔴🔴 完整子系统 | 内部测试中，多代理任务编排 |
| **`TRANSCRIPT_CLASSIFIER`** | 自动模式（Auto Mode） | 🔴🔴🔴 权限核心 | 已灰度发布（Max/Pro），含 AFK 模式 |
| **`AGENT_TRIGGERS`** | 定时任务调度（Cron） | 🔴🔴 完整子系统 | 已灰度发布，含 `/loop` 技能 |
| **`BRIDGE_MODE`** | 远程控制桥接 | 🔴🔴🔴 完整子系统 | 已发布（claude.ai/code 集成） |
| **`DIRECT_CONNECT`** | 会话服务器 | 🔴🔴 完整子系统 | 内部测试中（`claude server` + `claude open`） |
| **`SSH_REMOTE`** | SSH 远程执行 | 🔴🔴 完整子系统 | 内部测试中（`claude ssh <host>`） |
| **`VOICE_MODE`** | 语音交互 | 🔴🔴 UI 子系统 | 内部测试中 |
| **`CONTEXT_COLLAPSE`** | 上下文折叠 | 🔴🔴 压缩子系统 | Ant-only，高级上下文管理 |
| **`UDS_INBOX`** | Unix 域套接字消息 | 🔴🔴 通信子系统 | 内部测试中 |
| **`PROACTIVE`** | 主动自主模式 | 🔴🔴 自主循环 | 内部测试中，常与 KAIROS 联用 |
| **`BG_SESSIONS`** | 后台会话管理 | 🔴 中等 | 内部测试中（ps/logs/attach/kill） |
| **`DAEMON`** | 守护进程模式 | 🔴 中等 | 内部测试中 |
| **`EXTRACT_MEMORIES`** | 自动记忆提取 | 🔴 中等 | Ant-only，从对话中提取记忆 |
| **`WEB_BROWSER_TOOL`** | 内置浏览器面板 | 🔴 中等 | 内部测试中 |

### 2.2 🟡 功能增强（单一功能点）

| Feature Flag | 功能名称 | 说明 |
|-------------|---------|------|
| **`KAIROS_BRIEF`** | Brief 简报模式 | Agent-to-user 通信，`--brief` 选项 |
| **`KAIROS_CHANNELS`** | 频道通信 | 频道权限回调、消息路由 |
| **`KAIROS_DREAM`** | Dream 技能 | `/dream` 内置技能 |
| **`ULTRAPLAN`** | Ultraplan 规划 | 复杂执行计划制定 |
| **`BUDDY`** | 伴侣精灵 | UI 浮动气泡，视觉陪伴 |
| **`AGENT_MEMORY_SNAPSHOT`** | Agent 记忆快照 | Ant-only，自定义 agent 记忆更新 |
| **`AGENT_TRIGGERS_REMOTE`** | 远程定时任务 | `/schedule-remote-agents` 技能 |
| **`HISTORY_SNIP`** | 历史片段压缩 | Snip 压缩算法 |
| **`BASH_CLASSIFIER`** | Bash 命令分类器 | 自动判断 Bash 命令安全性 |
| **`HARD_FAIL`** | 硬失败模式 | `--hard-fail`，logError 直接崩溃 |
| **`CCR_MIRROR`** | CCR 镜像 | Claude Code Remote 镜像 |
| **`CHICAGO_MCP`** | Computer Use MCP | macOS 上的 MCP 计算机使用集成 |
| **`COMMIT_ATTRIBUTION`** | 提交归属 | Git commit 中添加 Claude Code 归属 |
| **`LODESTONE`** | 深度链接协议 | `cc://` URI 协议处理 |
| **`MESSAGE_ACTIONS`** | 消息操作 | 消息上下文操作快捷键 |
| **`AWAY_SUMMARY`** | 离开摘要 | 用户离开时自动生成摘要 |
| **`TERMINAL_PANEL`** | 终端面板 | 内置终端面板（meta+j） |
| **`QUICK_SEARCH`** | 快速搜索 | 输入框快速搜索 |
| **`HISTORY_PICKER`** | 历史选择器 | 输入历史快速选择 |
| **`TOKEN_BUDGET`** | Token 预算 | Token 预算显示和追踪 |
| **`STREAMLINED_OUTPUT`** | 精简输出 | stream-json 模式精简格式 |
| **`TEMPLATES`** | 模板系统 | `new`/`list`/`reply` 模板命令 |
| **`SKILL_IMPROVEMENT`** | 技能改进 | 自动改进已安装技能 |
| **`REVIEW_ARTIFACT`** | 代码审查技能 | `/hunter` 内置技能 |
| **`BUILDING_CLAUDE_APPS`** | Claude 应用构建 | `/claude-api` 技能 |
| **`RUN_SKILL_GENERATOR`** | 技能生成器 | 技能自动生成 |
| **`HOOK_PROMPTS`** | Hook 提示 | 请求提示功能 |
| **`UPLOAD_USER_SETTINGS`** | 设置上传 | 本地设置上传到远程 |
| **`DOWNLOAD_USER_SETTINGS`** | 设置下载 | 从远程下载设置 |
| **`FILE_PERSISTENCE`** | 文件持久化 | 会话数据文件持久化 |
| **`TEAMMEM`** | 团队记忆同步 | 团队记忆同步监视器 |
| **`BYOC_ENVIRONMENT_RUNNER`** | BYOC 运行器 | 自定义环境运行器 |
| **`SELF_HOSTED_RUNNER`** | 自托管运行器 | 自托管运行器 |
| **`ABLATION_BASELINE`** | 消融基线 | 科学实验 L0 基线 |
| **`DUMP_SYSTEM_PROMPT`** | 导出系统提示 | `--dump-system-prompt` |
| **`CONNECTOR_TEXT`** | 连接器文本摘要 | `summarize-connector-text` beta |

### 2.3 Feature 依赖关系图

```
KAIROS (核心助手系统)
├── KAIROS_BRIEF (简报模式)
├── KAIROS_CHANNELS (频道通信)
├── KAIROS_DREAM (Dream 技能)
└── PROACTIVE (主动模式，可与 KAIROS 互换)

AGENT_TRIGGERS (定时任务)
└── AGENT_TRIGGERS_REMOTE (远程定时任务)

DIRECT_CONNECT (会话服务器)
└── CCR_MIRROR (CCR 镜像)

UPLOAD_USER_SETTINGS ←→ DOWNLOAD_USER_SETTINGS (设置同步对)
```

---

## 三、运行时 Feature Gate（GrowthBook `tengu_*` 标记）

通过 GrowthBook/Statsig 远程配置控制，支持灰度发布和 A/B 测试。

### 3.1 🔴 默认关闭的高价值功能

| Flag | 功能 | 意义 |
|------|------|------|
| `tengu_session_memory` | 会话记忆 | 从对话中提取并持久化记忆 |
| `tengu_cobalt_lantern` | Web 端 GitHub 连接 | `/web-setup` 命令 |
| `tengu_surreal_dali` | 定时远程 Agent | `/schedule` 命令 |
| `tengu_terminal_sidebar` | 终端状态侧边栏 | OSC 21337 协议 |
| `tengu_terminal_panel` | 内置终端面板 | Meta+J 切换 |
| `tengu_lodestone_enabled` | Deep Link 协议 | `claude://` URL 处理 |
| `tengu_copper_panda` | 技能自动改进 | 采样后钩子改进技能 |
| `tengu_destructive_command_warning` | 破坏性命令警告 | `rm -rf` 等额外警告 |
| `tengu_hive_evidence` | 验证代理 | 实现后启动对抗性验证 |
| `tengu_anti_distill_fake_tool_injection` | 反蒸馏保护 | 假工具注入 |
| `tengu_fgts` | 细粒度工具流 | 避免大工具输入挂起 |
| `tengu_coral_fern` | 搜索过去上下文 | 记忆搜索指导 |
| `tengu_passport_quail` | 自动记忆提取 | 非交互会话中提取记忆 |
| `tengu_slate_thimble` | 非交互式记忆 | 配合自动记忆提取 |
| `tengu_chrome_auto_enable` | Chrome 自动集成 | 检测到扩展自动启用 |
| `tengu_copper_bridge` | Chrome Bridge URL | Chrome 扩展通信方式 |
| `tengu_vscode_cc_auth` | VSCode OAuth | 带内 OAuth 认证 |
| `tengu_quiet_fern` | VSCode 浏览器支持 | 浏览器相关功能 |
| `tengu_harbor` | Channels 总开关 | MCP 频道功能 |
| `tengu_harbor_permissions` | 通道权限中继 | 通过通道服务器中继权限 |
| `tengu_ccr_bridge` | CCR Bridge | claude.ai 远程控制 |
| `tengu_bridge_repl_v2` | REPL Bridge v2 | 无环境变量依赖的实现 |
| `tengu_cobalt_harbor` | CCR 自动连接 | 所有会话默认连接 CCR |
| `tengu_enable_settings_sync_push` | 设置同步上传 | 后台上传用户设置 |
| `tengu_strap_foyer` | 设置同步下载 | 下载用户设置 |
| `tengu_immediate_model_command` | 即时模型配置 | `/config` 立即生效 |
| `tengu_sedge_lantern` | 离开摘要 | 用户离开后自动摘要 |
| `tengu_streaming_tool_execution2` | 流式工具执行 | 工具执行中流式传输 |
| `tengu_toolref_defer_j8m` | 工具引用延迟 | 优化工具引用排列 |
| `tengu_chair_sermon` | 系统提醒包装 | 附件消息包装和合并 |
| `tengu_pebble_leaf_prune` | 叶子节点修剪 | 消息树剪枝优化 |
| `tengu_otk_slot_v1` | 最大 Token 上限 | 控制输出 Token 数量 |
| `tengu_amber_json_tools` | Token 高效工具 | 减少工具 schema token |
| `tengu_review_bughunter_config` | BugHunter 审查 | 自动代码审查 |
| `tengu_scratch` | Scratchpad | 每会话临时文件目录 |

### 3.2 🟢 默认开启的功能

| Flag | 功能 | 说明 |
|------|------|------|
| `tengu_slate_prism` | SDK 进度摘要 | Agent 进度摘要显示 |
| `tengu_plugin_official_mkt_git_fallback` | 插件 Git 回退 | GCS 失败时回退到 Git |
| `tengu_bridge_repl_v2_cse_shim_enabled` | CSE 会话 ID shim | 兼容性转换 |
| `tengu_kairos_cron` | 定时任务 | `/cron` 命令可用 |
| `tengu_kairos_cron_durable` | 持久化定时任务 | Cron 任务持久化 |
| `tengu_iron_gate_closed` | 分类器 fail-closed | 分类器不可用时拒绝 |

### 3.3 🧪 A/B 测试 Flag

| Flag | 测试内容 | 变体 |
|------|---------|------|
| `tengu_tide_elm` | 高努力模式提示 | off / copy_a / copy_b |
| `tengu_tern_alloy` | 子代理扇出提示 | off / copy_a / copy_b |
| `tengu_timber_lark` | 定时循环命令提示 | off / copy_a / copy_b |
| `tengu_willow_mode` | 空闲返回提示 | off / dialog / hint / hint_v2 |

---

## 四、ANT-ONLY 内部专用功能

仅在 Anthropic 内部构建中启用，外部构建通过 tree-shaking 完全移除。

### 4.1 内部 CLI 命令

| 命令 | 功能 |
|------|------|
| `claude up` | 初始化/升级本地开发环境 |
| `claude rollback` | 回滚到之前版本 |
| `claude log` | 管理对话日志 |
| `claude error` | 查看错误日志 |
| `claude export` | 导出对话到文本文件 |
| `claude task` | 管理任务列表 |
| `--tasks [id]` | 任务模式，监视并自动处理任务 |
| `--agent-teams` | 强制多智能体模式 |
| `--delegate-permissions` | `--permission-mode auto` 的别名 |

### 4.2 内部功能模块

| 功能 | 说明 |
|------|------|
| **归因追踪** (Attribution Tracking) | 追踪代码变更的 AI 归属 |
| **挫败感检测** (Frustration Detection) | 检测用户挫败感并调整行为 |
| **数值 Effort 级别** | 使用 `anthropic_internal` API 的数值 effort |
| **API 性能指标** | TTFT/OTPS spinner 显示 |
| **Shot 统计** | 推测时间节省和 Shot 分布统计 |
| **Chrome Lightning Turn** | Chrome 扩展的快速轮次 |
| **验证智能体** (Verification Agent) | 实现后启动独立对抗性验证 |
| **Bridge 故障注入** | `/bridge-kick` 测试命令 |
| **Tmux Pill** | tmux 状态栏集成 |
| **问题报告横幅** | Issue Flag Banner |
| **慢同步警告** | DevBar 慢同步警告 |
| **`/good-claude`** | 好的 Claude 行为反馈 |
| **`/stuck`** | 冻结/卡住/缓慢会话诊断 |
| **`/lorem-ipsum`** | 长上下文测试填充文本生成 |
| **`/heapdump`** | 内存堆转储（调试工具） |

---

## 五、Stub 命令（预留但未实现）

以下命令注册为 `isEnabled: () => false, isHidden: true`，代码骨架已存在但功能未实现：

| 命令 | 推测用途 | 优先级推测 |
|------|---------|-----------|
| `/teleport` | 远程传送（会话迁移） | 🔴 高 |
| `/share` | 会话分享 | 🔴 高 |
| `/bughunter` | Bug 捕获（自动代码审查） | 🟡 中 |
| `/autofix-pr` | 自动修复 PR | 🟡 中 |
| `/summary` | 会话摘要 | 🟡 中 |
| `/onboarding` | 新手引导 | 🟡 中 |
| `/ctx_viz` | 上下文可视化 | 🟡 中 |
| `/env` | 环境管理 | 🟢 低 |
| `/debug-tool-call` | 调试工具调用 | 🟢 低 |
| `/oauth-refresh` | OAuth 令牌刷新 | 🟢 低 |
| `/perf-issue` | 性能问题报告 | 🟢 低 |
| `/ant-trace` | 内部追踪 | 🟢 低（Ant-only） |
| `/reset-limits` | 重置使用限制 | 🟢 低（Ant-only） |
| `/mock-limits` | 模拟使用限制 | 🟢 低（Ant-only） |
| `/issue` | 问题报告 | 🟢 低 |
| `/backfill-sessions` | 回填会话数据 | 🟢 低（Ant-only） |
| `/break-cache` | 缓存破坏 | 🟢 低（调试） |
| `/good-claude` | 好的行为反馈 | 🟢 低（Ant-only） |

---

## 六、API Beta Header（API 层面实验性功能）

| Beta Header | 功能 | 状态 |
|-------------|------|------|
| `context-1m-2025-08-07` | 1M 上下文窗口 | ✅ 已发布 |
| `interleaved-thinking-2025-05-14` | 交错思考 | ✅ 已发布 |
| `structured-outputs-2025-12-15` | 结构化输出 | ✅ 已发布 |
| `web-search-2025-03-05` | Web 搜索 | ✅ 已发布 |
| `effort-2025-11-24` | Effort 级别控制 | ✅ 已发布 |
| `prompt-caching-scope-2026-01-05` | 提示缓存范围 | ✅ 已发布 |
| `fast-mode-2026-02-01` | 快速模式 | 🟡 灰度中 |
| `redact-thinking-2026-02-12` | 思考内容编辑 | 🟡 灰度中 |
| `token-efficient-tools-2026-03-28` | Token 高效工具 | 🟡 灰度中 |
| `task-budgets-2026-03-13` | 任务预算 | 🔴 EAP 专属 |
| `advanced-tool-use-2025-11-20` | 高级工具使用 | 🔴 1P/Foundry |
| `tool-search-tool-2025-10-19` | 工具搜索 | 🔴 Vertex/Bedrock |
| `context-management-2025-06-27` | 上下文管理 | 🟡 灰度中 |
| `afk-mode-2026-01-31` | AFK 模式 | 🟡 灰度中 |
| `advisor-tool-2026-03-01` | Advisor 工具 | 🟡 灰度中 |
| `summarize-connector-text-2026-03-13` | 连接器文本摘要 | 🔴 POC |
| `ccr-byoc-2025-07-29` | CCR BYOC | 🔴 内部 |
| `cli-internal-2026-02-09` | CLI 内部 | 🔴 Ant-only |
| `oauth-2025-04-20` | OAuth 认证 | ✅ 已发布 |

---

## 七、尚未实现的功能（TODO/Not Yet Implemented）

| 位置 | 功能 | 说明 |
|------|------|------|
| `filePersistence.ts:244` | 云模式文件持久化 | xattr-based file ID 读取正在开发中 |
| `marketplaceManager.ts:1414` | NPM 插件市场源 | `NPM: (Not yet implemented)` |
| `LSPServerInstance.ts:97,102` | LSP 高级配置 | `restartOnCrash` 和 `shutdownTimeout` |
| `ScrollKeybindingHandler.tsx:568` | `/` 搜索和 n/N 导航 | `TODO(search)` |
| `initReplBridge.ts:408` | 环境耦合功能 | Bridge 环境耦合 |
| `parseMarketplaceInput.ts:158` | NPM 包解析 | 尚未实现 |
| `codeSessionApi.ts:40` | Bridge 特定选项 | `placeholder for future` |
| `channelPermissions.ts:175` | MCP 频道权限扩展 | `future fourth condition` |

---

## 八、关键发现与趋势分析

### 8.1 正在积极开发的方向

根据代码活跃度和标记密度，Claude Code 当前最活跃的开发方向：

1. **🤖 多代理系统** — KAIROS + COORDINATOR_MODE + AGENT_TEAMS + SWARM，这是最大的投资方向
2. **🔄 远程控制** — BRIDGE_MODE + DIRECT_CONNECT + SSH_REMOTE + CCR_MIRROR，完整的远程协作体系
3. **🧠 记忆系统** — EXTRACT_MEMORIES + SESSION_MEMORY + MEMORY.md + TEAM_MEMORY_SYNC
4. **⏰ 自动化** — AGENT_TRIGGERS + PROACTIVE + BG_SESSIONS + DAEMON，自主执行能力
5. **🔒 安全增强** — BASH_CLASSIFIER + DESTRUCTIVE_COMMAND_WARNING + ANTI_DISTILL + VERIFICATION_AGENT
6. **💰 成本优化** — TOKEN_EFFICIENT_TOOLS + PROMPT_CACHE_SCOPE + CACHED_MICROCOMPACT + CONTEXT_COLLAPSE

### 8.2 即将公开发布的功能（按可能性排序）

| 功能 | 证据 | 预计时间 |
|------|------|---------|
| 定时任务（Cron/Loop） | 代码完整，GrowthBook gate 默认开启 | 已在灰度 |
| 会话分享（/share） | Stub 命令已注册 | 近期 |
| 远程传送（/teleport） | Stub 命令已注册 | 近期 |
| 上下文可视化（/ctx_viz） | Stub 命令已注册 | 近期 |
| SSH 远程执行 | 完整子系统已实现 | 近期 |
| 会话服务器（claude server） | 完整子系统已实现 | 中期 |
| 语音模式 | 完整 UI 子系统已实现 | 中期 |
| 内置浏览器面板 | 完整工具已实现 | 中期 |
| 模板系统 | Feature flag 已预留 | 中期 |
| 协调器模式 | 完整子系统已实现 | 中期 |
| NPM 插件市场 | 代码骨架存在 | 远期 |
| 云模式文件持久化 | 正在开发中 | 远期 |

### 8.3 反蒸馏与安全措施

Claude Code 包含多层反蒸馏保护：
- `tengu_anti_distill_fake_tool_injection` — 假工具注入
- `tengu_hive_evidence` — 验证代理
- `summarize-connector-text` — 连接器文本摘要（POC）
- `CACHE_EDITING_BETA_HEADER` — Ant-only 缓存编辑
- `cli-internal-2026-02-09` — CLI 内部 API

---

## 九、对织梦笔的借鉴建议

### 9.1 功能门控体系

Claude Code 的四层门控体系值得织梦笔借鉴：
```
L1: 编译时 DCE（feature()）→ 完全移除未发布功能
L2: 运行时 Feature Gate（GrowthBook）→ 灰度发布
L3: 环境变量开关 → 用户/运维控制
L4: API Beta Header → API 层面实验
```

织梦笔可以采用类似的三层体系：
- **L1**: VS Code Extension 的 `package.json` activationEvents 控制功能加载
- **L2**: 远程配置服务（如 Firebase Remote Config）控制灰度
- **L3**: 用户设置 + 环境变量

### 9.2 多代理系统架构

Claude Code 正在大力投资多代理系统（KAIROS + COORDINATOR + SWARM），织梦笔的"多 AI 模型协作"功能可以借鉴：
- **协调器模式**：一个"主编排 AI"协调多个"专家 AI"（角色专家、情节专家、风格专家等）
- **频道通信**：AI 之间通过频道交换信息
- **定时任务**：AI 可以在后台持续工作（如自动检查一致性）

### 9.3 记忆系统

Claude Code 的多层记忆系统非常适合小说写作场景：
- **MEMORY.md**（自动记忆）→ 自动提取的角色/情节/设定变化
- **CLAUDE.md**（项目指令）→ NOVEL.md 写作指南
- **会话记忆**（Session Memory）→ 跨会话保持写作上下文
- **团队记忆**（Team Memory）→ 多人协作时的共享记忆

### 9.4 上下文管理

长篇小说的上下文管理比代码更复杂，Claude Code 的四级压缩策略可以定制为：
- **微压缩**：自动清除旧章节的工具结果
- **自动压缩**：超过阈值时生成章节摘要
- **响应式压缩**：上下文溢出时紧急压缩
- **历史裁剪**：直接移除最早章节
