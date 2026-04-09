  });

  it('10 Agent 持续10分钟高并发无崩溃', async () => {
    // Arrange
    const results = {
      totalRequests: 0,
      successCount: 0,
      failCount: 0,
      errors: [] as Error[]
    };

    const startTime = Date.now();
    const endTime = startTime + TEST_DURATION;

    // Act: 10个Agent持续发送请求
    const agentPromises = Array.from({ length: AGENT_COUNT }, async (_, agentId) => {
      while (Date.now() < endTime) {
        try {
          results.totalRequests++;
          await queue.enqueue(`agent-${agentId}`, { prompt: `stress-test-${Date.now()}` });
          results.successCount++;
        } catch (error) {
          results.failCount++;
          results.errors.push(error as Error);
        }
      }
    });

    await Promise.all(agentPromises);

    // Assert 1: 零请求丢失（成功率100%）
    expect(results.failCount).toBe(0);
    expect(results.successCount).toBe(results.totalRequests);

    // Assert 2: 无未处理异常
    expect(results.errors).toHaveLength(0);
  }, TEST_DURATION + 60000);
});
```

#### 运行命令
```bash
npm run test:stress -- --grep "Queue Stability"
```

#### 通过标准
- [ ] 成功率100%
- [ ] Extension Host内存增长 < 20MB
- [ ] 无未处理异常

---

### TEST-1.2.2 手动验证：队列监控可观测性 `[MT]`

**对应DEV**: DEV-1.2.2 实现队列监控 Output Channel

#### 测试目的
验证队列监控Output Channel能够实时展示队列状态。

#### 前置条件
- 插件已激活
- 队列监控功能已实现

#### 测试步骤

**步骤1: 打开队列监控**
```bash
# 操作步骤
1. 按Cmd+Shift+P打开命令面板
2. 输入 "Caiode: Queue Monitor"
3. 选择该命令

# 预期结果
Output Channel打开，显示 "Caiode: Queue Monitor" 标签
```

**步骤2: 观察队列深度变化**
```bash
# 操作步骤
1. 触发3个并发请求（可通过命令或API）
2. 观察Output Channel中的输出

# 预期结果
1. 队列深度从3开始显示
2. 每处理完一个请求，深度减1
3. 最终深度降至0
```

**步骤3: 验证日志字段**
```bash
# 预期结果
每条日志包含：
- 时间戳
- 队列深度（Queue Depth）
- 当前处理请求的agentId
- 平均等待时间（Average Wait Time）
```

#### 通过标准
- [ ] 可打开Queue Monitor频道
- [ ] 队列深度实时更新
- [ ] 日志包含所有必要字段

---

## M1.3 并发文件锁

### TEST-1.3.1 PoC 跨进程互斥验证 `[IT]`

**对应DEV**: DEV-1.3.1 技术选型验证：OS 级文件锁 PoC

#### 测试文件
`test/integration/file-lock-poc.test.ts`

#### 测试代码
```typescript
import { describe, it, expect } from 'vitest';
import { spawn } from 'child_process';
import { writeFile, unlink } from 'fs/promises';
import { setTimeout } from 'timers/promises';
import * as lockfile from 'proper-lockfile';

