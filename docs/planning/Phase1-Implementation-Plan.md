# 首阶段实施计划：Trae 任务绑定与沙箱隔离

**版本**: v2.0
**日期**: 2026-04-08
**状态**: 待评审
**更新**: 新增 Phase 0 初始化基础设施

***

## 1. 目标概述

实现 VS Code 配置页面驱动的自动化流程：

```
预检检查 → 设置加载 → 权限初始化 → 获取 Trae 任务列表 ID → 用户确认绑定任务 → 初始化沙箱 → 验证隔离性 → 创建 Trae 自定义智能体 → 测试验证
```

***

## 2. 任务分解

### Phase 0: 初始化基础设施 (新增，预计 2 天)

#### Task 0.1: 预检检查模块

**描述**: 在启动流程中检查 Trae 连接性和环境可用性

**输入**:

- Trae 调试端口配置
- 超时配置

**输出**:

- `PreflightChecker` 类
- 检查结果报告

**验证方式**:

```bash
# 单元测试
npm run test -- --grep "PreflightChecker"

# 集成测试
npm run test:e2e -- --grep "preflight"
```

**自动化验证脚本**:

```javascript
// tests/integration/preflight.test.js
describe('Preflight Checker', () => {
  it('should check Trae debug port availability', async () => {
    const checker = new PreflightChecker({ port: 9222 });
    const result = await checker.checkTraeConnection();
    assert(result.success === true || result.error !== undefined);
  });

  it('should check Git availability', async () => {
    const checker = new PreflightChecker();
    const result = await checker.checkGitAvailable();
    assert(result.success === true);
  });

  it('should check Worktree support', async () => {
    const checker = new PreflightChecker();
    const result = await checker.checkWorktreeSupport();
    assert(result.success === true);
  });

  it('should generate preflight report', async () => {
    const checker = new PreflightChecker({ port: 9222 });
    const report = await checker.runAllChecks();
    assert(report.traeConnection !== undefined);
    assert(report.gitAvailable !== undefined);
    assert(report.worktreeSupport !== undefined);
  });

  it('should handle SSL certificate issues', async () => {
    const checker = new PreflightChecker({ ignoreSSL: true });
    const result = await checker.checkTraeConnection();
    // 应该优雅处理 SSL 问题
    assert(result !== undefined);
  });
});
```

***

#### Task 0.2: 设置加载模块

**描述**: 加载和管理沙箱配置

**输入**:

- 配置文件路径
- 默认配置

**输出**:

- `SettingsManager` 类
- 配置验证和合并

**配置结构**:

```typescript
interface CaiodeSettings {
  trae: {
    port: number;
    host: string;
    autoReconnect: boolean;
    reconnectInterval: number;
  };
  sandbox: {
    enabled: boolean;
    basePath: string;
    maxWorktrees: number;
    autoCleanup: boolean;
    cleanupAge: number;  // 天
  };
  permissions: {
    allowedPaths: string[];
    deniedPaths: string[];
    allowedCommands: string[];
    deniedCommands: string[];
  };
  agent: {
    defaultPrompt: string;
    systemPromptPath: string;
  };
}
```

**验证方式**:

```bash
# 单元测试
npm run test -- --grep "SettingsManager"

# 集成测试
npm run test:e2e -- --grep "settings-load"
```

**自动化验证脚本**:

```javascript
// tests/integration/settings-load.test.js
describe('Settings Manager', () => {
  it('should load settings from file', async () => {
    const manager = new SettingsManager('/path/to/config.json');
    const settings = await manager.load();
    assert(settings.trae !== undefined);
    assert(settings.sandbox !== undefined);
  });

  it('should merge with defaults', async () => {
    const manager = new SettingsManager('/nonexistent.json');
    const settings = await manager.load();
    assert(settings.trae.port === 9222);  // 默认值
  });

  it('should validate settings schema', async () => {
    const manager = new SettingsManager('/invalid.json');
    await assert.rejects(() => manager.load(), /validation/i);
  });

  it('should watch for settings changes', async () => {
    const manager = new SettingsManager('/path/to/config.json');
    await manager.load();
    await manager.watch();
    // 修改文件
    await fs.writeFile('/path/to/config.json', '{"trae": {"port": 9223}}');
    await sleep(100);
    assert(manager.getSettings().trae.port === 9223);
  });

  it('should support multiple config sources', async () => {
    const manager = new SettingsManager();
    // 模拟多层配置
    manager.addSource('user', { trae: { port: 9222 } });
    manager.addSource('project', { trae: { port: 9223 } });
    const settings = manager.getMergedSettings();
    // 项目配置应覆盖用户配置
    assert(settings.trae.port === 9223);
  });
});
```

