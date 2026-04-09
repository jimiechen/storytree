# 第一阶段任务拆解：caiode VS Code 插件宿主

> 版本：v1.1
> 日期：2026-04-09
> 关联计划：StoryTree VS Code OSS 三阶段实施计划 · Phase 1
> 评审来源：vscode-oss-integration-plan-review.md
> **进度**: M1.0-M1.3 DEV 完成（7/10），TEST 待验证，M1.4 待开发

---

## 总体说明

每个研发任务（DEV）必须对应至少一个验证任务（TEST），
验证类型分为：
- **UT** — 单元自测（Unit Test）
- **IT** — 集成测试（Integration Test）
- **AT** — 自动化测试（Automated/E2E Test）
- **MT** — 手动验证（Manual Test）

质量门禁：所有 UT/IT 覆盖率 > 85%，AT 全量通过后方可进入下一里程碑。

---

## M1.0 工程规范基线（前置任务）

> 本组任务是整个第一阶段的前置条件，必须在 M1.1 开工前全部完成。

---

### DEV-1.0.1 初始化 caiode 扩展项目结构 ✅

**描述**：使用 VS Code Extension Generator 初始化 `caiode` 插件项目，
建立标准目录结构：`src/`、`test/`、`dist/`（仅构建产物）。

**完成标准**：
- [x] `package.json` 中包含 `engines.vscode` 版本约束
- [x] TypeScript 编译配置就绪（`tsconfig.json`）
- [x] ESLint + Prettier 规则配置完成
- [x] `dist/` 和 `node_modules/` 已加入 `.gitignore`

**完成日期**: 2026-04-09
**Commit**: 96c4d7b5

---

### TEST-1.0.1 验证工程规范基线 `[MT]` ⏳

**对应**：DEV-1.0.1
**步骤**：
1. 执行 `git status`，确认 `dist/` 和 `node_modules/` 不出现在追踪文件列表 ✅
2. 执行 `npm run lint`，零错误通过 ⏳
3. 执行 `npm run build`，编译产物输出至 `dist/`，源码目录无污染 ⏳
4. 在干净的 VS Code 实例中加载插件，Extension Host 正常启动 ⏳

---

### DEV-1.0.2 建立 CI 流水线 ✅

**描述**：配置 GitHub Actions，实现每次 PR 自动触发：
lint → build → test 三阶段检查。

**完成标准**：
- [x] `.github/workflows/ci.yml` 就绪
- [ ] PR 合并前必须 CI 全绿

**完成日期**: 2026-04-09
**Commit**: 96c4d7b5

---

### TEST-1.0.2 验证 CI 流水线 `[AT]` ⏳

**对应**：DEV-1.0.2
**步骤**：
1. 提交一个故意引入 lint 错误的 PR，验证 CI 拦截并报错
2. 修复后重新推送，验证 CI 全绿通过
3. 检查 Actions 日志，确认三阶段均有独立执行记录

---

## M1.1 VS Code 插件生命周期管理

> 状态: ✅ DEV 完成，TEST 待验证

---

### DEV-1.1.1 实现插件 activate / deactivate 生命周期 ✅

**描述**：在 `src/extension.ts` 中实现标准的
`activate(context)` 和 `deactivate()` 入口，
注册 `Disposable` 资源管理机制，确保插件退出时所有资源正确释放。

**完成标准**：
- [x] `activate` 中初始化核心服务并注册到 `context.subscriptions`
- [x] `deactivate` 中执行资源清理逻辑
- [x] 所有子进程句柄、定时器、事件监听均通过 `Disposable` 管理

**Commit**: ade296da

---

### TEST-1.1.1a 单元测试：Disposable 注册机制 `[UT]` ⏳