describe('File Lock PoC', () => {
  const testFile = '/tmp/test-lock-poc.txt';

  it('Node.js持有锁时Python应阻塞等待', async () => {
    // Arrange
    await writeFile(testFile, 'test content');

    // Node.js获取锁
    const release = await lockfile.lock(testFile);

    // 启动Python进程尝试获取同一锁
    const pythonProcess = spawn('python3', ['-c', `
import fcntl
import os
import time

with open('${testFile}', 'r') as f:
    print("Python: Trying to acquire lock...")
    fcntl.flock(f.fileno(), fcntl.LOCK_EX)
    print("Python: Lock acquired!")
    time.sleep(1)
    print("Python: Releasing lock")
`], { stdio: 'pipe' });

    let pythonOutput = '';
    pythonProcess.stdout.on('data', (data) => {
      pythonOutput += data.toString();
    });

    // 等待1秒，Python应该还在等待
    await setTimeout(1000);
    expect(pythonOutput).toContain('Trying to acquire');
    expect(pythonOutput).not.toContain('Lock acquired');

    // Act: Node.js释放锁
    await release();

    // 等待Python完成
    await new Promise((resolve) => {
      pythonProcess.on('close', resolve);
    });

    // Assert
    expect(pythonOutput).toContain('Lock acquired');
    expect(pythonOutput).toContain('Releasing lock');

    // 清理
    await unlink(testFile);
  }, 10000);

  it('锁持有方崩溃后stale lock应自动释放', async () => {
    // Arrange
    await writeFile(testFile, 'test content');

    // 启动一个子进程获取锁然后崩溃
    const childProcess = spawn('node', ['-e', `
const lockfile = require('proper-lockfile');
lockfile.lock('${testFile}').then(() => {
  console.log('Lock acquired, pid:', process.pid);
  setTimeout(() => {
    process.exit(1);  // 模拟崩溃
  }, 1000);
});
`], { stdio: 'pipe' });

    let childPid = 0;
    childProcess.stdout.on('data', (data) => {
      const match = data.toString().match(/pid: (\d+)/);
      if (match) childPid = parseInt(match[1]);
    });

    // 等待子进程获取锁
    await setTimeout(2000);

    // Act: 尝试获取锁（应该因为stale lock检测而成功）
    const startTime = Date.now();
    const release = await lockfile.lock(testFile, {
      stale: 5000  // 5秒后视为stale
    });
    const elapsed = Date.now() - startTime;

    // Assert: 应该在10秒内成功（stale lock被清理）
    expect(elapsed).toBeLessThan(10000);
    expect(typeof release).toBe('function');

    // 清理
    await release();
    await unlink(testFile);
  }, 15000);
});
```

#### 运行命令
```bash
npm run test:integration -- --grep "File Lock PoC"
```

#### 通过标准
- [ ] Python在Node.js持锁时阻塞
- [ ] Node.js释放锁后Python成功获取
- [ ] stale lock在10秒内自动释放

---

### TEST-1.3.2a 单元测试：FileMutex 核心逻辑 `[UT]`

**对应DEV**: DEV-1.3.2 实现基于文件路径的跨进程 Mutex

#### 测试文件
`test/unit/file-mutex.test.ts`

#### 测试代码
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FileMutex, LockTimeoutError } from '../../src/core/file-mutex';
import { writeFile, unlink } from 'fs/promises';

describe('FileMutex', () => {
  let mutex: FileMutex;
  const testFiles = ['/tmp/test-mutex-a.txt', '/tmp/test-mutex-b.txt'];

  beforeEach(async () => {
    mutex = new FileMutex();
    for (const file of testFiles) {
      await writeFile(file, 'test');
    }
  });

  afterEach(async () => {
    for (const file of testFiles) {
      try {
        await unlink(file);
      } catch {}
    }
  });

  it('同一文件路径不允许并发持锁', async () => {
    // Arrange
    const release = await mutex.acquire(testFiles[0]);

    // Act & Assert
    const secondAcquire = mutex.acquire(testFiles[0], 500);
    await expect(secondAcquire).rejects.toThrow(LockTimeoutError);

    // Cleanup
    await release();
  });

  it('不同文件路径可以并发持锁', async () => {
    // Act
    const r1 = await mutex.acquire(testFiles[0]);
    const r2 = await mutex.acquire(testFiles[1]);

    // Assert
    expect(r1).toBeDefined();
    expect(r2).toBeDefined();
    expect(typeof r1).toBe('function');
    expect(typeof r2).toBe('function');

    // Cleanup
    await r1();
    await r2();
  });

  it('withLock 在 fn 抛出异常时应自动释放锁', async () => {
    // Act & Assert
    await expect(
      mutex.withLock(testFiles[0], async () => { 
        throw new Error('boom'); 
      })
    ).rejects.toThrow('boom');

    // 验证锁已释放
    const r = await mutex.acquire(testFiles[0], 500);
    expect(r).toBeDefined();
    await r();
  });

  it('应支持锁超时', async () => {
    // Arrange
    const release = await mutex.acquire(testFiles[0]);

    // Act & Assert
    const startTime = Date.now();
    await expect(
      mutex.acquire(testFiles[0], 1000)  // 1秒超时
    ).rejects.toThrow(LockTimeoutError);
    const elapsed = Date.now() - startTime;

    // 验证超时时间准确
    expect(elapsed).toBeGreaterThanOrEqual(1000);
    expect(elapsed).toBeLessThan(1500);

    // Cleanup
    await release();
  });

  it('应支持重入检测', async () => {
    // Arrange
    const release = await mutex.acquire(testFiles[0]);

    // Act & Assert: 同一进程再次获取锁应报错
    await expect(
      mutex.acquire(testFiles[0], 100)
    ).rejects.toThrow();

    // Cleanup
    await release();
  });

  it('释放锁后应允许重新获取', async () => {
    // Arrange
    const release1 = await mutex.acquire(testFiles[0]);
    await release1();

    // Act
    const release2 = await mutex.acquire(testFiles[0]);

    // Assert
    expect(release2).toBeDefined();
    await release2();
  });
});
```

