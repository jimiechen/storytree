toolName: Skill

status: success

我需要先了解项目的当前状态，然后制定实施计划。让我先检查现有的代码结构和实施情况。

toolName: todo\_write

status: success

Todos updated: 4 items

toolName: view\_folder

status: success

/Users/mac/StudioProjects/storytree2/caiode

toolName: view\_folder

status: success

/Users/mac/StudioProjects/storytree2/caiode/vscode-extension/src

toolName: view\_folder

status: success

/Users/mac/StudioProjects/storytree2/caiode/vscode-extension/src/core

toolName: file\_search

status: success

file\_pattern: **/caiode/vscode-extension/src/**/\*.ts

toolName: search\_by\_regex

status: success

query: ProcessGuardian|GlobalModelRequestQueue|FileMutex

toolName: search\_by\_regex

status: success

query: 子进程|进程守护|队列|queue

根据我的分析，当前项目有以下未完成的核心任务：

| 任务编号      | 任务名称                | 状态    |
| --------- | ------------------- | ----- |
| DEV-1.1.2 | 子进程守护与崩溃恢复机制        | ❌ 未完成 |
| DEV-1.2.1 | 全局 LLM 请求队列调度器      | ❌ 未完成 |
| DEV-1.2.2 | 队列监控 Output Channel | ❌ 未完成 |
| DEV-1.3.1 | OS 级文件锁 PoC         | ❌ 未完成 |
| DEV-1.3.2 | 跨进程 Mutex           | ❌ 未完成 |
| DEV-1.4.1 | 插件配置页面              | ❌ 未完成 |
| DEV-1.4.2 | .vsix 打包            | ❌ 未完成 |

根据你的 custom\_user\_instruction，我将接手设计并实现以下核心模块：

1. **GlobalModelRequestQueue** - 串行化 LLM 请求队列
2. **FileMutex** - 基于 proper-lockfile 的跨进程文件锁
3. **ProcessGuardian** - 子进程心跳检测与崩溃恢复

让我先检查现有的 extension.ts 和 message-router.ts 来了解当前的架构：

toolName: view\_files

status: success

filePath: /Users/mac/StudioProjects/storytree2/caiode/vscode-extension/src/extension.ts

toolName: view\_files

status: success

filePath: /Users/mac/StudioProjects/storytree2/caiode/vscode-extension/src/types/ipc-protocol.ts

toolName: todo\_write

status: success

Todos updated: 5 items

根据规则，我需要先检查工作空间文件是否存在：

toolName: view\_folder

status: success

/Users/mac/StudioProjects/storytree2/workspaces

toolName: view\_files

status: success

filePath: /Users/mac/StudioProjects/storytree2/workspaces/glm51/helloglm51.md

工作空间文件已存在。现在我需要更新它，记录新的任务并开始制定实施计划。

toolName: Write

status: failed

filePath: undefined

toolName: todo\_write

status: success

Todos updated: 5 items

让我检查 Trae-Ralph 的 CDP 实现，以便设计核心模块：

toolName: view\_files

status: success

filePath: /Users/mac/StudioProjects/storytree2/caiode/Trae-Ralph-main/src/launcher.js

现在我已经了解了项目的当前状态。让我制定详细的实施计划：

***

# Caiode Phase 1 核心模块实施计划

**版本**: v1.0\
**日期**: 2026-04-09\
**制定人**: glm51\
**状态**: 待评审

***

## 一、当前状态分析

### 1.1 已完成工作

| 模块             | 状态   | 说明                   |
| -------------- | ---- | -------------------- |
| Extension 骨架   | ✅ 完成 | extension.ts, 生命周期管理 |
| Message Router | ✅ 完成 | 消息路由框架               |
| IPC Protocol   | ✅ 完成 | 协议定义                 |
| 单元测试           | ✅ 完成 | 26 个测试用例，覆盖率 90.91%  |
| CI 流水线         | ✅ 完成 | GitHub Actions 配置    |

### 1.2 未完成核心任务

| 任务 ID     | 任务名称                | 优先级 | 预估工时 |
| --------- | ------------------- | --- | ---- |
| DEV-1.1.2 | 子进程守护与崩溃恢复机制        | P0  | 8h   |
| DEV-1.2.1 | 全局 LLM 请求队列调度器      | P0  | 6h   |
| DEV-1.2.2 | 队列监控 Output Channel | P1  | 4h   |
| DEV-1.3.1 | OS 级文件锁 PoC         | P0  | 4h   |
| DEV-1.3.2 | 跨进程 Mutex 实现        | P0  | 6h   |
| DEV-1.4.1 | 插件配置页面              | P1  | 6h   |
| DEV-1.4.2 | .vsix 打包            | P1  | 2h   |

