# vscode-extension Code Wiki

## 目录概述

StoryTree VS Code 扩展是一个 AI 驱动的小说写作环境，集成在 VS Code 中。同时也包含 Caiode 核心功能的 VS Code 集成。

### 主要功能
- 项目管理
- 章节组织
- AI 辅助写作
- 多模型支持 (OpenAI, Anthropic, Ollama)
- Caiode 队列监控
- 安全的密钥管理
- 加密数据库
- 文件沙箱

---

## 项目结构

```
vscode-extension/
├── src/
│   ├── __tests__/           # 测试
│   ├── automation/          # 自动化系统
│   ├── core/                # 核心逻辑
│   │   ├── ai/              # AI 集成
│   │   ├── cloud-gateway.ts # 云网关
│   │   ├── command-palette.ts # 命令面板
│   │   ├── config-service.ts # 配置服务
│   │   ├── data-encryption.ts # 数据加密
│   │   ├── db-adapter.ts    # 数据库适配器
│   │   ├── encrypted-db.ts # 加密数据库
│   │   ├── event-bus.ts    # 事件总线
│   │   ├── external-file-sync.ts # 文件同步
│   │   ├── file-mutex.ts    # 文件互斥锁
│   │   ├── file-sandbox.ts # 文件沙箱
│   │   ├── global-model-request-queue.ts # 全局队列
│   │   ├── message-router.ts # 消息路由
│   │   ├── mock-store.ts    # Mock 存储
│   │   ├── obfuscator.ts    # 混淆器
│   │   ├── process-guardian.ts # 进程守护
│   │   ├── queue-monitor.ts # 队列监控
│   │   ├── repository.ts    # 仓库
│   │   ├── rpc-adapter.ts   # RPC 适配器
│   │   ├── secret-manager.ts # 密钥管理
│   │   ├── sqlite-db.ts     # SQLite 数据库
│   │   ├── status-bar-manager.ts # 状态栏
│   │   ├── sync-push-service.ts # 同步推送
│   │   └── tree-view-provider.ts # 树视图
│   ├── rules/               # 规则引擎
│   ├── skills/              # Skill 系统
│   ├── types/               # 类型定义
│   ├── webview/             # Webview UI
│   └── extension.ts         # 扩展入口
├── dist/                    # 编译输出
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── esbuild.config.mjs
```

---

## 核心模块详解

### 1. extension.ts (扩展入口)

**职责**:
- 激活/停用扩展
- 注册命令
- 初始化核心服务
- 设置状态栏
- 注册树视图

**激活事件**: `*` (所有场景)

---

### 2. src/core/ai/ (AI 集成)

**文件**:
- `anthropic-provider.ts`: Anthropic Claude 提供商
- `openai-provider.ts`: OpenAI GPT 提供商
- `ollama-provider.ts`: Ollama 本地模型提供商
- `provider-factory.ts`: 提供商工厂
- `conversation-manager.ts`: 对话管理器
- `stream-processor.ts`: 流式处理器
- `prompt-template.ts`: 提示词模板
- `types.ts`: 类型定义

**架构**:
```typescript
interface AIProvider {
  generateCompletion(prompt: string): Promise<string>
  streamCompletion(prompt: string): AsyncGenerator<string>
}

class ProviderFactory {
  static getProvider(type: "openai" | "anthropic" | "ollama"): AIProvider
}
```

---

### 3. src/core/global-model-request-queue.ts (全局模型请求队列)

**功能**:
- 串行化所有 LLM 请求
- 防止并发请求冲突
- 请求超时管理
- 队列监控
- 重试机制

**核心类**:
```typescript
class GlobalModelRequestQueue {
  enqueue(request: ModelRequest): Promise<ModelResponse>
  getQueueStatus(): QueueStatus
  cancelAll(): void
}
```

**配置**:
- `caiode.queue.timeout`: 超时时间 (默认 30000ms)

---

### 4. src/core/file-mutex.ts (文件互斥锁)

**功能**:
- 跨进程文件锁
- 防止并发写入冲突
- 死锁检测
- 陈旧锁清理

**核心类**:
```typescript
class FileMutex {
  acquire(filePath: string): Promise<LockHandle>
  release(handle: LockHandle): Promise<void>
  isLocked(filePath: string): boolean
  cleanupStaleLocks(): Promise<void>
}
```