#### 运行命令
```bash
npm run test -- --grep "FileMutex"
```

#### 通过标准
- [ ] 所有测试用例通过
- [ ] 覆盖率 > 85%

---

### TEST-1.3.2b 集成测试：Node.js + Python 跨进程文件写入 `[IT]`

**对应DEV**: DEV-1.3.2 实现基于文件路径的跨进程 Mutex

#### 测试文件
`test/integration/cross-process-write.test.ts`

#### 测试代码
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn } from 'child_process';
import { writeFile, readFile, unlink } from 'fs/promises';
import { FileMutex } from '../../src/core/file-mutex';

describe('Cross-Process File Write', () => {
  const sharedFile = '/tmp/shared-test.txt';
  let mutex: FileMutex;

  beforeAll(async () => {
    await writeFile(sharedFile, '');
    mutex = new FileMutex();
  });

  afterAll(async () => {
    try {
      await unlink(sharedFile);
    } catch {}
  });

  it('Node.js和Python交替写入不应产生数据损坏', async () => {
    // Arrange
    const writeCount = 50;

    // Node.js侧写入任务
    const nodeWrites = async () => {
      for (let i = 0; i < writeCount; i++) {
        await mutex.withLock(sharedFile, async () => {
          const content = await readFile(sharedFile, 'utf-8');
          await writeFile(sharedFile, content + `NODE-${i}\n`);
        });
      }
    };

    // Python侧写入任务
    const pythonWrites = async () => {
      const pythonProcess = spawn('python3', ['-c', `
import fcntl
import time

for i in range(${writeCount}):
    with open('${sharedFile}', 'r') as f:
        fcntl.flock(f.fileno(), fcntl.LOCK_EX)
        content = f.read()
    
    with open('${sharedFile}', 'w') as f:
        fcntl.flock(f.fileno(), fcntl.LOCK_EX)
        f.write(content + f'PYTHON-{i}\\n')
`], { stdio: 'pipe' });

      return new Promise((resolve, reject) => {
        pythonProcess.on('close', (code) => {
          if (code === 0) resolve(null);
          else reject(new Error(`Python exited with code ${code}`));
        });
      });
    };

    // Act: 同时启动Node.js和Python写入
    await Promise.all([nodeWrites(), pythonWrites()]);

    // Assert
    const finalContent = await readFile(sharedFile, 'utf-8');
    const lines = finalContent.trim().split('\n');

    // 验证总行数
    expect(lines.length).toBe(writeCount * 2);

    // 验证无内容损坏（每行应完整）
    lines.forEach(line => {
      expect(line).toMatch(/^(NODE|PYTHON)-\d+$/);
    });

    // 验证无重复或丢失
    const nodeLines = lines.filter(l => l.startsWith('NODE'));
    const pythonLines = lines.filter(l => l.startsWith('PYTHON'));
    expect(nodeLines.length).toBe(writeCount);
    expect(pythonLines.length).toBe(writeCount);
  }, 60000);
});
```

#### 运行命令
```bash
npm run test:integration -- --grep "Cross-Process File Write"
```

#### 通过标准
- [ ] 文件内容共100行
- [ ] 无内容交叉损坏
- [ ] Node.js和Python各50行

---

### TEST-1.3.2c 自动化测试：竞态条件检测 `[AT]`

**对应DEV**: DEV-1.3.2 实现基于文件路径的跨进程 Mutex

#### 测试文件
`test/stress/file-lock-race.test.ts`

#### 测试代码
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn } from 'child_process';
import { writeFile, readFile, unlink, readdir } from 'fs/promises';
import { setTimeout } from 'timers/promises';
import * as path from 'path';

describe('File Lock Race Condition', () => {
  const testDir = '/tmp/lock-race-test';
  const files = ['file1.txt', 'file2.txt', 'file3.txt'];

  beforeAll(async () => {
    // 创建测试文件
    for (const file of files) {
      await writeFile(path.join(testDir, file), '0');
    }
  });

  afterAll(async () => {
    // 清理
    const lockFiles = await readdir(testDir);
    for (const file of lockFiles) {
      if (file.endsWith('.lock')) {
        await unlink(path.join(testDir, file));
      }
    }
  });

  it('10个Node.js Worker + 5个Python进程竞争3个文件锁', async () => {
    // Arrange
    const testDuration = 5 * 60 * 1000; // 5分钟
    const nodeWorkers = 10;
    const pythonWorkers = 5;

    // 启动Node.js Workers
    const nodeProcesses = Array.from({ length: nodeWorkers }, (_, i) => {
      return spawn('node', ['-e', `
