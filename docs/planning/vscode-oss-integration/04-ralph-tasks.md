# 混合渐进式迁移策略 任务清单 (Phase 1-2)

> 基于 ADR-001 (架构) 和 ADR-002 (网关、安全、Mock 下沉) 的决策，更新后的渐进式开发任务清单。

## [Phase 1.1] 制定前后端通信协议 (IPC Protocol Design)
- [x] **T-POC-001**: 定义标准的 JSON-RPC 格式的通信协议（如 `id`, `action`, `payload`, `status`），作为 Webview 与 VS Code 插件间的唯一通信契约。
- [ ] **T-POC-002**: 在 `dreamweaver` 中实现基于该协议的 RPC 适配器 (Adapter)，取代现有的 `fetch/axios` 拦截。
- [ ] **T-POC-003**: 在 `caiode` 扩展中实现对应的消息路由处理器 (Message Router)，解析并分发该格式的消息。

## [Phase 1.2] 前端静态导出验证 (Next.js Static Export PoC)
- [ ] **T-POC-004**: 在 `dreamweaver/next.config.ts` 中配置 `output: 'export'`，移除所有阻碍静态导出的代码 (如 `next-intl` 的动态路由)。
- [ ] **T-POC-005**: 成功构建出纯静态产物 (`out/` 目录)。

## [Phase 1.3] 插件骨架与 Mock 层下沉 (Extension Skeleton & Mock Migration)
- [ ] **T-POC-006**: 初始化极简的 VS Code Extension 骨架，创建 Webview Panel，将 `dreamweaver` 静态产物加载至容器中。
- [ ] **T-POC-007**: 将原 `dreamweaver` 中的 Mock 逻辑 (如 MSW 定义的假数据) 迁移到 `caiode` 扩展的 Node.js 层。
- [ ] **T-POC-008**: 跑通双端通信：Webview 发起获取小说大纲的 IPC 请求 -> VS Code 扩展返回 Mock 数据 -> 前端成功渲染。

## [Phase 1.4] 持续推进 DW 页面开发与测试 (Stitch UI Dev & Test)
> 在完成 Phase 1.3 的 Mock 通信层后，前端团队可以在真实的 VS Code Webview 环境（或浏览器模拟环境）中继续迭代。
- [ ] **T-FE-001**: 恢复剩余的 Stitch 原页面开发（如知识库、角色设定、设置页等）。
- [ ] **T-FE-002**: 继续完善 Playwright 自动化 UI 测试和 VRT (Visual Regression Testing)。
- [ ] **T-FE-003**: 确保所有新增页面的数据请求均通过 Phase 1.1 的 IPC 适配器。

## [Phase 1.5] 安全机制架构设计与验证 (Security & Isolation PoC)
- [ ] **T-SEC-001**: **数据安全**：验证在 VS Code 插件中，通过 `SecretStorage` 读写 OpenAI API Keys 的流程，取代明文配置。
- [ ] **T-SEC-002**: **文件隔离**：实现插件级的文件沙箱机制 (File Sandbox)，限制 Python Agent 或 Node 逻辑只能在当前工作区 (`Workspace`) 的指定 `.storytree` 目录下读写。
- [ ] **T-SEC-003**: **反编译防护**：配置 `esbuild` 或 `webpack` 对 VS Code 扩展产物进行深度混淆；验证 Python 脚本的 `PyArmor` 编译流程。
- [ ] **T-SEC-004**: **本地库加密**：验证 `sqlcipher` 或类似加密数据库驱动在 Electron 宿主下的可用性，保护用户小说数据不被外部工具窥探。

## [Phase 1.6] SQLite 本地化替换 (Replace Mock with Local DB)
> 在所有前端页面开发完成，且安全策略落地的基础上，最后执行此步骤。
- [ ] **T-DB-001**: 在 `caiode` 中引入真实的 SQLite (`better-sqlite3` 或类似兼容库)，替换掉 Phase 1.3 中的 Mock 数据路由。
- [ ] **T-DB-002**: 实现完整的 Prisma/SQL CRUD 逻辑。
- [ ] **T-DB-003**: 联调前端业务与本地真实数据库。

## [Phase 1.7] 云端网关集成 (Cloud Gateway Integration)
- [ ] **T-GW-001**: 在 `caiode` 扩展启动时，接入用户登录与云端授权 (License) 验证。
- [ ] **T-GW-002**: 接入续费支付、全局配置拉取。
- [ ] **T-GW-003**: 集成版本检查 (OTA Update) 和错误日志上报机制。
- [ ] **T-GW-004**: 提供用户反馈入口 (Feedback Panel)，对接至云端系统。