***

#### Task 0.3: 权限系统初始化

**描述**: 初始化沙箱权限控制系统

**输入**:

- 权限配置
- 沙箱路径

**输出**:

- `PermissionManager` 类
- 权限检查接口

**权限检查逻辑**:

```typescript
interface PermissionManager {
  // 检查文件访问权限
  checkFileAccess(path: string, mode: 'read' | 'write'): PermissionResult;
  
  // 检查命令执行权限
  checkCommandExecution(command: string): PermissionResult;
  
  // 添加临时权限
  addTemporaryPermission(permission: PermissionRule): void;
  
  // 清除临时权限
  clearTemporaryPermissions(): void;
}
```

**验证方式**:

```bash
# 单元测试
npm run test -- --grep "PermissionManager"

# 集成测试
npm run test:e2e -- --grep "permission-init"
```

**自动化验证脚本**:

```javascript
// tests/integration/permission-init.test.js
describe('Permission Manager', () => {
  it('should initialize with default rules', async () => {
    const manager = new PermissionManager(sandboxPath);
    await manager.initialize();
    assert(manager.getRules().length > 0);
  });

  it('should allow access to sandbox paths', async () => {
    const manager = new PermissionManager(sandboxPath);
    await manager.initialize();
    const result = manager.checkFileAccess(`${sandboxPath}/test.txt`, 'write');
    assert(result.allowed === true);
  });

  it('should deny access outside sandbox', async () => {
    const manager = new PermissionManager(sandboxPath);
    await manager.initialize();
    const result = manager.checkFileAccess('/etc/passwd', 'read');
    assert(result.allowed === false);
  });

  it('should support temporary permissions', async () => {
    const manager = new PermissionManager(sandboxPath);
    await manager.initialize();
    manager.addTemporaryPermission({
      type: 'file',
      pattern: '/tmp/**',
      behavior: 'allow'
    });
    const result = manager.checkFileAccess('/tmp/test.txt', 'write');
    assert(result.allowed === true);
  });

  it('should support command whitelist', async () => {
    const manager = new PermissionManager(sandboxPath, {
      allowedCommands: ['git', 'npm', 'node']
    });
    await manager.initialize();
    
    assert(manager.checkCommandExecution('git status').allowed === true);
    assert(manager.checkCommandExecution('rm -rf /').allowed === false);
  });

  it('should support path pattern matching', async () => {
    const manager = new PermissionManager(sandboxPath);
    await manager.initialize();
    
    // 支持 glob 模式
    const result = manager.checkFileAccess(`${sandboxPath}/node_modules/test/index.js`, 'read');
    assert(result.allowed === true);
  });
});
```

***

### Phase 1.1: CDP 连接与任务列表获取 (预计 2 天)

#### Task 1.1.1: CDP 连接模块封装

**描述**: 封装 CDP 连接逻辑，提供统一的连接管理接口

**依赖**: Task 0.1 (预检检查)

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

  it('should emit connection state changes', async () => {
    const client = new CdpClient({ port: 9222 });
    const states = [];
    client.on('stateChange', (state) => states.push(state));
    
    await client.connect();
    await client.disconnect();
    
    assert(states.includes('connected'));
    assert(states.includes('disconnected'));
  });
});
```

***

#### Task 1.1.2: Trae 任务列表获取

**描述**: 通过 CDP 获取 Trae 中的任务列表 ID

**依赖**: Task 1.1.1 (CDP 连接)

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

  it('should cache task list for performance', async () => {
    const fetcher = new TaskListFetcher(cdpClient);
    await fetcher.fetchTasks();
    const start = Date.now();
    await fetcher.fetchTasks();
    const duration = Date.now() - start;
    // 缓存命中应该很快
    assert(duration < 100);
  });
});
```

***

#### Task 1.1.3: VS Code 配置页面 - 连接与任务显示

**描述**: 创建 VS Code Webview 页面，显示连接状态和任务列表