**剩余工时总计**: 36h（约 5 个工作日）

***

## 二、架构设计

### 2.1 核心模块架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                    Caiode VS Code Extension                      │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ ProcessGuardian │  │ GlobalModelReq  │  │   FileMutex     │ │
│  │  (子进程守护)    │  │   Queue         │  │  (跨进程文件锁)  │ │
│  │                 │  │  (LLM请求队列)   │  │                 │ │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘ │
│           │                      │                      │         │
│           └──────────────────────┼──────────────────────┘         │
│                                  │                                    │
│                    ┌─────────────┴─────────────┐                   │
│                    │      MessageRouter         │                   │
│                    │      (消息路由中心)         │                   │
│                    └─────────────┬─────────────┘                   │
│                                  │                                    │
│                    ┌─────────────┴─────────────┐                   │
│                    │      IPC Protocol          │                   │
│                    │      (协议层)              │                   │
│                    └───────────────────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Trae IDE (CDP 连接)                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ CDP Client  │  │ Task Fetcher│  │Agent Inject │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 模块职责定义

#### ProcessGuardian（子进程守护）

**职责**:

- 管理子进程的生命周期（启动、监控、崩溃恢复）
- 心跳检测机制（默认 5s 间隔）
- 非正常退出（VS Code 崩溃）场景覆盖
- 重试策略（最多 3 次，指数退避）

**核心接口**:

```typescript
interface ProcessGuardian {
  spawn(name: string, command: string, args: string[]): ChildProcess;
  monitor(pid: number): void;
  unmonitor(pid: number): void;
  getProcessStatus(pid: number): ProcessStatus;
  onCrash(callback: (info: CrashInfo) => void): void;
  restart(pid: number): Promise<boolean>;
}
```

#### GlobalModelRequestQueue（全局 LLM 请求队列）

**职责**:

- 串行化所有 LLM 请求
- 请求优先级管理
- 并发控制（最大并发数可配置）
- 请求取消和超时处理
- 队列状态监控

**核心接口**:

```typescript
interface GlobalModelRequestQueue {
  enqueue(request: LLMRequest): Promise<LLMResponse>;
  enqueuePriority(request: LLMRequest, priority: number): Promise<LLMResponse>;
  cancel(requestId: string): boolean;
  getQueueStatus(): QueueStatus;
  onStatusChange(callback: (status: QueueStatus) => void): void;
}
```

#### FileMutex（跨进程文件锁）

**职责**:

- 基于 proper-lockfile 的 OS 级文件锁
- 跨进程互斥（多 VS Code 窗口场景）
- stale lock 自动清理
- 锁超时配置

**核心接口**:

```typescript
interface FileMutex {
  acquire(lockId: string, options?: LockOptions): Promise<LockHandle>;
  release(handle: LockHandle): Promise<void>;
  isLocked(lockId: string): Promise<boolean>;
  withLock<T>(lockId: string, fn: () => Promise<T>): Promise<T>;
}
```

***

## 三、实施计划

### 3.1 开发顺序

```
Week 1 (Day 1-2):
  └─→ FileMutex（基础依赖，其他模块可能用到）

Week 1 (Day 3-4):
  └─→ ProcessGuardian（子进程管理）

Week 2 (Day 1-2):
  └─→ GlobalModelRequestQueue（LLM 请求管理）

Week 2 (Day 3):
  └─→ Queue Monitor Output Channel

Week 2 (Day 4-5):
  └─→ 集成测试和质量验证

Week 3 (Day 1-2):
  └─→ Settings UI 配置页面

Week 3 (Day 3):
  └─→ .vsix 打包
```

### 3.2 详细任务分解

#### Task F1: FileMutex 实现

| 项目        | 内容                                 |
| --------- | ---------------------------------- |
| **任务 ID** | DEV-1.3.2                          |
| **任务名称**  | 跨进程 Mutex 实现                       |
| **预估工时**  | 6h                                 |
| **依赖**    | proper-lockfile                    |
| **产物路径**  | `src/core/file-mutex.ts`           |
| **测试路径**  | `src/__tests__/file-mutex.test.ts` |

**实现步骤**:

1. 安装依赖 `proper-lockfile`
2. 定义 `FileMutex` 接口和类型
3. 实现 `acquire()` / `release()` 方法
4. 实现 `withLock()` 便捷方法
5. 实现 `isLocked()` 查询方法
6. 编写单元测试（覆盖率 >= 90%）
7. 编写集成测试（跨进程竞态测试）