**配置**:
- `caiode.lock.staleLockTimeout`: 陈旧锁超时 (默认 10000ms)

**库**: `proper-lockfile`

---

### 5. src/core/process-guardian.ts (进程守护)

**功能**:
- 监控子进程健康状态
- 心跳检测
- 自动重启崩溃进程
- 进程生命周期管理

**核心类**:
```typescript
class ProcessGuardian {
  registerProcess(process: ChildProcess, options: GuardianOptions): ProcessHandle
  monitor(processId: string): void
  unmonitor(processId: string): void
  restart(processId: string): Promise<ChildProcess>
}
```

**配置**:
- `caiode.heartbeat.interval`: 心跳间隔 (默认 5000ms)
- `caiode.heartbeat.maxMisses`: 最大错过次数 (默认 3)

---

### 6. src/core/encrypted-db.ts (加密数据库)

**功能**:
- SQLite 数据库加密
- 敏感数据保护
- 密钥管理集成

**核心类**:
```typescript
class EncryptedDatabase {
  constructor(dbPath: string, encryptionKey: Buffer)
  query<T>(sql: string, params?: any[]): Promise<T[]>
  execute(sql: string, params?: any[]): Promise<void>
}
```

---

### 7. src/core/secret-manager.ts (密钥管理)

**功能**:
- 安全存储 API 密钥
- VS Code SecretStorage 集成
- 密钥加密/解密

**核心类**:
```typescript
class SecretManager {
  static getSecret(context: ExtensionContext, key: string): Promise<string | undefined>
  static storeSecret(context: ExtensionContext, key: string, value: string): Promise<void>
  static deleteSecret(context: ExtensionContext, key: string): Promise<void>
}
```

---

### 8. src/core/file-sandbox.ts (文件沙箱)

**功能**:
- 限制文件访问范围
- 防止越权操作
- 文件操作审计

**核心类**:
```typescript
class FileSandbox {
  constructor(rootPath: string, allowedPatterns: string[])
  canAccess(filePath: string): boolean
  readFile(filePath: string): Promise<Buffer>
  writeFile(filePath: string, content: Buffer): Promise<void>
}
```

---

### 9. src/core/queue-monitor.ts (队列监控)

**功能**:
- 实时显示队列状态
- 可视化请求处理
- 性能指标统计
- 输出面板集成

**功能**:
- 命令: `storytree.showQueueMonitor`
- 显示: 请求队列、等待时间、处理状态

---

### 10. src/webview/ (Webview UI)

**文件**:
- `ai-chat-panel.ts`: AI 聊天面板
- `enhanced-dashboard.ts`: 增强仪表板
- `settings-page.ts`: 设置页面
- `workbench-page.ts`: 工作台页面
- `panel-manager.ts`: 面板管理器
- `html-generator.ts`: HTML 生成器

**架构**:
- 使用 VS Code Webview API
- 与扩展通过 Message Router 通信
- 响应式 UI

---

### 11. src/automation/ (自动化系统)

**文件**:
- `orchestrator/task-orchestrator.ts`: 任务编排
- `queue/automation-queue.ts`: 自动化队列
- `drivers/cdp-driver.ts`: CDP 驱动
- `adapters/adapter-loader.ts`: 适配器加载
- `adapters/cdp-based-adapter.ts`: CDP 适配器
- `types.ts`: 类型定义

**功能**:
- 自动化工作流
- CDP (Chrome DevTools Protocol) 集成
- 任务队列管理

---

### 12. src/rules/ (规则引擎)

**文件**:
- `rule-engine.ts`: 规则引擎
- `index.ts`: 规则注册
- `types.ts`: 类型定义

**功能**:
- 条件规则执行
- 工作流自动化
- 事件响应

---

### 13. src/skills/ (Skill 系统)

**文件**:
- `skill-registry.ts`: Skill 注册表
- `index.ts`: Skill 索引
- `types.ts`: 类型定义

**功能**:
- 动态加载 Skills
- Skill 执行
- Skill 生命周期管理

---

## 核心架构

### IPC 协议 (src/types/ipc-protocol.ts)

**消息类型**:
```typescript
enum MessageType {
  REQUEST = "request",
  RESPONSE = "response",
  EVENT = "event",
  STREAM = "stream"
}

interface IPCMessage {
  id: string
  type: MessageType
  payload: any
}
```

