# 首阶段实施计划：Trae 任务绑定与沙箱隔离

**版本**: v1.0
**日期**: 2026-04-08
**状态**: 待评审

---

## 1. 目标概述

实现 VS Code 配置页面驱动的自动化流程：
```
获取 Trae 任务列表 ID → 用户确认绑定任务 → 初始化沙箱 → 验证隔离性 → 创建 Trae 自定义智能体 → 测试验证
```

---

## 2. 任务分解

### Phase 1.1: CDP 连接与任务列表获取 (预计 2 天)

#### Task 1.1.1: CDP 连接模块封装
**描述**: 封装 CDP 连接逻辑，提供统一的连接管理接口

**输入**:
- Trae 调试端口配置
- 连接超时配置

**输出**:
- `CdpClient` 类，支持连接、断开、重连
- 连接状态管理

**验证方式**:
```bash
# 单元测试
npm run test -- --grep "CdpClient"

# 集成测试：连接真实 Trae 实例
npm run test:e2e -- --grep "cdp-connection"
```

**自动化验证脚本**:
```javascript
// tests/integration/cdp-connection.test.js
describe('CDP Connection', () => {
  it('should connect to Trae debug port', async () => {
    const client = new CdpClient({ port: 9222 });
    const connected = await client.connect();
    assert(connected === true);
    assert(client.isConnected() === true);
    await client.disconnect();
  });

  it('should handle connection timeout', async () => {
    const client = new CdpClient({ port: 9999, timeout: 1000 });
    await assert.rejects(() => client.connect(), /timeout/i);
  });

  it('should auto-reconnect on disconnect', async () => {
    const client = new CdpClient({ port: 9222, autoReconnect: true });
    await client.connect();
    // 模拟断开
    await client.simulateDisconnect();
    await sleep(2000);
    assert(client.isConnected() === true);
  });
});
```

---

#### Task 1.1.2: Trae 任务列表获取
**描述**: 通过 CDP 获取 Trae 中的任务列表 ID

**输入**:
- CDP 连接实例
- DOM 选择器配置

**输出**:
- `TaskListFetcher` 类
- 任务列表数据结构: `{ id, title, status, element }[]`

**验证方式**:
```bash
# 单元测试
npm run test -- --grep "TaskListFetcher"

# 集成测试
npm run test:e2e -- --grep "task-list-fetch"
```

**自动化验证脚本**:
```javascript
// tests/integration/task-list-fetch.test.js
describe('Task List Fetcher', () => {
  it('should fetch task list from Trae', async () => {
    const fetcher = new TaskListFetcher(cdpClient);
    const tasks = await fetcher.fetchTasks();
    assert(Array.isArray(tasks));
    assert(tasks.length > 0);
    assert(tasks[0].id !== undefined);
    assert(tasks[0].title !== undefined);
  });

  it('should return empty array when no tasks', async () => {
    // 在无任务的 Trae 窗口测试
    const fetcher = new TaskListFetcher(cdpClient);
    const tasks = await fetcher.fetchTasks();
    assert(Array.isArray(tasks));
  });

  it('should handle DOM selector changes', async () => {
    const fetcher = new TaskListFetcher(cdpClient, {
      selectors: { taskItem: '.custom-task-selector' }
    });
    const tasks = await fetcher.fetchTasks();
    // 应该优雅降级，不抛出异常
    assert(Array.isArray(tasks));
  });
});
```

---

#### Task 1.1.3: VS Code 配置页面 - 连接与任务显示
**描述**: 创建 VS Code Webview 页面，显示连接状态和任务列表

**输入**:
- VS Code Extension API
- React 组件

**输出**:
- 配置页面 UI
- 任务列表展示组件
- 连接状态指示器

**验证方式**:
```bash
# UI 组件测试
npm run test -- --grep "ConfigPage"

# E2E 测试
npm run test:e2e -- --grep "vscode-config-page"
```

