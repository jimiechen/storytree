# CDP 自动化系统

## 概述

CDP 自动化系统是一个基于 Chrome DevTools Protocol (CDP) 的 IDE 聊天框自动化驱动系统。它采用四层分离设计，用于处理 IDE 升级和多 IDE 适配，确保自动化操作的稳定性和可扩展性。

## 架构设计

### 四层分离设计

```
任务队列层（TaskQueue）
        ↓
调度编排层（Orchestrator）
        ↓
IDE 适配层（IDEAdapter）
        ↓
CDP 驱动层（CDPDriver）
```

### 核心组件

1. **CDP 驱动层**
   - 封装 CDP 协议的底层操作
   - 提供语义化的 IDE 操作原语
   - 实现聊天输入、消息提交、响应等待等核心功能

2. **IDE 适配层**
   - 通过配置文件解耦 CDP 操作与具体 IDE 的 DOM 结构
   - 支持热重载配置，应对 IDE 升级
   - 提供健康检查机制，检测选择器有效性

3. **调度编排层**
   - 将 Agent 任务翻译成 IDE 操作序列
   - 处理异常恢复和重试逻辑
   - 生成任务报告，触发 [READY_FOR_REVIEW] 标记

4. **任务队列层**
   - 保证任务串行执行，避免并发冲突
   - 支持优先级和超时取消
   - 管理任务生命周期

## 配置系统

### IDE 适配器配置

配置文件路径：`.caiode/adapters/{ide_type}.adapter.json`

示例配置（trae.adapter.json）：

```json
{
  "id": "trae",
  "name": "Trae IDE",
  "version": ">=1.0.0",
  "debugPort": 9222,
  
  "selectors": {
    "chatInput": ".chat-input-textarea",
    "submitButton": "[data-testid='send-button']",
    "responseContainer": ".message-list .assistant-message:last-child",
    "streamingIndicator": "[data-streaming='true']",
    "stopButton": ".stop-generation-btn",
    "newChatButton": ".new-chat-btn",
    "taskListItem": ".task-list-item",
    "taskTitle": ".task-title"
  },
  
  "waitStrategies": {
    "responseComplete": {
      "type": "elementDisappear",
      "selector": ".stop-generation-btn",
      "pollInterval": 500,
      "timeout": 300000
    },
    "inputReady": {
      "type": "elementEnabled", 
      "selector": ".chat-input-textarea",
      "pollInterval": 200,
      "timeout": 10000
    }
  },
  
  "submitMethod": "button",
  
  "inputMethod": {
    "type": "domProperty",
    "property": "value",
    "triggerEvents": ["input", "change"]
  }
}
```

## 选择器探测

为了应对 IDE 升级导致的 DOM 结构变化，提供了 `selector-probe.ts` 脚本，用于自动探测 IDE 的实际 DOM 选择器。

使用方法：

```bash
cd /workspace/caiode && node scripts/selector-probe.ts
```

脚本会连接到 Trae 的 CDP 端口，自动探测聊天输入框、发送按钮、响应容器等元素的选择器，并更新适配器配置文件。

## 使用示例

```typescript
import { AutomationSystem } from './automation';

// 创建 CDP 客户端（需要根据实际情况实现）
const cdpClient = {
  send: async (method: string, params?: any) => {
    // 实现 CDP 通信逻辑
  }
};

// 初始化自动化系统
const automationSystem = new AutomationSystem(cdpClient, '.caiode/adapters');
await automationSystem.initialize();

// 提交任务
const task = {
  id: 'task-1',
  sandboxId: 'sandbox-1',
  prompt: 'Write a hello world program in TypeScript',
  maxRetries: 3,
  timeoutMs: 300000,
  onComplete: (result) => {
    console.log('Task completed:', result);
  },
  onError: (error) => {
    console.error('Task failed:', error);
  }
};

automationSystem.enqueueTask(task);
```

## 目录结构

```
automation/
├── index.ts              # 自动化系统入口
├── types.ts              # 核心类型定义
├── drivers/              # CDP 驱动层
│   └── cdp-driver.ts     # CDP 驱动实现
├── adapters/             # IDE 适配层
│   ├── cdp-based-adapter.ts  # CDP 基础适配器
│   └── adapter-loader.ts      # 适配器加载器
├── orchestrator/         # 调度编排层
│   └── task-orchestrator.ts   # 任务编排器
└── queue/                # 任务队列层
    └── automation-queue.ts    # 自动化队列
```

## 核心功能

1. **IDE 操作自动化**：通过 CDP 协议实现对 IDE 聊天框的自动化操作
2. **配置化适配**：通过 JSON 配置文件适配不同 IDE 和版本
3. **任务串行执行**：通过队列系统保证任务的顺序执行
4. **健康检查**：自动检测选择器有效性，及时发现 IDE 升级导致的问题
5. **任务报告**：自动生成任务执行报告，触发 [READY_FOR_REVIEW] 标记

## 技术特点

- **四层分离架构**：职责单一，易于维护和扩展
- **配置化设计**：应对 IDE 升级，无需修改代码
- **健壮性**：支持异常处理和重试机制
- **可扩展性**：支持多 IDE 适配
- **可审计性**：完整的任务报告和日志

## 未来规划

1. 支持更多 IDE（Cursor、Windsurf 等）
2. 实现更复杂的 IDE 操作原语
3. 集成到 VS Code 扩展的命令系统
4. 提供图形化配置界面
5. 支持更多高级自动化场景
