# Ralph 任务清单 (vscode-oss-integration-hybrid)

> **执行铁律**: 必须严格按照以下列表的物理顺序执行任务。**严禁跳跃**或乱序执行。

## Phase 1.1: 制定前后端通信协议 (IPC Protocol Design)
- [x] **T-POC-001**: 定义标准的 JSON-RPC 格式的通信协议
- [x] **T-POC-002**: 在 `dreamweaver` 中实现基于该协议的 RPC 适配器
- [x] **T-POC-003**: 在 `caiode` 扩展中实现对应的消息路由处理器

## Phase 1.2: 前端静态导出验证 (Next.js Static Export PoC)
- [x] **T-POC-004**: 配置 `output: 'export'` 并移除阻碍依赖
- [x] **T-POC-005**: 成功构建出纯静态产物 (`out/` 目录)

## Phase 1.3: 插件骨架与 Mock 层下沉 (Extension Skeleton & Mock Migration)
- [x] **T-POC-006**: 初始化 VS Code Extension 骨架与 Webview
- [x] **T-POC-007**: 迁移 Mock 逻辑至 Node.js 层
- [x] **T-POC-008**: 跑通双端 IPC 数据通信渲染

## Phase 1.4: 持续推进 DW 页面开发与测试 (Stitch UI Dev & Test)
- [x] **T-FE-001**: 恢复剩余的 Stitch 原页面开发
- [x] **T-FE-002**: 完善 Playwright 自动化 UI 测试和 VRT
- [x] **T-FE-003**: 确保所有新增页面的数据请求均通过 IPC 适配器

## Phase 1.5: 安全机制架构设计与验证 (Security & Isolation PoC)
- [x] **T-SEC-001**: 数据安全 (SecretStorage API Keys)
- [x] **T-SEC-002**: 文件隔离 (沙箱机制)
- [x] **T-SEC-003**: 反编译防护 (esbuild / PyArmor)
- [x] **T-SEC-004**: 本地库加密 (sqlcipher)

## Phase 1.6: SQLite 本地化替换 (Replace Mock with Local DB)
- [x] **T-DB-001**: 引入真实 SQLite 替换 Mock
- [x] **T-DB-002**: 实现 Prisma/SQL CRUD
- [x] **T-DB-003**: 联调前端业务与本地数据库

## Phase 1.7: 云端网关集成 (Cloud Gateway Integration)
- [x] **T-GW-001**: 接入用户登录与授权验证
- [x] **T-GW-002**: 接入续费支付、全局配置拉取
- [x] **T-GW-003**: 集成版本检查与日志上报
- [x] **T-GW-004**: 提供用户反馈入口

## Phase 2.1: AI/LLM 引擎集成 (AI Engine Integration)
- [x] **T-AI-001**: LLMProvider 接口抽象 + OpenAIProvider 实现 + 测试
- [x] **T-AI-002**: AnthropicProvider 实现 + 测试
- [x] **T-AI-003**: OllamaProvider 实现 + 测试
- [x] **T-AI-004**: LLMProviderFactory 工厂函数 + 测试
- [x] **T-AI-005**: StreamProcessor 流式处理器 + 测试
- [x] **T-AI-006**: ConversationManager 对话管理器 + 测试
- [x] **T-AI-007**: PromptTemplate 引擎 + 内置模板 + 测试

## Phase 2.2: 完整页面集与富交互 (Full Page Set & Rich Interactions)
- [x] **T-FE-004**: WorkbenchPage 编辑器/工作台页面 + 测试
- [x] **T-FE-005**: AIChatPanel AI 对话面板 + 测试 (内嵌于 WorkbenchPage)
- [x] **T-FE-006**: SettingsPage 设置与配置页面 + 测试
- [x] **T-FE-007**: DashboardPage 项目管理增强 + 测试

## Phase 2.3: VS Code 原生能力集成 (VS Code Native Features)
- [x] **T-VSC-001**: StoryTreeTreeViewProvider 侧边栏树视图 + 测试
- [x] **T-VSC-002**: StatusBarManager 状态栏管理 + 测试
- [x] **T-VSC-003**: CommandPalette 命令集注册 + 测试
- [x] **T-VSC-004**: ExternalFileSync 文件系统监听 + 测试

## Phase 2.4: 实时数据同步机制 (Real-time Data Sync)
- [x] **T-SYNC-001**: EventBus 事件总线 + 测试
- [x] **T-SYNC-002**: SyncPushService 推送服务 + 测试

## Phase 2.5: 构建与打包流水线 (Build & Package Pipeline)
- [x] **T-BUILD-001**: esbuild 生产构建配置完善 + 验证测试
- [x] **T-BUILD-002**: package.json VSIX 打包配置 + 验证测试

---

## 任务完成统计
- **总任务数**: 39
- **已完成**: 39
- **完成率**: 100%

## 核心交付物
1. **架构文档**: `ADR-001-Architecture-Finalization.md`
2. **任务清单**: `04-ralph-tasks.md` (本文件)
3. **测试计划**: `05-test-plan.md`
4. **VS Code 扩展**: `caiode/vscode-extension/`
5. **静态前端**: `dreamweaver/out/`
6. **集成测试**: `tests/`