**自动化验证脚本**:
```javascript
// tests/ui/config-page.test.js
describe('VS Code Config Page', () => {
  it('should render connection status', async () => {
    render(<ConfigPage />);
    const statusElement = await screen.findByTestId('connection-status');
    assert(statusElement.textContent.includes('已连接') || statusElement.textContent.includes('未连接'));
  });

  it('should display task list after connection', async () => {
    render(<ConfigPage initialConnected={true} tasks={mockTasks} />);
    const taskItems = await screen.findAllByTestId('task-item');
    assert(taskItems.length === mockTasks.length);
  });

  it('should show bind button for each task', async () => {
    render(<ConfigPage initialConnected={true} tasks={mockTasks} />);
    const bindButtons = await screen.findAllByRole('button', { name: /绑定/i });
    assert(bindButtons.length === mockTasks.length);
  });
});
```

---

### Phase 1.2: Git Worktree 沙箱初始化 (预计 3 天)

#### Task 1.2.1: Worktree 管理器封装
**描述**: 封装 Git Worktree 操作，提供创建、切换、清理接口

**输入**:
- Git 仓库路径
- Worktree 配置

**输出**:
- `WorktreeManager` 类
- Worktree 生命周期管理

**验证方式**:
```bash
# 单元测试
npm run test -- --grep "WorktreeManager"

# 集成测试
npm run test:e2e -- --grep "worktree-lifecycle"
```

**自动化验证脚本**:
```javascript
// tests/integration/worktree-manager.test.js
describe('Worktree Manager', () => {
  const testRepo = '/tmp/test-repo';
  const worktreePath = '/tmp/test-repo-worktree';

  beforeEach(async () => {
    // 创建测试仓库
    await exec('git init', testRepo);
    await exec('git commit --allow-empty -m "init"', testRepo);
  });

  afterEach(async () => {
    // 清理
    await exec(`rm -rf ${testRepo} ${worktreePath}`);
  });

  it('should create worktree', async () => {
    const manager = new WorktreeManager(testRepo);
    const result = await manager.createWorktree({
      name: 'test-sandbox',
      branch: 'sandbox/test'
    });
    assert(fs.existsSync(result.path));
    assert(result.branch === 'sandbox/test');
  });

  it('should list worktrees', async () => {
    const manager = new WorktreeManager(testRepo);
    await manager.createWorktree({ name: 'wt1' });
    await manager.createWorktree({ name: 'wt2' });
    const list = await manager.listWorktrees();
    assert(list.length >= 3); // main + 2 worktrees
  });

  it('should remove worktree', async () => {
    const manager = new WorktreeManager(testRepo);
    const result = await manager.createWorktree({ name: 'to-remove' });
    await manager.removeWorktree(result.name);
    assert(!fs.existsSync(result.path));
  });

  it('should cleanup stale worktrees', async () => {
    const manager = new WorktreeManager(testRepo);
    await manager.createWorktree({ name: 'stale' });
    // 手动删除目录但保留 git 记录
    await exec(`rm -rf ${worktreePath}/stale`);
    await manager.pruneWorktrees();
    const list = await manager.listWorktrees();
    assert(!list.some(w => w.name === 'stale'));
  });
});
```

---

#### Task 1.2.2: 沙箱隔离验证器
**描述**: 验证 Worktree 沙箱的文件隔离性

**输入**:
- Worktree 路径
- 隔离规则配置

**输出**:
- `SandboxValidator` 类
- 隔离性测试报告

**验证方式**:
```bash
# 单元测试
npm run test -- --grep "SandboxValidator"

# 隔离性测试
npm run test:e2e -- --grep "sandbox-isolation"
```