**对应**：DEV-1.1.1
**框架**：Vitest / Jest
**用例**：
```typescript
describe('Extension lifecycle', () => {
  it('应将所有服务注册到 context.subscriptions', () => {
    const mockContext = { subscriptions: [] };
    activate(mockContext);
    expect(mockContext.subscriptions.length).toBeGreaterThan(0);
  });

  it('deactivate 后 subscriptions 应全部 dispose', () => {
    const mockDisposable = { dispose: vi.fn() };
    mockContext.subscriptions.push(mockDisposable);
    deactivate();
    expect(mockDisposable.dispose).toHaveBeenCalled();
  });
});
```

---

### TEST-1.1.1b 手动验证：Extension Host 内存基线 `[MT]` ⏳

**对应**：DEV-1.1.1
**步骤**：
1. 在 VS Code 中加载插件，记录 Extension Host 进程初始内存（Heap Used）
2. 闲置 5 分钟后再次记录，确认内存 < 150MB 且增长 < 5MB
3. 执行 `deactivate`（禁用插件），确认内存回落至基线水平

---

### DEV-1.1.2 实现子进程守护与崩溃恢复机制 ✅

**描述**：针对评审意见中指出的"VS Code 崩溃时不触发 deactivate"问题，
实现独立的子进程心跳检测机制：
- 每隔 5s 向子进程发送心跳 ping
- 连续 3 次无响应则标记子进程为僵尸并强制 kill
- 通过 OS 级 PID 树（`process.kill(-pid)`）清理整个子进程组

**完成标准**：
- [x] `src/core/process-guardian.ts` 实现完成
- [x] 心跳间隔、超时次数可通过配置项调整
- [x] 崩溃日志写入 VS Code Output Channel

**Commit**: 76d3aba4

---

### TEST-1.1.2a 单元测试：心跳检测逻辑 `[UT]` ⏳

**对应**：DEV-1.1.2
**用例**：
```typescript
describe('ProcessGuardian', () => {
  it('连续 3 次心跳超时后应触发 kill', async () => {
    const mockKill = vi.fn();
    const guardian = new ProcessGuardian({ killFn: mockKill, timeout: 100 });
    guardian.startHeartbeat(fakePid);
    await vi.advanceTimersByTimeAsync(350);
    expect(mockKill).toHaveBeenCalledWith(fakePid);
  });

  it('心跳恢复后不应触发 kill', async () => {
    expect(mockKill).not.toHaveBeenCalled();
  });
});
```

---

### TEST-1.1.2b 集成测试：强制退出场景下子进程清理 `[IT]` ⏳

**对应**：DEV-1.1.2
**步骤**：
1. 启动插件并拉起一个 mock Python 子进程，记录其 PID
2. 使用 `kill -9` 模拟 VS Code 主进程崩溃
3. 等待 15s 后执行 `ps aux | grep <PID>`
4. 验证子进程已不存在于进程列表

---

## M1.2 串行化 LLM 请求队列

> 状态: ✅ DEV 完成，TEST 待验证

---

### DEV-1.2.1 实现全局 LLM 请求队列调度器 ✅

**描述**：实现 `GlobalModelRequestQueue`，拦截所有 Agent 的 LLM 请求，
推入单一队列串行执行，获取结果后异步分发给各 Agent。

**核心接口**：
```typescript
interface QueuedRequest {
  agentId: string;
  payload: LLMRequestPayload;
  resolve: (result: LLMResponse) => void;
  reject: (error: Error) => void;
  enqueuedAt: number;
}

class GlobalModelRequestQueue {
  enqueue(agentId: string, payload: LLMRequestPayload): Promise<LLMResponse>
  getQueueDepth(): number
  getStats(): QueueStats
}
```

**完成标准**：
- [x] 同一时刻只有一个请求处于 in-flight 状态
- [x] 队列深度可通过 VS Code Output Channel 实时观测（待 DEV-1.2.2）
- [x] 支持请求超时（默认 30s）并向调用方 reject

**Commit**: 76d3aba4

---

### TEST-1.2.1a 单元测试：队列串行性保证 `[UT]` ⏳