---

### 消息路由 (src/core/message-router.ts)

**功能**:
- 路由 IPC 消息
- 请求/响应匹配
- 事件分发
- 流式处理

**核心类**:
```typescript
class MessageRouter {
  sendRequest<T>(type: string, payload: any): Promise<T>
  sendEvent(type: string, payload: any): void
  registerHandler(type: string, handler: Handler): void
}
```

---

### 事件总线 (src/core/event-bus.ts)

**功能**:
- 发布/订阅模式
- 类型安全的事件
- 事件历史记录

**核心类**:
```typescript
class EventBus {
  emit<T>(event: string, payload: T): void
  on<T>(event: string, handler: (payload: T) => void): Disposable
  once<T>(event: string, handler: (payload: T) => void): Disposable
}
```

---

## 命令系统

**注册的命令**:
```json
{
  "storytree.openDashboard": "打开 StoryTree 仪表板",
  "storytree.newProject": "创建新项目",
  "storytree.newChapter": "创建新章节",
  "storytree.toggleAIChat": "切换 AI 聊天面板",
  "storytree.showSettings": "打开设置",
  "storytree.wordCount": "显示字数统计",
  "storytree.showQueueMonitor": "显示 Caiode 队列监控"
}
```

**快捷键**:
- `Cmd+Shift+T`: 打开仪表板
- `Cmd+Shift+N`: 新建项目
- `Cmd+Shift+C`: 新建章节
- `Cmd+Shift+I`: 切换 AI 聊天
- `Cmd+Shift+,`: 打开设置

---

## 配置选项

**StoryTree 配置**:
```json
{
  "storytree.ai.provider": "openai | anthropic | ollama | custom",
  "storytree.ai.openai.apiKey": "OpenAI API 密钥",
  "storytree.ai.anthropic.apiKey": "Anthropic API 密钥",
  "storytree.ai.ollama.baseUrl": "Ollama 服务器地址",
  "storytree.editor.autoSaveMs": "自动保存间隔 (毫秒)"
}
```

**Caiode 配置**:
```json
{
  "caiode.queue.timeout": 30000,
  "caiode.lock.staleLockTimeout": 10000,
  "caiode.heartbeat.interval": 5000,
  "caiode.heartbeat.maxMisses": 3
}
```

---

## 测试

**测试框架**: Vitest

**运行测试**:
```bash
# 运行测试
npm run test

# 监听模式
npm run test:watch

# 覆盖率
npm run test:coverage
```

**测试文件**:
- `ipc-protocol.test.ts`: IPC 协议测试
- `message-router.test.ts`: 消息路由测试
- `global-model-request-queue.test.ts`: 队列测试
- `file-mutex.test.ts`: 文件锁测试
- `conversation-manager.test.ts`: 对话管理测试
- 等等...

---

## 构建

**构建工具**: esbuild

**构建命令**:
```bash
# 开发构建
npm run build:dev

# 生产构建
npm run build:prod

# 监听模式
npm run watch
```

**打包扩展**:
```bash
npm run package
```

---

## 开发指南

### 设置开发环境

```bash
# 1. 安装依赖
npm install

# 2. 编译
npm run build:dev

# 3. 在 VS Code 中按 F5 启动扩展开发主机
```

### 添加新命令

1. 在 `package.json` 的 `contributes.commands` 注册
2. 在 `extension.ts` 的 `activate` 中注册命令处理器
3. 实现命令逻辑

```typescript
// 示例
context.subscriptions.push(
  vscode.commands.registerCommand("storytree.myCommand", async () => {
    // 命令逻辑
  })
)
```

### 添加新的 AI Provider

1. 在 `src/core/ai/` 创建新 provider
2. 实现 `AIProvider` 接口
3. 在 `provider-factory.ts` 注册

### 添加新 Webview

1. 在 `src/webview/` 创建新组件
2. 在 `panel-manager.ts` 注册
3. 通过 `MessageRouter` 通信

---

## 贡献流程

1. Fork 项目
2. 创建特性分支
3. 实现功能
4. 添加测试
5. 运行 lint 和测试
6. 提交 PR

---

## 相关文档

- 项目根目录 `README.md`
- 测试计划 `test-plan.md`
- 架构设计 `architecture.md`

---

*文档生成时间: 2026-05-02*