**自动化验证脚本**:
```javascript
// tests/integration/sandbox-validator.test.js
describe('Sandbox Validator', () => {
  it('should verify file isolation', async () => {
    const mainRepo = '/tmp/main-repo';
    const worktree = '/tmp/worktree-repo';
    
    // 在 mainRepo 创建文件
    await fs.writeFile(`${mainRepo}/test.txt`, 'main content');
    
    const validator = new SandboxValidator(worktree);
    const result = await validator.verifyFileIsolation();
    
    assert(result.isolated === true);
    assert(result.details.some(d => d.includes('文件隔离')));
  });

  it('should verify branch isolation', async () => {
    const validator = new SandboxValidator(worktreePath);
    const result = await validator.verifyBranchIsolation();
    
    assert(result.isolated === true);
    assert(result.mainBranch !== result.worktreeBranch);
  });

  it('should verify git config isolation', async () => {
    const validator = new SandboxValidator(worktreePath);
    const result = await validator.verifyGitConfigIsolation();
    
    assert(result.isolated === true);
  });

  it('should generate isolation report', async () => {
    const validator = new SandboxValidator(worktreePath);
    const report = await validator.generateReport();
    
    assert(report.timestamp !== undefined);
    assert(report.summary !== undefined);
    assert(report.details.length > 0);
    assert(report.passed === true || report.passed === false);
  });
});
```

---

#### Task 1.2.3: VS Code 配置页面 - 沙箱初始化
**描述**: 在配置页面添加沙箱初始化功能

**输入**:
- 用户绑定的任务 ID
- Worktree 配置

**输出**:
- 沙箱初始化按钮
- 初始化进度显示
- 隔离性验证结果展示

**验证方式**:
```bash
# UI 组件测试
npm run test -- --grep "SandboxInitPanel"

# E2E 测试
npm run test:e2e -- --grep "sandbox-init-flow"
```

**自动化验证脚本**:
```javascript
// tests/ui/sandbox-init-panel.test.js
describe('Sandbox Init Panel', () => {
  it('should show init button after task binding', async () => {
    render(<SandboxInitPanel boundTaskId="task-123" />);
    const initButton = await screen.findByRole('button', { name: /初始化沙箱/i });
    assert(initButton !== null);
  });

  it('should show progress during init', async () => {
    render(<SandboxInitPanel boundTaskId="task-123" />);
    const initButton = screen.getByRole('button', { name: /初始化沙箱/i });
    fireEvent.click(initButton);
    
    const progressBar = await screen.findByRole('progressbar');
    assert(progressBar !== null);
  });

  it('should display validation result', async () => {
    const mockResult = { passed: true, details: ['文件隔离: 通过', '分支隔离: 通过'] };
    render(<SandboxInitPanel initResult={mockResult} />);
    
    const resultElement = await screen.findByTestId('validation-result');
    assert(resultElement.textContent.includes('通过'));
  });
});
```

---

### Phase 1.3: Trae 智能体创建与验证 (预计 3 天)

#### Task 1.3.1: Trae 智能体配置注入
**描述**: 通过 CDP 向 Trae 注入智能体配置

**输入**:
- 沙箱路径
- 智能体提示词配置

**输出**:
- `AgentConfigInjector` 类
- 配置注入状态

**验证方式**:
```bash
# 单元测试
npm run test -- --grep "AgentConfigInjector"

# 集成测试
npm run test:e2e -- --grep "agent-config-inject"
```

**自动化验证脚本**:
```javascript
// tests/integration/agent-config-inject.test.js
describe('Agent Config Injector', () => {
  it('should inject agent config to Trae', async () => {
    const injector = new AgentConfigInjector(cdpClient);
    const result = await injector.inject({
      name: 'Test Agent',
      sandboxPath: '/tmp/sandbox',
      systemPrompt: 'You are a test agent'
    });
    
    assert(result.success === true);
    assert(result.agentId !== undefined);
  });

  it('should verify injection by reading back', async () => {
    const injector = new AgentConfigInjector(cdpClient);
    const config = { name: 'Verify Agent', sandboxPath: '/tmp/sandbox' };
    await injector.inject(config);
    
    const readBack = await injector.readCurrentConfig();
    assert(readBack.name === config.name);
    assert(readBack.sandboxPath === config.sandboxPath);
  });

  it('should handle injection failure gracefully', async () => {
    const injector = new AgentConfigInjector(cdpClient);
    const result = await injector.inject({
      name: '', // 空名称应该失败
      sandboxPath: '/invalid/path'
    });
    
    assert(result.success === false);
    assert(result.error !== undefined);
  });
});
```

---

#### Task 1.3.2: 智能体沙箱工作验证
**描述**: 验证智能体是否在独立沙箱中工作