**验收标准**:

- [ ] `acquire` / `release` 正常工作
- [ ] `withLock` 自动获取和释放锁
- [ ] stale lock 自动清理
- [ ] 单元测试覆盖率 >= 90%
- [ ] 集成测试验证跨进程互斥

***

#### Task F2: ProcessGuardian 实现

| 项目        | 内容                                       |
| --------- | ---------------------------------------- |
| **任务 ID** | DEV-1.1.2                                |
| **任务名称**  | 子进程守护与崩溃恢复机制                             |
| **预估工时**  | 8h                                       |
| **依赖**    | FileMutex                                |
| **产物路径**  | `src/core/process-guardian.ts`           |
| **测试路径**  | `src/__tests__/process-guardian.test.ts` |

**实现步骤**:

1. 定义 `ProcessGuardian` 接口
2. 实现子进程 spawn 方法
3. 实现心跳检测机制（`setInterval` + 进程通信）
4. 实现崩溃检测和自动重启
5. 处理 VS Code 非正常退出场景
6. 编写单元测试
7. 编写 E2E 测试（模拟崩溃场景）

**验收标准**:

- [ ] 正常启动和监控子进程
- [ ] 心跳超时检测（默认 5s 无响应视为挂掉）
- [ ] 崩溃后自动重启（最多 3 次）
- [ ] 指数退避重试策略
- [ ] VS Code 崩溃时子进程正确清理
- [ ] 单元测试覆盖率 >= 90%

***

#### Task F3: GlobalModelRequestQueue 实现

| 项目        | 内容                                                 |
| --------- | -------------------------------------------------- |
| **任务 ID** | DEV-1.2.1                                          |
| **任务名称**  | 全局 LLM 请求队列调度器                                     |
| **预估工时**  | 6h                                                 |
| **依赖**    | FileMutex                                          |
| **产物路径**  | `src/core/global-model-request-queue.ts`           |
| **测试路径**  | `src/__tests__/global-model-request-queue.test.ts` |

**实现步骤**:

1. 定义 `LLMRequest` / `LLMResponse` 类型
2. 实现队列数据结构（优先级队列）
3. 实现串行化调度逻辑
4. 实现并发控制（`maxConcurrent` 配置）
5. 实现请求取消和超时
6. 实现状态监控接口
7. 编写单元测试
8. 编写集成测试

**验收标准**:

- [ ] 请求按优先级排序
- [ ] 最大并发数控制生效
- [ ] 超时自动取消
- [ ] 手动取消功能
- [ ] 状态变更事件通知
- [ ] 单元测试覆盖率 >= 90%

***

#### Task F4: Queue Monitor Output Channel

| 项目        | 内容                                    |
| --------- | ------------------------------------- |
| **任务 ID** | DEV-1.2.2                             |
| **任务名称**  | 队列监控 Output Channel                   |
| **预估工时**  | 4h                                    |
| **依赖**    | GlobalModelRequestQueue               |
| **产物路径**  | `src/core/queue-monitor.ts`           |
| **测试路径**  | `src/__tests__/queue-monitor.test.ts` |

**实现步骤**:

1. 创建 `QueueMonitor` 类
2. 集成 VS Code Output Channel
3. 实现队列状态日志输出
4. 实现实时状态更新
5. 编写测试

**验收标准**:

- [ ] Output Channel 正常创建和显示
- [ ] 队列状态实时日志输出
- [ ] 可通过命令打开/关闭监控面板

***

#### Task F5: Settings UI

| 项目        | 内容                                       |
| --------- | ---------------------------------------- |
| **任务 ID** | DEV-1.4.1                                |
| **任务名称**  | 插件配置页面                                   |
| **预估工时**  | 6h                                       |
| **依赖**    | ProcessGuardian, GlobalModelRequestQueue |
| **产物路径**  | `src/webview/settings-page.ts`           |
| **测试路径**  | `src/__tests__/settings-page.test.ts`    |

**实现步骤**:

1. 定义配置项类型和默认值
2. 创建 Settings Webview 页面
3. 集成配置读写接口
4. 实现表单验证
5. 实现实时预览
6. 编写测试

**验收标准**:

- [ ] 配置页面正常显示
- [ ] 配置项可编辑和保存
- [ ] 配置验证和错误提示
- [ ] 与 VS Code Settings 同步

***

#### Task F6: .vsix 打包

