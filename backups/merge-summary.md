此次合并主要添加了核心初始化和管理功能，包括模仿 Claude 的初始化流程、目标管理系统、状态管理和配置管理工具，为系统提供了完整的启动和管理能力。同时还添加了大量文档和 VS Code 扩展相关文件，增强了系统的可扩展性和可维护性。
| 文件 | 变更 |
|------|---------|
| src/entrypoints/init.ts | - 实现了完整的初始化函数，模仿 Claude 的初始化流程<br>- 集成了配置系统、环境变量、网络设置等初始化步骤<br>- 添加了 Phase 1 计划的初始化流程，包括预检检查、设置加载和权限初始化 |
| src/utils/goalManagement.js | - 实现了目标管理工具，支持设置初始目标<br>- 提供了智能目标拆解功能，根据目标关键词自动生成任务列表<br>- 支持 Phase 1 计划的任务拆解 |
| src/bootstrap/state.js | - 实现了基础状态管理，模仿 Claude 的状态管理结构<br>- 提供了会话状态、客户端类型、会话源等状态管理功能<br>- 集成了会话计数器和遥测仪表 |
| src/utils/config.js | - 实现了配置管理工具，支持启用配置系统<br>- 提供了全局配置管理和首次启动时间记录功能<br>- 包含信任对话框和自动更新检查功能 |
| src/utils/apiPreconnect.js | - 实现了 API 预连接功能，优化网络请求性能 |
| src/utils/caCertsConfig.js | - 实现了 CA 证书配置功能，支持从配置中应用额外的 CA 证书 |
| src/utils/cleanupRegistry.js | - 实现了清理注册表功能，用于管理系统资源 |
| src/utils/debug.js | - 实现了调试日志功能，支持不同级别的日志输出 |
| src/utils/detectRepository.js | - 实现了仓库检测功能，自动检测当前 GitHub 仓库 |
| src/utils/diagLogs.js | - 实现了诊断日志功能，用于系统诊断和问题排查 |
| src/utils/envDynamic.js | - 实现了动态环境检测功能，支持 JetBrains IDE 检测 |
| src/utils/envUtils.js | - 实现了环境工具函数，提供环境变量相关操作 |
| src/utils/errors.js | - 实现了错误处理功能，提供错误消息格式化 |
| src/utils/gracefulShutdown.js | - 实现了优雅关闭功能，确保系统安全退出 |
| src/utils/managedEnv.js | - 实现了环境管理功能，支持配置环境变量 |
| src/utils/mtls.js | - 实现了 mTLS 配置功能，增强网络安全性 |
| src/utils/proxy.js | - 实现了代理配置功能，支持全局 HTTP 代理设置 |
| src/utils/startupProfiler.js | - 实现了启动性能分析功能，优化系统启动速度 |
| src/utils/telemetryAttributes.js | - 实现了遥测属性功能，支持系统监控 |
| src/utils/windowsPaths.js | - 实现了 Windows 路径处理功能，支持 git-bash 设置 |
| test-goal-management.js | - 添加了目标管理测试文件，验证目标管理功能 |
| docs/CODE_WIKI.md | - 添加了代码 wiki 文档，提供系统使用指南 |
| docs/analysis-summary.md | - 添加了分析摘要文档，总结系统分析结果 |
| docs/claude-code-harness-integration.md | - 添加了 Claude 代码集成文档，指导集成流程 |
| docs/claude-code-migration-learning-guide.md | - 添加了 Claude 代码迁移学习指南，帮助迁移工作 |
| docs/github-ssh-setup.md | - 添加了 GitHub SSH 设置文档，指导 SSH 配置 |
| docs/planning/Phase1-Implementation-Plan.md | - 添加了 Phase 1 实施计划文档，详细说明实施步骤 |