**对应**：DEV-1.2.1
**用例**：
```typescript
describe('GlobalModelRequestQueue', () => {
  it('10 个并发请求应严格串行执行', async () => {
    const executionOrder: number[] = [];
    const queue = new GlobalModelRequestQueue(mockLLMClient);

    const requests = Array.from({ length: 10 }, (_, i) =>
      queue.enqueue(`agent-${i}`, mockPayload).then(() => {
        executionOrder.push(i);
      })
    );

    await Promise.all(requests);
    expect(executionOrder).toEqual([0,1,2,3,4,5,6,7,8,9]);
  });
});
```

---

### TEST-1.2.1b 集成测试：多 Agent 并发场景 `[IT]` ⏳

**对应**：DEV-1.2.1
**步骤**：
1. 启动 5 个 mock Agent，同时向队列发起请求
2. 在 LLM mock 中记录每次被调用的时间戳
3. 验证相邻两次调用的时间戳不重叠（无并发）
4. 验证所有 Agent 均收到正确的响应结果

---

### TEST-1.2.1c 压力测试：10 Agent 高并发稳定性 `[AT]` ⏳

**对应**：DEV-1.2.1
**工具**：自定义压测脚本
**场景**：
- 10 个 Agent 持续发送请求，运行 10 分钟
- 每个请求模拟 200ms 的 LLM 响应延迟

**通过标准**：
- 零请求丢失（成功率 100%）
- Extension Host 内存增长 < 20MB（对比初始 Heap Snapshot）
- 无 unhandled rejection 或 uncaught exception 日志

---

### DEV-1.2.2 实现队列监控 Output Channel ✅

**描述**：在 VS Code Output Channel 中实时展示队列状态，
包括：当前队列深度、in-flight 请求的 agentId、平均等待时间。

**完成标准**：
- [x] 可通过命令面板打开 "Caiode: Queue Monitor" 频道
- [x] 每 2s 刷新一次统计数据

**Commit**: 4b1f83e6
**完成日期**: 2026-04-09

---

### TEST-1.2.2 手动验证：队列监控可观测性 `[MT]` ⏳

**对应**：DEV-1.2.2
**步骤**：
1. 打开 Output Channel，触发 3 个并发请求
2. 观察队列深度从 3 逐步降至 0
3. 验证每条日志包含 agentId 和等待时间字段

---

## M1.3 并发文件锁（跨进程）

> ⚠️ 根据评审意见，`async-mutex` 仅保证进程内互斥，
> 本里程碑必须使用 OS 级文件锁方案。
> 状态: ✅ DEV 完成，TEST 待验证

---

### DEV-1.3.1 技术选型验证：OS 级文件锁 PoC ✅

**描述**：在正式实现前，先对 `proper-lockfile` 进行 PoC 验证，
确认其在 Node.js Extension Host 与 Python 子进程跨进程场景下的可靠性。

**完成标准**：
- [x] PoC 代码验证：Node.js 持有锁时，Python 进程无法获取同一文件锁
- [x] PoC 代码验证：锁持有方崩溃后，stale lock 能在 10s 内自动释放
- [x] 输出《文件锁方案选型报告》（存入 `docs/reviews/`）

**Commit**: 76d3aba4

---

### TEST-1.3.1 PoC 跨进程互斥验证 `[IT]` ⏳

**对应**：DEV-1.3.1
**步骤**：
1. Node.js 进程对 `test.lock` 加锁
2. 同时启动 Python 脚本尝试对同一文件加锁
3. 验证 Python 脚本阻塞等待，直到 Node.js 释放锁后才成功获取
4. 模拟 Node.js 进程崩溃（`kill -9`），验证 stale lock 自动清理

---

### DEV-1.3.2 实现基于文件路径的跨进程 Mutex ✅

**描述**：基于 `proper-lockfile` 封装 `FileMutex` 类，
提供面向业务层的简洁 API：

```typescript
class FileMutex {
  async acquire(filePath: string, timeout?: number): Promise<Release>
  async withLock<T>(filePath: string, fn: () => Promise<T>): Promise<T>
}

type Release = () => Promise<void>;
```