**输入**:
- 智能体 ID
- 沙箱路径

**输出**:
- 验证测试报告
- 文件操作日志

**验证方式**:
```bash
# E2E 测试
npm run test:e2e -- --grep "agent-sandbox-verify"
```

**自动化验证脚本**:
```javascript
// tests/e2e/agent-sandbox-verify.test.js
describe('Agent Sandbox Verification', () => {
  const mainRepo = '/tmp/main-repo';
  const sandboxPath = '/tmp/sandbox-repo';
  
  before(async () => {
    // 准备环境
    await setupTestEnvironment(mainRepo, sandboxPath);
  });

  it('should create file in sandbox, not in main repo', async () => {
    // 触发智能体创建文件
    await agentExecuteCommand('echo "test" > test-file.txt');
    await sleep(1000);
    
    // 验证文件只在沙箱中
    const sandboxFile = await fs.exists(`${sandboxPath}/test-file.txt`);
    const mainFile = await fs.exists(`${mainRepo}/test-file.txt`);
    
    assert(sandboxFile === true);
    assert(mainFile === false);
  });

  it('should modify file in sandbox only', async () => {
    // 在两个仓库都创建同名文件
    await fs.writeFile(`${mainRepo}/shared.txt`, 'main content');
    await fs.writeFile(`${sandboxPath}/shared.txt`, 'main content');
    
    // 智能体修改文件
    await agentExecuteCommand('echo "modified" > shared.txt');
    await sleep(1000);
    
    // 验证只有沙箱文件被修改
    const mainContent = await fs.readFile(`${mainRepo}/shared.txt`, 'utf8');
    const sandboxContent = await fs.readFile(`${sandboxPath}/shared.txt`, 'utf8');
    
    assert(mainContent === 'main content');
    assert(sandboxContent.includes('modified'));
  });

  it('should not access files outside sandbox', async () => {
    // 尝试访问沙箱外的文件
    const result = await agentExecuteCommand('cat /etc/passwd');
    
    // 应该被拒绝或返回空
    assert(result.denied === true || result.output === '');
  });

  it('should generate verification report', async () => {
    const reporter = new AgentSandboxReporter(agentId, sandboxPath);
    const report = await reporter.generateReport();
    
    assert(report.fileIsolation.passed === true);
    assert(report.branchIsolation.passed === true);
    assert(report.permissionCheck.passed === true);
    
    // 保存报告
    await fs.writeFile('/tmp/sandbox-verify-report.json', JSON.stringify(report, null, 2));
  });
});
```

---

#### Task 1.3.3: VS Code 配置页面 - 完整流程集成
**描述**: 集成所有功能，实现完整的一键流程

**输入**:
- 用户配置参数
- Trae 连接信息

**输出**:
- 完整的配置页面
- 一键启动按钮
- 全流程状态追踪

**验证方式**:
```bash
# E2E 完整流程测试
npm run test:e2e -- --grep "full-workflow"
```

**自动化验证脚本**:
```javascript
// tests/e2e/full-workflow.test.js
describe('Full Workflow Integration', () => {
  it('should complete full workflow from connection to verification', async () => {
    // 1. 打开配置页面
    await vscode.commands.executeCommand('caiode.openConfigPage');
    
    // 2. 连接 Trae
    await page.click('[data-testid="connect-button"]');
    await page.waitForSelector('[data-testid="connection-status"][data-status="connected"]');
    
    // 3. 获取任务列表
    const tasks = await page.$$('[data-testid="task-item"]');
    assert(tasks.length > 0);
    
    // 4. 绑定任务
    await tasks[0].click();
    await page.click('[data-testid="bind-task-button"]');
    await page.waitForSelector('[data-testid="bind-status"][data-status="bound"]');
    
    // 5. 初始化沙箱
    await page.click('[data-testid="init-sandbox-button"]');
    await page.waitForSelector('[data-testid="sandbox-status"][data-status="ready"]', { timeout: 30000 });
    
    // 6. 验证隔离性
    const isolationResult = await page.$eval('[data-testid="isolation-result"]', el => el.textContent);
    assert(isolationResult.includes('通过'));
    
    // 7. 创建智能体
    await page.click('[data-testid="create-agent-button"]');
    await page.waitForSelector('[data-testid="agent-status"][data-status="created"]', { timeout: 30000 });
    
    // 8. 验证智能体工作
    await page.click('[data-testid="verify-agent-button"]');
    await page.waitForSelector('[data-testid="verify-status"][data-status="passed"]', { timeout: 60000 });
    
    // 9. 检查最终报告
    const finalReport = await page.$eval('[data-testid="final-report"]', el => el.textContent);
    assert(finalReport.includes('全部通过'));
  });

  it('should handle workflow failure gracefully', async () => {
    // 模拟失败场景
    await page.click('[data-testid="connect-button"]');
    
    // 断开 Trae 连接
    await disconnectTrae();
    
    // 验证错误处理
    const errorMessage = await page.$eval('[data-testid="error-message"]', el => el.textContent);
    assert(errorMessage.includes('连接失败'));
    
    // 验证重试按钮存在
    const retryButton = await page.$('[data-testid="retry-button"]');
    assert(retryButton !== null);
  });
});
```