const lockfile = require('proper-lockfile');
const fs = require('fs').promises;
const path = require('path');

const files = ['file1.txt', 'file2.txt', 'file3.txt'].map(f => path.join('${testDir}', f));
const endTime = Date.now() + ${testDuration};

async function worker() {
  while (Date.now() < endTime) {
    const file = files[Math.floor(Math.random() * files.length)];
    try {
      const release = await lockfile.lock(file, { retries: 10 });
      const content = await fs.readFile(file, 'utf-8');
      const count = parseInt(content) + 1;
      await fs.writeFile(file, count.toString());
      await release();
    } catch (e) {
      console.error('Node worker error:', e);
      process.exit(1);
    }
  }
}

worker();
`], { stdio: 'pipe' });
    });

    // 启动Python Workers
    const pythonProcesses = Array.from({ length: pythonWorkers }, () => {
      return spawn('python3', ['-c', `
import fcntl
import os
import random
import time

files = ['${testDir}/file1.txt', '${testDir}/file2.txt', '${testDir}/file3.txt']
end_time = time.time() + ${testDuration / 1000}

while time.time() < end_time:
    file_path = random.choice(files)
    try:
        with open(file_path, 'r+') as f:
            fcntl.flock(f.fileno(), fcntl.LOCK_EX)
            content = f.read().strip()
            count = int(content) + 1
            f.seek(0)
            f.write(str(count))
            f.truncate()
    except Exception as e:
        print(f"Python worker error: {e}")
        exit(1)
`], { stdio: 'pipe' });
    });

    // Act: 等待所有进程完成
    const allProcesses = [...nodeProcesses, ...pythonProcesses];
    const exitCodes = await Promise.all(
      allProcesses.map(p => new Promise((resolve) => {
        p.on('close', resolve);
      }))
    );

    // Assert 1: 零崩溃
    expect(exitCodes.every(code => code === 0)).toBe(true);

    // Assert 2: 数据一致性
    for (const file of files) {
      const content = await readFile(path.join(testDir, file), 'utf-8');
      const finalCount = parseInt(content);
      expect(finalCount).toBeGreaterThan(0);
    }

    // Assert 3: 无stale lock残留
    await setTimeout(5000); // 等待清理
    const lockFiles = await readdir(testDir);
    const staleLocks = lockFiles.filter(f => f.endsWith('.lock'));
    expect(staleLocks).toHaveLength(0);
  }, 400000);
});
```

#### 运行命令
```bash
npm run test:stress -- --grep "File Lock Race"
```

#### 通过标准
- [ ] 零进程崩溃
- [ ] 数据无损坏
- [ ] 无stale lock残留

---

## M1.4 插件配置页面与打包

### TEST-1.4.1 集成测试：配置项热更新 `[IT]`

**对应DEV**: DEV-1.4.1 实现插件配置页面（Settings UI）