**依赖**: Task 1.1.2 (任务列表获取)

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

  it('should show preflight check results', async () => {
    const preflightResult = {
      traeConnection: { success: true },
      gitAvailable: { success: true },
      worktreeSupport: { success: true }
    };
    render(<ConfigPage preflightResult={preflightResult} />);
    
    const preflightSection = await screen.findByTestId('preflight-result');
    assert(preflightSection.textContent.includes('全部通过'));
  });
});
```

***

### Phase 1.2: Git Worktree 沙箱初始化 (预计 3 天)

#### Task 1.2.1: Worktree 管理器封装

**描述**: 封装 Git Worktree 操作，提供创建、切换、清理接口

**依赖**: Task 0.2 (设置加载), Task 0.3 (权限系统)

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

  it('should respect permission rules', async () => {
    const permissionManager = new PermissionManager(testRepo, {
      deniedPaths: ['/tmp/test-repo-worktree/protected/**']
    });
    await permissionManager.initialize();
    
    const manager = new WorktreeManager(testRepo, { permissionManager });
    const result = await manager.createWorktree({ name: 'test' });
    
    // 尝试在保护路径创建文件应该失败
    const writeResult = await manager.writeFileInWorktree(
      result.name,
      'protected/test.txt',
      'content'
    );
    assert(writeResult.success === false);
  });
});
```

***

#### Task 1.2.2: 沙箱隔离验证器

**描述**: 验证 Worktree 沙箱的文件隔离性

**依赖**: Task 1.2.1 (Worktree 管理), Task 0.3 (权限系统)

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

  it('should verify permission enforcement', async () => {
    const validator = new SandboxValidator(worktreePath, { permissionManager });
    const result = await validator.verifyPermissionEnforcement();
    
    assert(result.tests.deniedPathAccess === true);
    assert(result.tests.deniedCommandExecution === true);
  });
});
```

***

#### Task 1.2.3: VS Code 配置页面 - 沙箱初始化

**描述**: 在配置页面添加沙箱初始化功能

**依赖**: Task 1.2.2 (隔离验证器)

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

  it('should show settings summary before init', async () => {
    const settings = {
      sandbox: { basePath: '/tmp/sandbox', maxWorktrees: 5 }
    };
    render(<SandboxInitPanel settings={settings} />);
    
    const settingsSummary = await screen.findByTestId('settings-summary');
    assert(settingsSummary.textContent.includes('/tmp/sandbox'));
  });
});
```

***

### Phase 1.3: Trae 智能体创建与验证 (预计 3 天)

#### Task 1.3.1: Trae 智能体配置注入

**描述**: 通过 CDP 向 Trae 注入智能体配置

**依赖**: Task 0.2 (设置加载)

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

  it('should load system prompt from file', async () => {
    const injector = new AgentConfigInjector(cdpClient);
    const result = await injector.inject({
      name: 'File Prompt Agent',
      sandboxPath: '/tmp/sandbox',
      systemPromptPath: '/path/to/prompt.md'
    });
    
    assert(result.success === true);
  });
});
```

***

#### Task 1.3.2: 智能体沙箱工作验证

**描述**: 验证智能体是否在独立沙箱中工作

**依赖**: Task 1.3.1 (智能体配置注入), Task 0.3 (权限系统)

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

***

#### Task 1.3.3: VS Code 配置页面 - 完整流程集成

**描述**: 集成所有功能，实现完整的一键流程

**依赖**: Task 1.3.2 (智能体验证)

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
  it('should complete full workflow from preflight to verification', async () => {
    // 0. 打开配置页面
    await vscode.commands.executeCommand('caiode.openConfigPage');
    
    // 1. 预检检查
    await page.click('[data-testid="run-preflight-button"]');
    await page.waitForSelector('[data-testid="preflight-status"][data-status="passed"]');
    
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

  it('should show preflight failures before proceeding', async () => {
    // 模拟预检失败
    await mockPreflightFailure('git');
    
    await page.click('[data-testid="run-preflight-button"]');
    
    const preflightError = await page.$eval('[data-testid="preflight-error"]', el => el.textContent);
    assert(preflightError.includes('Git'));
    
    // 连接按钮应该被禁用
    const connectButton = await page.$('[data-testid="connect-button"]');
    assert(connectButton.disabled === true);
  });
});
```

***

## 3. 验收标准

### 3.1 功能验收

