# VS Code 插件与 OpenCode 二次开发 UI 调试功能自动化测试方案

## 1. 测试目标

- **验证 VS Code 插件的 UI 功能**：确保插件的 Web 视图、命令面板、设置页面等 UI 元素正常工作
- **验证 OpenCode 二次开发组件**：确保迁移到 OpenCode 的扩展组件功能正常
- **验证集成功能**：确保 VS Code 插件与 OpenCode 之间的集成正常
- **自动化 UI 调试**：提供自动化的 UI 调试功能，简化开发和测试流程

## 2. 测试框架与工具

### 2.1 核心测试框架

| 工具 | 用途 | 适用场景 |
|------|------|----------|
| Vitest | 单元测试和集成测试 | VS Code 插件核心功能测试 |
| Playwright | E2E 测试 | UI 功能测试、跨浏览器测试 |
| Mocha + Chai | 传统测试框架 | 补充测试场景 |
| Jest | 快照测试 | UI 组件快照对比 |

### 2.2 辅助工具

| 工具 | 用途 |
|------|------|
| VS Code Test API | VS Code 插件测试环境 |
| Puppeteer | 浏览器自动化 |
| Storybook | UI 组件开发和测试 |
| Cypress | 端到端测试 |
| Allure Report | 测试报告生成 |

## 3. 测试策略

### 3.1 VS Code 插件测试策略

#### 单元测试
- **核心服务测试**：测试队列、进程守护、文件锁等核心服务
- **API 测试**：测试插件 API 的功能和性能
- **命令测试**：测试命令面板命令的执行

#### 集成测试
- **Web 视图集成**：测试 Web 视图与插件后端的集成
- **设置页面测试**：测试设置页面的功能和持久化
- **命令集成**：测试命令与其他功能的集成

#### E2E 测试
- **完整功能路径测试**：测试从安装到使用的完整流程
- **跨版本兼容性测试**：测试不同 VS Code 版本的兼容性
- **跨平台测试**：测试不同操作系统的兼容性

### 3.2 OpenCode 二次开发测试策略

#### 组件测试
- **扩展组件测试**：测试迁移到 OpenCode 的扩展组件
- **主题系统测试**：测试主题切换和定制功能
- **设置系统测试**：测试设置的保存和加载

#### 集成测试
- **扩展系统集成**：测试扩展与 OpenCode 核心的集成
- **API 集成**：测试扩展与 OpenCode API 的集成
- **UI 集成**：测试扩展 UI 与 OpenCode 界面的集成

#### E2E 测试
- **完整功能路径测试**：测试扩展的完整使用流程
- **跨环境测试**：测试 Web、桌面环境的兼容性
- **性能测试**：测试扩展的性能表现

### 3.3 集成测试策略

- **VS Code 插件与 OpenCode 集成测试**：测试两者之间的通信和数据同步
- **功能一致性测试**：确保相同功能在两个环境中表现一致
- **数据同步测试**：测试配置、状态等数据的同步

## 4. 自动化测试实现方案

### 4.1 测试目录结构

```
tests/
├── unit/              # 单元测试
│   ├── vscode/        # VS Code 插件单元测试
│   └── opencode/      # OpenCode 扩展单元测试
├── integration/       # 集成测试
│   ├── vscode/        # VS Code 插件集成测试
│   ├── opencode/      # OpenCode 扩展集成测试
│   └── integration/   # 两者集成测试
├── e2e/              # E2E 测试
│   ├── vscode/        # VS Code 插件 E2E 测试
│   ├── opencode/      # OpenCode 扩展 E2E 测试
│   └── integration/   # 两者集成 E2E 测试
├── fixtures/          # 测试 fixtures
└── utils/             # 测试工具函数
```

### 4.2 测试配置

**Vitest 配置** (`vitest.config.ts`)：

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/__tests__/**', 'src/types/**'],
    },
  },
});
```

**Playwright 配置** (`playwright.config.ts`)：

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: true,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
```

### 4.3 自动化测试脚本

**package.json 脚本**：

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:debug": "playwright test --debug",
    "test:integration": "vitest run tests/integration",
    "test:ui": "vitest --ui",
    "lint": "eslint src --ext .ts,.tsx",
    "build": "tsc --noEmit",
    "typecheck": "tsc --noEmit"
  }
}
```

## 5. UI 调试功能自动化

### 5.1 VS Code 插件 UI 调试

#### 调试配置 (`launch.json`)：

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Extension",
      "type": "extensionHost",
      "request": "launch",
      "runtimeExecutable": "${execPath}",
      "args": [
        "--extensionDevelopmentPath=${workspaceFolder}"
      ],
      "outFiles": [
        "${workspaceFolder}/dist/**/*.js"
      ],
      "preLaunchTask": "npm: watch"
    },
    {
      "name": "Extension Tests",
      "type": "extensionHost",
      "request": "launch",
      "runtimeExecutable": "${execPath}",
      "args": [
        "--extensionDevelopmentPath=${workspaceFolder}",
        "--extensionTestsPath=${workspaceFolder}/dist/__tests__"
      ],
      "outFiles": [
        "${workspaceFolder}/dist/**/*.js"
      ],
      "preLaunchTask": "npm: build:dev"
    }
  ]
}
```

#### 自动化调试脚本：

```typescript
// scripts/debug-vscode-plugin.ts
import { execSync } from 'child_process';