---

## 3. 验收标准

### 3.1 功能验收

| 功能 | 验收标准 | 自动化测试 |
|------|----------|------------|
| CDP 连接 | 能稳定连接 Trae 并自动重连 | `test:e2e --grep "cdp-connection"` |
| 任务列表获取 | 能正确获取并显示任务列表 | `test:e2e --grep "task-list-fetch"` |
| 任务绑定 | 用户可选择并绑定任务 | `test:e2e --grep "task-bind"` |
| 沙箱初始化 | 能创建独立 Worktree | `test:e2e --grep "worktree-lifecycle"` |
| 隔离性验证 | 文件/分支隔离验证通过 | `test:e2e --grep "sandbox-isolation"` |
| 智能体创建 | 能注入配置并创建智能体 | `test:e2e --grep "agent-config-inject"` |
| 智能体验证 | 智能体在独立沙箱工作 | `test:e2e --grep "agent-sandbox-verify"` |

### 3.2 性能验收

| 指标 | 标准 | 验证方式 |
|------|------|----------|
| CDP 连接时间 | < 2s | 自动化测试计时 |
| 任务列表获取 | < 1s | 自动化测试计时 |
| Worktree 创建 | < 5s | 自动化测试计时 |
| 隔离性验证 | < 10s | 自动化测试计时 |
| 完整流程 | < 60s | E2E 测试计时 |

### 3.3 可靠性验收

| 指标 | 标准 | 验证方式 |
|------|------|----------|
| CDP 断线重连 | 自动重连成功 | 模拟断线测试 |
| Worktree 清理 | 无残留文件 | 清理后检查 |
| 错误恢复 | 优雅降级不崩溃 | 错误注入测试 |

---

## 4. 依赖关系

```
Task 1.1.1 (CDP 连接)
    │
    ├── Task 1.1.2 (任务列表获取)
    │       │
    │       └── Task 1.1.3 (配置页面 - 连接)
    │
Task 1.2.1 (Worktree 管理)
    │
    ├── Task 1.2.2 (隔离验证器)
    │       │
    │       └── Task 1.2.3 (配置页面 - 沙箱)
    │
Task 1.3.1 (智能体配置注入)
    │
    ├── Task 1.3.2 (智能体验证)
    │       │
    │       └── Task 1.3.3 (完整流程集成)
```

---

## 5. 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| Trae DOM 选择器变化 | 中 | 高 | 选择器配置化，版本适配 |
| CDP 连接不稳定 | 中 | 中 | 自动重连机制 |
| Worktree 权限问题 | 低 | 中 | 权限预检查 |
| 测试环境依赖 | 低 | 中 | Docker 容器化测试环境 |

---

## 6. 评审清单

- [ ] 任务分解是否合理？
- [ ] 验证方式是否可自动化？
- [ ] 依赖关系是否清晰？
- [ ] 时间估算是否合理？
- [ ] 风险评估是否完整？

---

**下一步**: 请评审此计划，确认后开始实施。