| 项目        | 内容                           |
| --------- | ---------------------------- |
| **任务 ID** | DEV-1.4.2                    |
| **任务名称**  | .vsix 打包                     |
| **预估工时**  | 2h                           |
| **依赖**    | 所有核心模块                       |
| **产物路径**  | `dist/caiode-{version}.vsix` |

**实现步骤**:

1. 更新 `package.json` 版本信息
2. 配置 `.vscodeignore`
3. 执行 `vsce package`
4. 验证打包产物
5. 编写安装测试

**验收标准**:

- [ ] 成功生成 .vsix 文件
- [ ] 文件大小合理（< 10MB）
- [ ] 离线安装测试通过

***

## 四、测试计划

### 4.1 测试分层

| 测试级别      | 覆盖率目标  | 执行频率 |
| --------- | ------ | ---- |
| 单元测试 (UT) | >= 90% | 每次提交 |
| 集成测试 (IT) | >= 80% | 每日   |
| E2E 测试    | 核心流程   | 发布前  |

### 4.2 关键测试场景

**FileMutex**:

- 单进程获取/释放锁
- 跨进程互斥验证
- stale lock 清理
- 超时配置生效

**ProcessGuardian**:

- 正常启动和监控
- 心跳超时检测
- 崩溃后自动重启
- 重试指数退避
- VS Code 崩溃清理

**GlobalModelRequestQueue**:

- 优先级排序
- 并发数控制
- 超时取消
- 手动取消
- 状态事件

***

## 五、质量门禁

| 检查项               | 目标值     | 当前值    | 状态    |
| ----------------- | ------- | ------ | ----- |
| 单元测试覆盖率           | >= 90%  | 90.91% | ✅ 保持  |
| 核心模块覆盖率           | >= 90%  | -      | 新增需达标 |
| IT 全量通过           | 100%    | 0%     | 待完成   |
| Extension Host 内存 | < 150MB | -      | 待测试   |
| 压测零崩溃             | 0 崩溃    | -      | 待测试   |

***

## 六、风险识别

| 风险                   | 可能性 | 影响 | 缓解措施         |
| -------------------- | --- | -- | ------------ |
| CDP 连接不稳定            | 中   | 高  | 实现重连机制       |
| proper-lockfile 平台差异 | 低   | 高  | 多平台测试        |
| VS Code API 兼容性问题    | 中   | 中  | 使用稳定的 API 版本 |
| 内存泄漏                 | 低   | 中  | 严格资源管理       |

***

## 七、交付物清单

| 交付物                     | 路径                                       | 状态  |
| ----------------------- | ---------------------------------------- | --- |
| FileMutex 模块            | `src/core/file-mutex.ts`                 | 待实现 |
| ProcessGuardian 模块      | `src/core/process-guardian.ts`           | 待实现 |
| GlobalModelRequestQueue | `src/core/global-model-request-queue.ts` | 待实现 |
| Queue Monitor           | `src/core/queue-monitor.ts`              | 待实现 |
| Settings UI             | `src/webview/settings-page.ts`           | 待实现 |
| .vsix 安装包               | `dist/caiode-{version}.vsix`             | 待打包 |

***

**请评审此计划，如有问题请反馈。**

toolName: todo\_write

status: success

Todos updated: 5 items

我已完成 **Caiode Phase 1 核心模块实施计划** 的制定。

## 计划摘要

### 核心模块

| 模块                          | 职责                         | 预估工时 |
| --------------------------- | -------------------------- | ---- |
| **FileMutex**               | 基于 proper-lockfile 的跨进程文件锁 | 6h   |
| **ProcessGuardian**         | 子进程心跳检测与崩溃恢复               | 8h   |
| **GlobalModelRequestQueue** | 串行化 LLM 请求队列调度器            | 6h   |
| **Queue Monitor**           | 队列监控 Output Channel        | 4h   |
| **Settings UI**             | 插件配置页面                     | 6h   |
| **vsix 打包**                 | 安装包制作                      | 2h   |

### 实施周期

- **总工时**: 36h（约 5 个工作日）
- **开发顺序**: FileMutex → ProcessGuardian → GlobalModelRequestQueue → Queue Monitor → Settings UI → vsix

### 架构特点

1. **ProcessGuardian** 采用心跳检测机制，支持崩溃自动重启
2. **GlobalModelRequestQueue** 支持优先级队列和并发控制
3. **FileMutex** 基于 proper-lockfile，支持跨进程互斥和 stale lock 清理
4. 所有模块均需达到 90% 以上的单元测试覆盖率

***

**请评审此计划，如有问题或需要调整，请反馈。**