#### 测试文件
`test/integration/config-hot-reload.test.ts`

#### 测试代码
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as vscode from 'vscode';
import { GlobalModelRequestQueue } from '../../src/core/global-model-request-queue';

describe('Config Hot Reload', () => {
  let queue: GlobalModelRequestQueue;

  beforeAll(() => {
    const mockLLMClient = {
      request: async () => {
        await new Promise(resolve => setTimeout(resolve, 8000)); // 8秒延迟
        return { text: 'response' };
      }
    };
    queue = new GlobalModelRequestQueue(mockLLMClient);
  });

  afterAll(() => {
    queue.dispose();
  });

  it('修改 timeout 配置后应实时生效', async () => {
    // Arrange: 获取配置
    const config = vscode.workspace.getConfiguration('caiode');
    const originalTimeout = config.get<number>('queue.timeout');

    // Act: 修改timeout为5000ms
    await config.update('queue.timeout', 5000, true);

    // 发起一个预期8秒完成的请求
    const startTime = Date.now();
    let error: Error | null = null;

    try {
      await queue.enqueue('test-agent', { prompt: 'test' });
    } catch (e) {
      error = e as Error;
    }

    const elapsed = Date.now() - startTime;

    // Assert: 请求应在~5秒后超时
    expect(error).not.toBeNull();
    expect(error?.message).toContain('timeout');
    expect(elapsed).toBeGreaterThanOrEqual(4500);
    expect(elapsed).toBeLessThan(6000);

    // Cleanup: 恢复默认值
    await config.update('queue.timeout', originalTimeout, true);
  }, 20000);
});
```

#### 运行命令
```bash
npm run test:integration -- --grep "Config Hot Reload"
```

#### 通过标准
- [ ] 配置修改后实时生效
- [ ] 请求按新timeout值超时

---

### TEST-1.4.2 手动验证：离线安装与功能验收 `[MT]`

**对应DEV**: DEV-1.4.2 打包 .vsix 安装包

#### 测试目的
验证.vsix包可在离线环境安装且功能完整。

#### 前置条件
- 已生成.vsix文件
- 干净的VS Code实例（从未安装过该插件）

#### 测试步骤

**步骤1: 离线安装**
```bash
# 操作步骤
1. 在干净的VS Code实例中
2. 打开Extensions面板
3. 点击 "..." 菜单，选择 "Install from VSIX"
4. 选择生成的 .vsix 文件

# 预期结果
插件成功安装，显示在已安装列表中
```

**步骤2: 验证命令可访问**
```bash
# 操作步骤
1. 按Cmd+Shift+P打开命令面板
2. 输入 "Caiode"

# 预期结果
所有命令均可正常访问：
- Caiode: Queue Monitor
- Caiode: Show Settings
```

**步骤3: 验证队列功能**
```bash
# 操作步骤
1. 启动5个mock Agent
2. 同时发起请求
3. 观察Queue Monitor