| 功能     | 验收标准                      | 自动化测试                                    |
| ------ | ------------------------- | ---------------------------------------- |
| 预检检查   | 能检查 Trae/Git/Worktree 可用性 | `test:e2e --grep "preflight"`            |
| 设置加载   | 能加载和合并配置                  | `test:e2e --grep "settings-load"`        |
| 权限初始化  | 能初始化权限规则                  | `test:e2e --grep "permission-init"`      |
| CDP 连接 | 能稳定连接 Trae 并自动重连          | `test:e2e --grep "cdp-connection"`       |
| 任务列表获取 | 能正确获取并显示任务列表              | `test:e2e --grep "task-list-fetch"`      |
| 任务绑定   | 用户可选择并绑定任务                | `test:e2e --grep "task-bind"`            |
| 沙箱初始化  | 能创建独立 Worktree            | `test:e2e --grep "worktree-lifecycle"`   |
| 隔离性验证  | 文件/分支隔离验证通过               | `test:e2e --grep "sandbox-isolation"`    |
| 智能体创建  | 能注入配置并创建智能体               | `test:e2e --grep "agent-config-inject"`  |
| 智能体验证  | 智能体在独立沙箱工作                | `test:e2e --grep "agent-sandbox-verify"` |

### 3.2 性能验收

| 指标          | 标准    | 验证方式     |
| ----------- | ----- | -------- |
| 预检检查        | < 3s  | 自动化测试计时  |
| 设置加载        | < 1s  | 自动化测试计时  |
| 权限初始化       | < 1s  | 自动化测试计时  |
| CDP 连接时间    | < 2s  | 自动化测试计时  |
| 任务列表获取      | < 1s  | 自动化测试计时  |
| Worktree 创建 | < 5s  | 自动化测试计时  |
| 隔离性验证       | < 10s | 自动化测试计时  |
| 完整流程        | < 60s | E2E 测试计时 |

### 3.3 可靠性验收

| 指标          | 标准          | 验证方式   |
| ----------- | ----------- | ------ |
| 预检失败处理      | 显示明确错误和解决建议 | 错误注入测试 |
| CDP 断线重连    | 自动重连成功      | 模拟断线测试 |
| Worktree 清理 | 无残留文件       | 清理后检查  |
| 错误恢复        | 优雅降级不崩溃     | 错误注入测试 |

***

## 4. 依赖关系

```
Phase 0 (初始化基础设施)
    │
    ├── Task 0.1 (预检检查)
    │
    ├── Task 0.2 (设置加载)
    │       │
    │       └── Task 0.3 (权限系统)
    │
    └───────────────────────┐
                            │
                            ▼
Phase 1.1 (CDP 连接)
    │
    ├── Task 1.1.1 (CDP 连接模块) ──→ 依赖 Task 0.1 (预检检查)
    │       │
    │       └── Task 1.1.2 (任务列表获取)
    │               │
    │               └── Task 1.1.3 (配置页面 - 连接)
    │
Phase 1.2 (沙箱初始化)
    │
    ├── Task 1.2.1 (Worktree 管理) ──→ 依赖 Task 0.2 (设置加载), Task 0.3 (权限系统)
    │       │
    │       └── Task 1.2.2 (隔离验证器)
    │               │
    │               └── Task 1.2.3 (配置页面 - 沙箱)
    │
Phase 1.3 (智能体创建)
    │
    ├── Task 1.3.1 (智能体配置注入) ──→ 依赖 Task 0.2 (设置加载)
    │       │
    │       └── Task 1.3.2 (智能体验证) ──→ 依赖 Task 0.3 (权限系统)
    │               │
    │               └── Task 1.3.3 (完整流程集成)
```

***

## 5. 风险评估

| 风险             | 可能性 | 影响 | 缓解措施           |
| -------------- | --- | -- | -------------- |
| Trae DOM 选择器变化 | 中   | 高  | 选择器配置化，版本适配    |
| CDP 连接不稳定      | 中   | 中  | 自动重连机制         |
| Worktree 权限问题  | 低   | 中  | 权限预检查          |
| 测试环境依赖         | 低   | 中  | Docker 容器化测试环境 |
| 配置文件格式变化       | 低   | 中  | Schema 验证和迁移   |
| 权限规则冲突         | 低   | 中  | 规则优先级和冲突检测     |

***

## 6. 评审清单

- [ ] 任务分解是否合理？
- [ ] 验证方式是否可自动化？
- [ ] 依赖关系是否清晰？
- [ ] 时间估算是否合理？
- [ ] 风险评估是否完整？
- [ ] Phase 0 任务是否必要？

***

## 7. 时间估算

| Phase                  | 预计时间     |
| ---------------------- | -------- |
| Phase 0: 初始化基础设施       | 2 天      |
| Phase 1.1: CDP 连接与任务列表 | 2 天      |
| Phase 1.2: 沙箱初始化       | 3 天      |
| Phase 1.3: 智能体创建与验证    | 3 天      |
| **总计**                 | **10 天** |

***

**下一步**: 请评审此计划，确认后开始实施。
