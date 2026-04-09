# StoryTree VS Code Extension - 安装与调试指南

**版本**: v1.0.0-alpha
**包名**: storytree-vscode-1.0.0.vsix
**大小**: 238.42 KB
**生成时间**: 2026-04-08 19:50:00

***

## 📦 一、安装指南

### 方法 1: 从 VSIX 文件安装（推荐）

#### 步骤 1: 打开 VS Code

启动 Visual Studio Code 编辑器。

#### 步骤 2: 进入扩展管理界面

使用以下任一方式：

**方式 A - 快捷键**:

```
⌘ + Shift + X (macOS)
Ctrl + Shift + X (Windows/Linux)
```

**方式 B - 菜单栏**:

```
View → Extensions (查看 → 扩展)
```

**方式 C - 命令面板**:

```
1. 按 ⌘/Ctrl + Shift + P 打开命令面板
2. 输入 "Extensions: Install from VSIX..."
3. 回车执行
```

#### 步骤 3: 选择 VSIX 文件

在弹出的文件选择对话框中：

```bash
导航到:
/Users/mac/StudioProjects/storytree2/caiode/vscode-extension/storytree-vscode-1.0.0.vsix
```

或者直接拖拽文件到 VS Code 窗口。

#### 步骤 4: 确认安装

VS Code 会显示确认对话框：

```
"Install extension 'storytree-vscode'?"
```

点击 **"Install"** 按钮。

#### 步骤 5: 验证安装

安装完成后：

1. **左侧边栏** 应该出现 **StoryTree 图标** 🌳
2. **状态栏** 显示扩展已激活
3. **输出面板** (Output) 选择 "StoryTree" 查看日志

***

### 方法 2: 命令行安装

```bash
# 使用 code 命令行工具安装
code --install-extension /Users/mac/StudioProjects/storytree2/caiode/vscode-extension/storytree-vscode-1.0.0.vsix

# 输出示例:
# Installing extension 'caiode.storytree-vscode'...
# Extension 'caicode.storytree-vscode' v1.0.0 was successfully installed.
```

### 方法 3: 开发模式安装（开发者专用）

如果你需要**实时修改代码并立即看到效果**：

```bash
# 1. 克隆项目到本地
cd /path/to/extensions
git clone <repository-url> storytree-vscode

# 2. 安装依赖
cd storytree-vscode/caiode/vscode-extension
npm install

# 3. 以开发模式链接到 VS Code
code --extensionDevelopmentPath=/path/to/storytree-vscode/caiode/vscode-extension
```

**优点**:

- ✅ 修改源码后按 F5 即可重新加载
- ✅ 自动热重载（如果配置了 watch 模式）
- ✅ 完整的调试能力

***

## 🔧 二、调试指南

### 方式 A: 使用 VS Code 内置调试器（推荐）

#### 1. 配置 Launch 配置

在项目根目录创建 `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Run Extension",
      "type": "extensionHost",
      "request": "launch",
      "args": [
        "--extensionDevelopmentPath=${workspaceFolder}/caiode/vscode-extension"
      ],
      "outFiles": [
        "${workspaceFolder}/caiode/vscode-extension/dist/**/*.js"
      ],
      "preLaunchTask": "npm: dev"
    }
  ]
}
```

#### 2. 启动调试会话

**步骤**:

1. 打开 [launch.json](file:///Users/mac/StudioProjects/storytree2/.vscode/launch.json)
2. 按 **F5** 或点击运行按钮
3. VS Code 会打开一个新的 **Extension Development Host** 窗口
4. 在新窗口中测试 StoryTree 功能

#### 3. 设置断点

在你的源代码中设置断点：

```typescript
// src/extension.ts
export function activate(context: vscode.ExtensionContext): void {
  console.log('StoryTree extension is now active!'); // ← 在这里设置断点
  // ...
}
```

当执行到断点时，调试器会暂停，你可以：

- 查看变量值
- 单步执行代码
- 调用堆栈检查
- 表达式求值

***

### 方式 B: 使用 Console 日志

#### 1. 查看输出日志

在 VS Code 中：

1. 打开 **Output** 面板 (`⌘/Ctrl + Shift + U`)
2. 在下拉菜单中选择 **"StoryTree"**
3. 查看 `console.log()` 输出

#### 2. 添加调试日志

```typescript
// 在你的代码中添加
console.log("[StoryTree] Debug: 变量值 =", someVariable);
console.error("[StoryTree] Error: 错误详情", error);
console.warn("[StoryTree] Warning: 警告信息");
```

***

### 方式 C: 使用 Developer Tools (Webview 调试)

StoryTree 的 AI 对话面板等 Webview 组件需要用浏览器 DevTools 调试。

#### 1. 打开 Webview 开发者工具

在 **Extension Development Host** 窗口中：

1. 打开 StoryTree 的 Webview 面板（如 AI Chat）
2. 按 **`⌘/Ctrl + Shift + I`** (或右键 → Inspect Element)
3. 这会打开 Chrome DevTools

#### 2. 调试 Webview 内容

在 DevTools 中可以：

- 检查 HTML/CSS 结构
- 查看 Console 错误
- Network 请求监控
- Performance 分析

***

### 方式 D: 运行单元测试

#### 1. 运行所有测试

```bash
cd caiode/vscode-extension
npm run test
```

#### 2. 运行特定测试文件

```bash
# 只运行 ai-chat-panel 测试
npx vitest run src/__tests__/ai-chat-panel.test.ts

# 只运行 Provider 测试
npx vitest run src/__tests__/anthropic-provider.test.ts
```

#### 3. 测试覆盖率报告

```bash
npm run test:coverage
# 报告会输出到 coverage/ 目录
```

***

## 🐛 三、常见问题排查

### 问题 1: 扩展未激活

**症状**: 左侧没有 StoryTree 图标，命令面板找不到 StoryTree 命令

**排查步骤**:

1. **检查扩展是否启用**:
   ```
   ⌘/Ctrl + Shift + X → 搜索 "storytree" → 确认已启用 ✓
   ```
2. **查看激活条件**:
   ```json
   // package.json 中的 activationEvents
   "activationEvents": [
     "onStartupFinished"
   ]
   ```
   StoryTree 应该在 VS Code 启动后自动激活。
3. **检查依赖是否安装**:
   ```bash
   cd caiode/vscode-extension
   npm ls better-sqlite3
   # 如果缺失，运行: npm install
   ```
4. **查看详细错误日志**:
   ```
   View → Output → 选择 "Extension Host"
   ```

***

### 问题 2: 数据库初始化失败

**症状**: 控制台报错 `Cannot find module 'better-sqlite3'`

**解决方案**:

```bash
# 1. 安装原生模块
cd caiode/vscode-extension
npm install better-sqlite3

# 2. 如果是 ARM Mac (M1/M2)，可能需要 rebuild
npm rebuild better-sqlite3

# 3. 清理并重装
rm -rf node_modules package-lock.json
npm install
```

***

### 问题 3: Webview 页面空白

**症状**: 点击 AI Chat 或 Workbench 后页面空白

**排查**:

1. **检查 CSP (Content Security Policy)**:
   ```typescript
   // 确认 webview 中使用了 nonce
   webview.html = getHtmlContent({ nonce });
   ```
2. **检查资源路径**:
   ```typescript
   // 确保 webview URI 正确
   const uri = webview.asWebviewUri(vscode.Uri.file(path));
   ```
3. **打开 DevTools 检查错误**:
   - 在 Webview 中按 `⌘/Ctrl + Shift + I`
   - 查看 Console 中的红色错误信息

***

### 问题 4: AI 功能无法使用

**症状**: 发送消息给 AI 无响应或报错

**排查**:

1. **检查 API Key 配置**:
   ```bash
   # 打开设置
   ⌘/Ctrl + , → 搜索 "storytree.apiKey"

   # 或者在命令面板中
   > StoryTree: Configure API Key
   ```
2. **检查网络连接**:
   - 确保能访问 OpenAI/Anthropic API
   - 检查代理设置（如果在公司网络）
3. **查看 Cloud Gateway 日志**:
   ```
   Output → StoryTree → 查找 "CloudGateway" 相关日志
   ```

***

## 📊 四、性能监控

### 1. 监控内存使用

在 Extension Development Host 中：

1. 按 `⌘/Ctrl + Shift + P`
2. 输入 `Developer: Show Running Extensions`
3. 查看 StoryTree 的内存占用

### 2. Profile 性能分析

```bash
# 启动 CPU Profiling
code --prof-v5-extensions=caiode.storytree-vscode

# 运行一段时间后，会在 ~/.vscode/profile/ 生成 .cpuprofile 文件
# 可用 Chrome DevTools 打开分析
```

***

## 🔄 五、更新与卸载

### 更新扩展

**从 VSIX 更新**:

```bash
# 卸载旧版本
code --uninstall-extension caicode.storytree-vscode

# 安装新版本
code --install-extension path/to/new-version.vsix
```

**自动更新** (如果发布到 Marketplace):

- VS Code 会自动检查更新
- 或手动: `Extensions → ... → Check for Updates`

### 卸载扩展

1. 打开扩展面板 (`⌘/Ctrl + Shift + X`)
2. 搜索 "storytree"
3. 点击 **卸载 (Uninstall)** 按钮
4. 重启 VS Code

***

## 📝 六、快速参考卡

### 常用快捷键

| 快捷键                  | 功能              |
| -------------------- | --------------- |
| `F5`                 | 启动调试模式          |
| `⌘/Ctrl + R`         | 重新加载窗口          |
| `⌘/Ctrl + Shift + P` | 命令面板            |
| `⌘/Ctrl + Shift + U` | 输出面板            |
| `⌘/Ctrl + Shift + I` | 开发者工具 (Webview) |

### 常用命令 (Command Palette)

| 命令                                  | 说明        |
| ----------------------------------- | --------- |
| `StoryTree: Open Dashboard`         | 打开主面板     |
| `StoryTree: Refresh Tree View`      | 刷新树视图     |
| `StoryTree: Configure API Key`      | 配置 API 密钥 |
| `Developer: Reload Window`          | 重新加载窗口    |
| `Developer: Toggle Developer Tools` | 切换开发者工具   |

### 关键文件路径

| 文件         | 路径                                 | 说明     |
| ---------- | ---------------------------------- | ------ |
| **VSIX 包** | `/.../storytree-vscode-1.0.0.vsix` | 安装包    |
| **入口文件**   | `src/extension.ts`                 | 扩展激活入口 |
| **构建输出**   | `dist/extension.js`                | 编译后的代码 |
| **配置文件**   | `package.json`                     | 扩展清单   |
| **构建配置**   | `esbuild.config.mjs`               | 构建脚本   |
| **测试目录**   | `src/__tests__/`                   | 单元测试   |

***

## 🆘 七、获取帮助

### 查看官方文档

```bash
# VS Code 扩展开发文档
https://code.visualstudio.com/api

# StoryTree 项目 Wiki (如果有)
# https://github.com/<org>/storytree/wiki
```

### 提交 Bug 反馈

请提供以下信息：

1. **环境信息**:
   - VS Code 版本: `⌘/Ctrl + Shift + P → About`
   - 操作系统: macOS / Windows / Linux
   - Node.js 版本: `node --version`
2. **复现步骤**:
   - 你做了什么操作
   - 期望的结果是什么
   - 实际发生了什么
3. **日志信息**:
   ```
   Output → StoryTree / Extension Host → 复制相关日志
   ```
4. **截图** (如果有)

***

## 📋 附录：当前版本已知限制

> ⚠️ 这是 **v1.0.0-alpha** 版本，以下功能可能存在限制：

| 功能           | 状态    | 说明                     |
| ------------ | ----- | ---------------------- |
| 编辑器工作台       | ✅ 可用  | 核心功能正常                 |
| AI 对话面板      | ✅ 可用  | UI 已实现                 |
| 项目管理         | ✅ 可用  | Dashboard 正常           |
| Anthropic AI | ⚠️ 受限 | 需手动验证 API 连接           |
| E2E 场景       | ⚠️ 受限 | 部分 UI 流程需手动测试          |
| 加密数据库        | ⚠️ 受限 | 需要 better-sqlite3 原生模块 |

**建议**: 用于内部 Alpha 测试，不建议直接用于生产环境。

***

**文档版本**: v1.0
**最后更新**: 2026-04-08 19:50:00 UTC+8
**维护者**: GLM-5.1 (AI Documentation Generator)