# 预期结果
- 队列严格串行工作
- Output Channel有正常日志
```

#### 通过标准
- [ ] 离线安装成功
- [ ] 所有命令可访问
- [ ] 队列功能正常

---

### TEST-1.4.3 自动化回归测试套件 `[AT]`

**对应DEV**: DEV-1.4.3 自动化回归测试套件

#### 测试文件
`test/e2e/regression.test.ts`

#### 测试代码
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as vscode from 'vscode';
import { GlobalModelRequestQueue } from '../../src/core/global-model-request-queue';
import { FileMutex } from '../../src/core/file-mutex';
import { ProcessGuardian } from '../../src/core/process-guardian';

describe('E2E Regression Test Suite', () => {
  it('插件激活后 Extension Host 内存 < 150MB', async () => {
    // 获取Extension Host内存
    const extensions = await vscode.commands.executeCommand<
      { id: string; heapUsed: number }[]
    >('workbench.extensions.getRunning');

    const caiodeExt = extensions.find(e => e.id.includes('caiode'));
    expect(caiodeExt).toBeDefined();
    expect(caiodeExt!.heapUsed).toBeLessThan(150 * 1024 * 1024); // 150MB
  });

  it('10 个并发 LLM 请求严格串行执行', async () => {
    const executionOrder: number[] = [];
    let callCount = 0;

    const mockLLMClient = {
      request: async () => {
        const current = callCount++;
        executionOrder.push(current);
        await new Promise(resolve => setTimeout(resolve, 50));
        return { text: `response-${current}` };
      }
    };

    const queue = new GlobalModelRequestQueue(mockLLMClient);

    const requests = Array.from({ length: 10 }, (_, i) =>
      queue.enqueue(`agent-${i}`, { prompt: `test-${i}` })
    );

    await Promise.all(requests);

    expect(executionOrder).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

    queue.dispose();
  });

  it('跨进程文件锁无数据损坏', async () => {
    const mutex = new FileMutex();
    const testFile = '/tmp/e2e-lock-test.txt';

    await vscode.workspace.fs.writeFile(
      vscode.Uri.file(testFile),
      Buffer.from('0')
    );

    // 并发写入
    const writers = Array.from({ length: 10 }, async (_, i) => {
      for (let j = 0; j < 10; j++) {
        await mutex.withLock(testFile, async () => {
          const content = await vscode.workspace.fs.readFile(
            vscode.Uri.file(testFile)
          );
          const count = parseInt(content.toString()) + 1;
          await vscode.workspace.fs.writeFile(
            vscode.Uri.file(testFile),
            Buffer.from(count.toString())
          );
        });
      }
    });

    await Promise.all(writers);

    const finalContent = await vscode.workspace.fs.readFile(
      vscode.Uri.file(testFile)
    );
    expect(parseInt(finalContent.toString())).toBe(100);

    await vscode.workspace.fs.delete(vscode.Uri.file(testFile));
  });

  it('子进程崩溃后 15s 内被清理', async () => {
    const guardian = new ProcessGuardian({
      heartbeatInterval: 1000,
      maxMisses: 3
    });

    // 启动mock子进程
    const { spawn } = require('child_process');
    const child = spawn('node', ['-e', 'setInterval(() => {}, 1000)']);

    guardian.startHeartbeat(child.pid);

    // 模拟崩溃
    child.kill('SIGKILL');

    // 等待15秒
    await new Promise(resolve => setTimeout(resolve, 15000));

    // 验证子进程已不存在
    const { execSync } = require('child_process');
    const psOutput = execSync('ps aux').toString();
    expect(psOutput.includes(child.pid.toString())).toBe(false);

    guardian.dispose();
  }, 30000);

  it('配置项修改后行为实时生效', async () => {
    const config = vscode.workspace.getConfiguration('caiode');
    const originalValue = config.get<number>('queue.timeout');

    // 修改配置
    await config.update('queue.timeout', 1000, true);

    // 验证新值
    const newValue = config.get<number>('queue.timeout');
    expect(newValue).toBe(1000);

    // 恢复
    await config.update('queue.timeout', originalValue, true);
  });
});
```

#### 运行命令
```bash
npm run test:e2e
```

#### 通过标准
- [ ] 全部5个用例通过
- [ ] CI耗时 < 5分钟

---

## 质量门禁检查表

### Phase 1 Exit Criteria

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

## 附录

### 测试运行命令汇总

```bash
# 单元测试
npm run test

# 集成测试
npm run test:integration

# 压力测试
npm run test:stress

# E2E测试
npm run test:e2e

# 全部测试
npm run test:all

# 覆盖率报告
npm run coverage
```

### 测试文件目录结构

```
test/
├── unit/                    # 单元测试
│   ├── extension.lifecycle.test.ts
│   ├── process-guardian.test.ts
│   ├── global-model-request-queue.test.ts
│   └── file-mutex.test.ts
├── integration/             # 集成测试
│   ├── process-cleanup.test.ts
│   ├── multi-agent-queue.test.ts
│   ├── file-lock-poc.test.ts
│   ├── cross-process-write.test.ts
│   └── config-hot-reload.test.ts
├── stress/                  # 压力测试
│   ├── queue-stability.test.ts
│   └── file-lock-race.test.ts
└── e2e/                     # E2E测试
    └── regression.test.ts
```

---

**文档完成时间**: 2026-04-09  
**生成人**: Kimi-K2.5  
**署名**: k25