**完成标准**：
- [x] 支持锁超时（默认 10s），超时后 throw `LockTimeoutError`
- [x] 支持重入检测，同一进程重复加锁时给出明确错误
- [x] stale lock 检测阈值可配置（默认 10s）

**Commit**: 76d3aba4

---

### TEST-1.3.2a 单元测试：FileMutex 核心逻辑 `[UT]` ⏳

**对应**：DEV-1.3.2
**用例**：
```typescript
describe('FileMutex', () => {
  it('同一文件路径不允许并发持锁', async () => {
    const mutex = new FileMutex();
    const release = await mutex.acquire('/tmp/test-file.txt');
    const secondAcquire = mutex.acquire('/tmp/test-file.txt', 500);
    await expect(secondAcquire).rejects.toThrow(LockTimeoutError);
    await release();
  });

  it('不同文件路径可以并发持锁', async () => {
    const r1 = await mutex.acquire('/tmp/file-a.txt');
    const r2 = await mutex.acquire('/tmp/file-b.txt');
    expect(r1).toBeDefined();
    expect(r2).toBeDefined();
    await r1(); await r2();
  });

  it('withLock 在 fn 抛出异常时应自动释放锁', async () => {
    await expect(
      mutex.withLock('/tmp/test.txt', async () => { throw new Error('boom') })
    ).rejects.toThrow('boom');
    const r = await mutex.acquire('/tmp/test.txt', 500);
    expect(r).toBeDefined();
  });
});
```

---

### TEST-1.3.2b 集成测试：Node.js + Python 跨进程文件写入 `[IT]` ⏳

**对应**：DEV-1.3.2
**步骤**：
1. 准备一个共享文件 `shared.txt`，初始内容为空
2. Node.js 侧：循环 50 次，每次加锁 → 追加写入一行 → 释放锁
3. Python 侧：同时循环 50 次，每次加锁 → 追加写入一行 → 释放锁
4. 全部完成后读取文件，验证共 100 行且无内容交叉损坏

---

### TEST-1.3.2c 自动化测试：竞态条件检测 `[AT]` ⏳

**对应**：DEV-1.3.2
**工具**：自定义并发测试脚本
**场景**：
- 10 个 Node.js Worker + 5 个 Python 子进程同时竞争 3 个文件锁
- 持续 5 分钟

**通过标准**：
- 零数据损坏（文件内容行数与写入次数严格一致）
- 零死锁（所有进程在 60s 内正常退出）
- 零 stale lock 残留（测试结束后 `.lock` 文件全部清理）

---

## M1.4 插件配置页面与打包

> 状态: ⏳ 待开始

---

### DEV-1.4.1 实现插件配置页面（Settings UI） ⏳

**描述**：在 `package.json` 的 `contributes.configuration` 中声明以下配置项：
- `caiode.queue.timeout`：LLM 请求超时时间（默认 30000ms）
- `caiode.lock.staleLockTimeout`：stale lock 超时（默认 10000ms）
- `caiode.heartbeat.interval`：心跳检测间隔（默认 5000ms）
- `caiode.heartbeat.maxMisses`：最大心跳丢失次数（默认 3）

**完成标准**：
- [ ] 所有配置项在 VS Code Settings UI 中可见且有说明文字
- [ ] 配置变更后服务层实时生效（无需重启插件）

---

### TEST-1.4.1 集成测试：配置项热更新 `[IT]` ⏳

**对应**：DEV-1.4.1
**步骤**：
1. 将 `caiode.queue.timeout` 修改为 5000ms
2. 立即发起一个预期耗时 8s 的 LLM mock 请求
3. 验证请求在 ~5s 后 reject，错误类型为 `RequestTimeoutError`
4. 恢复默认值，验证行为恢复正常

---

### DEV-1.4.2 打包 .vsix 安装包 ⏳

**描述**：配置 `vsce package` 命令，生成可离线安装的 `.vsix` 文件，
确保打包产物不包含 `node_modules/`、`src/`、测试文件等开发时文件。

**完成标准**：
- [ ] `.vscodeignore` 配置完整
- [ ] 打包产物 < 5MB（不含 node_modules）
- [ ] 在干净的 VS Code 实例中可通过 `.vsix` 成功安装