async function debugVSCodePlugin() {
  console.log('Starting VS Code plugin debug session...');
  
  try {
    // Build the plugin
    execSync('npm run build:dev', { stdio: 'inherit' });
    
    // Start the debug session
    console.log('VS Code plugin debug session started.');
    console.log('Open VS Code and attach to the debug session.');
    
  } catch (error) {
    console.error('Error starting debug session:', error);
  }
}

debugVSCodePlugin();
```

### 5.2 OpenCode 二次开发 UI 调试

#### 调试配置：

**Vite 配置** (`vite.config.ts`)：

```typescript
import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';

export default defineConfig({
  plugins: [solid()],
  server: {
    port: 3000,
    open: true,
    watch: {
      usePolling: true,
    },
  },
  build: {
    target: 'esnext',
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
  },
});
```

#### 自动化调试脚本：

```typescript
// scripts/debug-opencode-extension.ts
import { execSync } from 'child_process';

async function debugOpenCodeExtension() {
  console.log('Starting OpenCode extension debug session...');
  
  try {
    // Start the development server
    execSync('npm run dev', { stdio: 'inherit' });
    
  } catch (error) {
    console.error('Error starting debug session:', error);
  }
}

debugOpenCodeExtension();
```

### 5.3 集成调试

#### 自动化集成调试脚本：

```typescript
// scripts/debug-integration.ts
import { execSync } from 'child_process';

async function debugIntegration() {
  console.log('Starting integration debug session...');
  
  try {
    // Build VS Code plugin
    execSync('npm run build:dev', { stdio: 'inherit', cwd: './caiode/vscode-extension' });
    
    // Start OpenCode development server
    execSync('npm run dev', { stdio: 'inherit', cwd: './caiode/opencode' });
    
    console.log('Integration debug session started.');
    console.log('Open VS Code and attach to the debug session.');
    console.log('Open browser at http://localhost:3000 to access OpenCode.');
    
  } catch (error) {
    console.error('Error starting integration debug session:', error);
  }
}

debugIntegration();
```

## 6. 测试用例设计

### 6.1 VS Code 插件测试用例

| 测试用例 ID | 测试功能 | 测试步骤 | 预期结果 |
|------------|---------|---------|----------|
| TC-VS-UI-001 | 聊天面板显示 | 1. 打开 VS Code<br>2. 激活 StoryTree 插件<br>3. 打开聊天面板 | 聊天面板正常显示，可输入消息 |
| TC-VS-UI-002 | 设置页面功能 | 1. 打开 VS Code<br>2. 打开 StoryTree 设置<br>3. 修改设置项 | 设置项保存成功，重启后生效 |
| TC-VS-UI-003 | 命令面板命令 | 1. 打开 VS Code<br>2. 打开命令面板<br>3. 执行 StoryTree 命令 | 命令执行成功，功能正常 |
| TC-VS-UI-004 | 主题切换 | 1. 打开 VS Code<br>2. 打开 StoryTree 设置<br>3. 切换主题 | 主题切换成功，UI 样式改变 |
| TC-VS-UI-005 | API Key 配置 | 1. 打开 VS Code<br>2. 打开 StoryTree 设置<br>3. 输入 API Key | API Key 保存成功，加密存储 |

### 6.2 OpenCode 扩展测试用例

| 测试用例 ID | 测试功能 | 测试步骤 | 预期结果 |
|------------|---------|---------|----------|
| TC-OC-UI-001 | 扩展加载 | 1. 启动 OpenCode<br>2. 安装 StoryTree 扩展<br>3. 激活扩展 | 扩展加载成功，显示在扩展列表 |
| TC-OC-UI-002 | 聊天组件功能 | 1. 启动 OpenCode<br>2. 打开 StoryTree 扩展<br>3. 使用聊天功能 | 聊天功能正常，可发送和接收消息 |
| TC-OC-UI-003 | 主题系统集成 | 1. 启动 OpenCode<br>2. 打开 StoryTree 扩展<br>3. 切换主题 | 主题切换成功，扩展 UI 跟随主题变化 |
| TC-OC-UI-004 | 设置系统集成 | 1. 启动 OpenCode<br>2. 打开 StoryTree 扩展设置<br>3. 修改设置项 | 设置项保存成功，实时生效 |
| TC-OC-UI-005 | 性能测试 | 1. 启动 OpenCode<br>2. 打开 StoryTree 扩展<br>3. 执行大量操作 | 扩展响应速度快，无卡顿 |

### 6.3 集成测试用例

| 测试用例 ID | 测试功能 | 测试步骤 | 预期结果 |
|------------|---------|---------|----------|
| TC-INT-001 | 配置同步 | 1. 在 VS Code 中修改设置<br>2. 打开 OpenCode<br>3. 检查设置是否同步 | 设置同步成功，两边保持一致 |
| TC-INT-002 | 数据同步 | 1. 在 VS Code 中创建项目<br>2. 打开 OpenCode<br>3. 检查项目是否同步 | 项目同步成功，两边都能看到 |
| TC-INT-003 | 功能一致性 | 1. 在 VS Code 中执行操作<br>2. 在 OpenCode 中执行相同操作<br>3. 比较结果 | 操作结果一致，功能表现相同 |
| TC-INT-004 | 错误处理 | 1. 模拟错误场景<br>2. 检查 VS Code 和 OpenCode 的错误处理 | 错误处理一致，用户体验相同 |
| TC-INT-005 | 性能比较 | 1. 在 VS Code 中执行性能测试<br>2. 在 OpenCode 中执行相同测试<br>3. 比较性能数据 | 性能表现相近，无明显差异 |

## 7. 自动化测试流程

### 7.1 本地开发测试流程

1. **启动开发环境**：
   - VS Code 插件：`npm run watch`
   - OpenCode 扩展：`npm run dev`

2. **运行单元测试**：
   ```bash
   npm run test
   ```

3. **运行集成测试**：
   ```bash
   npm run test:integration
   ```

4. **运行 E2E 测试**：
   ```bash
   npm run test:e2e
   ```

5. **调试 UI 功能**：
   - VS Code 插件：使用 VS Code 调试器
   - OpenCode 扩展：访问 http://localhost:3000

### 7.2 CI/CD 测试流程

**GitHub Actions 配置**：

```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test
      - run: npm run test:coverage

  e2e:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build:prod
      - run: npm run test:e2e

  integration:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build:prod
      - run: npm run test:integration