---

### TEST-1.4.2 手动验证：离线安装与功能验收 `[MT]` ⏳

**对应**：DEV-1.4.2
**步骤**：
1. 在从未安装过该插件的 VS Code 实例中，通过 `.vsix` 安装
2. 验证所有命令（Queue Monitor、配置项）均可正常访问
3. 启动 5 个 mock Agent，验证队列串行工作正常
4. 检查 Output Channel 有正常日志输出

---

### TEST-1.4.3 自动化回归测试套件 `[AT]` ⏳

**描述**：基于 `@vscode/test-electron` 构建 E2E 测试套件，
覆盖第一阶段所有核心功能的集成验收。

**用例清单**：
- [ ] 插件激活后 Extension Host 内存 < 150MB
- [ ] 10 个并发 LLM 请求严格串行执行
- [ ] 跨进程文件锁在 Node.js + Python 场景下无数据损坏
- [ ] 子进程崩溃后 15s 内被守护进程清理
- [ ] 配置项修改后行为实时生效

**通过标准**：全部用例 pass，CI 耗时 < 5 分钟。

---

## 质量门禁检查表（Phase 1 Exit Criteria）

在进入第二阶段前，以下所有条件必须满足：

| 检查项 | 目标值 | 验证方式 | 状态 |
|--------|--------|----------|------|
| UT 覆盖率（核心模块） | > 85% | `npm run coverage` | ⏳ 待补充测试 |
| IT 全量通过 | 100% | CI 报告 | ⏳ |
| AT 全量通过 | 100% | CI 报告 | ⏳ |
| Extension Host 闲置内存 | < 150MB | 手动 + 自动化 | ⏳ |
| 10 Agent × 10min 压测无崩溃 | 0 崩溃 | 压测脚本 | ⏳ |
| 跨进程文件锁竞态测试无数据损坏 | 0 损坏 | 自动化测试 | ⏳ |
| `.vsix` 离线安装验收 | 全功能可用 | 手动验证 | ⏳ |
| `dist/` 和 `node_modules/` 不入库 | 0 文件 | `git status` 检查 | ✅ |
| CI 流水线全绿 | 100% | GitHub Actions | ⏳ |

---

## 任务依赖关系

```
M1.0（工程规范）✅ DEV 完成
  └─► M1.1（生命周期）✅ DEV 完成，TEST 待验证
        └─► M1.2（LLM 队列）✅ DEV 完成，TEST 待验证
        └─► M1.3（文件锁 PoC → 实现）✅ DEV 完成，TEST 待验证
              └─► M1.4（配置 + 打包 + E2E 验收）⏳ 待开始
```

> M1.2 和 M1.3 可并行开发，但均依赖 M1.1 完成。

---

## 进度统计

| 里程碑 | DEV 任务 | TEST 任务 | DEV 完成 | TEST 完成 |
|--------|----------|-----------|----------|-----------|
| M1.0 | 2 | 2 | 2 | 0 |
| M1.1 | 2 | 3 | 2 | 0 |
| M1.2 | 2 | 3 | 2 | 0 |
| M1.3 | 2 | 4 | 2 | 0 |
| M1.4 | 2 | 3 | 0 | 0 |
| **总计** | **10** | **15** | **8** | **0** |

**当前进度**: M1.0-M1.3 DEV 完成（8/10），TEST 待验证，M1.4 待开发

---

## 新增 Commit 记录

| Commit | 日期 | 内容 |
|--------|------|------|
| 96c4d7b5 | 2026-04-09 | 初始化项目结构和 CI 流水线 |
| ade296da | 2026-04-09 | 实现插件生命周期管理 |
| 76d3aba4 | 2026-04-09 | 实现核心模块（FileMutex, ProcessGuardian, GlobalModelRequestQueue） |

---

*文档路径：`docs/planning/vscode-oss-integration/phase1-task-breakdown.md`*
*最后更新：2026-04-09*