```

## 8. 技术挑战与解决方案

### 8.1 技术挑战

1. **环境差异**：
   - VS Code 插件运行在 Node.js 环境
   - OpenCode 运行在浏览器/桌面环境
   - 测试环境配置复杂

2. **UI 测试复杂性**：
   - Web 视图测试需要特殊处理
   - 跨环境 UI 测试困难
   - 异步操作测试复杂

3. **集成测试挑战**：
   - 两个系统之间的通信测试
   - 数据同步测试
   - 功能一致性验证

4. **调试工具集成**：
   - VS Code 调试器与 OpenCode 调试的集成
   - 跨环境调试
   - 日志和错误跟踪

### 8.2 解决方案

1. **环境适配**：
   - 使用条件测试配置
   - 模拟环境差异
   - 统一测试接口

2. **UI 测试解决方案**：
   - 使用 Playwright 进行跨环境 UI 测试
   - 统一测试选择器和断言
   - 使用快照测试确保 UI 一致性

3. **集成测试解决方案**：
   - 创建集成测试环境
   - 模拟通信和数据同步
   - 编写端到端集成测试

4. **调试工具集成**：
   - 配置统一的调试环境
   - 集成日志系统
   - 提供调试辅助工具

## 9. 预期成果

### 9.1 测试覆盖

- ✅ 单元测试覆盖率 > 85%
- ✅ 集成测试覆盖率 > 70%
- ✅ E2E 测试覆盖主要功能路径
- ✅ UI 测试覆盖所有关键 UI 组件

### 9.2 自动化程度

- ✅ 本地开发测试自动化
- ✅ CI/CD 测试自动化
- ✅ UI 调试功能自动化
- ✅ 测试报告自动化生成

### 9.3 质量保证

- ✅ 早期发现 UI 问题
- ✅ 确保功能一致性
- ✅ 提高代码质量
- ✅ 减少回归 bug

## 10. 实施时间线

| 阶段 | 任务 | 时间 |
|------|------|------|
| 阶段 1 | 测试框架搭建 | 2 天 |
| 阶段 2 | 单元测试编写 | 3 天 |
| 阶段 3 | 集成测试编写 | 2 天 |
| 阶段 4 | E2E 测试编写 | 3 天 |
| 阶段 5 | 调试功能实现 | 2 天 |
| 阶段 6 | CI/CD 配置 | 1 天 |
| 阶段 7 | 测试运行和优化 | 2 天 |
| **总计** | | **15 天** |

## 11. 结论

通过以上方案，我们可以实现 VS Code 插件和 OpenCode 二次开发 UI 调试功能的自动化测试。这将有助于：

1. **提高代码质量**：通过全面的测试覆盖，确保功能的正确性和稳定性
2. **加速开发流程**：通过自动化测试和调试，减少手动测试的时间和成本
3. **确保功能一致性**：确保相同功能在 VS Code 和 OpenCode 环境中表现一致
4. **简化调试过程**：提供自动化的 UI 调试功能，简化开发和测试流程

**推荐方案**：采用 Playwright + Vitest 的测试框架组合，结合 CI/CD 自动化测试，实现全面的测试覆盖和自动化调试功能。通过分阶段实施，可以确保测试系统的顺利搭建和有效运行。

[READY_FOR_REVIEW]