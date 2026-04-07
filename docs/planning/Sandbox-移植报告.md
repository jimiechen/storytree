# Claude Code 沙箱系统移植分析报告

## 1. 重要声明

**⚠️ 关键发现**：Claude Code 的沙箱系统依赖于私有包 `@anthropic-ai/sandbox-runtime`，该包没有开源，无法获取其源代码。因此，**无法完整移植沙箱系统**。

本报告将实事求是地分析哪些部分可以移植，哪些部分无法移植，并提供替代方案建议。

## 2. 沙箱系统分析

### 2.1 系统架构

Claude Code 的沙箱系统分为两层：

1. **开源层**（可移植）：
   - 类型定义和接口
   - 配置管理
   - 权限规则解析
   - 适配器接口

2. **私有关闭层**（不可移植）：
   - `@anthropic-ai/sandbox-runtime` 包
   - 核心沙箱运行时
   - 系统调用拦截
   - 真正的隔离实现

### 2.2 核心文件分析

| 文件名 | 功能 | 可移植性 | 位置 |
|--------|------|---------|------|
| sandboxTypes.ts | 沙箱配置类型定义 | ✅ 可移植 | [entrypoints/sandboxTypes.ts](file:///workspace/caiode/claude-code-src/entrypoints/sandboxTypes.ts) |
| sandbox-adapter.ts | 沙箱适配器，包装外部运行时 | ⚠️ 部分可移植 | [utils/sandbox/sandbox-adapter.ts](file:///workspace/caiode/claude-code-src/utils/sandbox/sandbox-adapter.ts) |
| sandbox-ui-utils.ts | 沙箱UI工具函数 | ✅ 可移植 | [utils/sandbox/sandbox-ui-utils.ts](file:///workspace/caiode/claude-code-src/utils/sandbox/sandbox-ui-utils.ts) |

### 2.3 依赖分析

| 依赖 | 类型 | 用途 | 可获取性 | 备注 |
|------|------|------|---------|------|
| @anthropic-ai/sandbox-runtime | 外部依赖 | 沙箱核心运行时 | ❌ 不可获取 | 私有 NPM 包，无源代码 |
| zod | 外部依赖 | 配置验证 | ✅ 可获取 | 开源依赖 |
| lodash-es | 外部依赖 | 工具函数 | ✅ 可获取 | 开源依赖 |
| fs | 内置模块 | 文件系统操作 | ✅ 可获取 | Node.js 内置 |
| path | 内置模块 | 路径处理 | ✅ 可获取 | Node.js 内置 |

## 3. 可移植部分分析

### 3.1 配置系统（完全可移植）

从 [sandboxTypes.ts](file:///workspace/caiode/claude-code-src/entrypoints/sandboxTypes.ts) 可以看到完整的配置类型定义，包括：

- **网络配置**：域名白名单、代理设置、Unix Socket 控制
- **文件系统配置**：读写权限、路径模式匹配
- **沙箱设置**：启用/禁用、平台限制、依赖检查

### 3.2 权限规则系统（完全可移植）

从 [sandbox-adapter.ts](file:///workspace/caiode/claude-code-src/utils/sandbox/sandbox-adapter.ts) 可以看到：

- 权限规则解析逻辑
- 路径模式处理
- 设置源管理
- 配置转换逻辑

### 3.3 接口定义（完全可移植）

完整的 `ISandboxManager` 接口定义，包括：

```typescript
export interface ISandboxManager {
  initialize(sandboxAskCallback?: SandboxAskCallback): Promise<void>
  isSupportedPlatform(): boolean
  isSandboxingEnabled(): boolean
  wrapWithSandbox(command: string, binShell?: string): Promise<string>
  // ... 更多方法
}
```

## 4. 不可移植部分

### 4.1 核心沙箱运行时

`@anthropic-ai/sandbox-runtime` 提供的以下功能无法获取：

- **系统调用拦截**：seccomp/bubblewrap 集成
- **文件系统隔离**：真正的 mount namespace
- **网络隔离**：network namespace 管理
- **进程隔离**：PID namespace
- **资源限制**：cgroups 配置

### 4.2 关键代码示例

从 [sandbox-adapter.ts](file:///workspace/caiode/claude-code-src/utils/sandbox/sandbox-adapter.ts) 第 7-22 行可以看到：

```typescript
import type {
  FsReadRestrictionConfig,
  FsWriteRestrictionConfig,
  // ... 更多类型
} from '@anthropic-ai/sandbox-runtime'
import {
  SandboxManager as BaseSandboxManager,
  SandboxRuntimeConfigSchema,
  SandboxViolationStore,
} from '@anthropic-ai/sandbox-runtime'
```

所有这些都是从私有包导入的，没有源代码。

## 5. 替代方案建议

### 5.1 方案一：使用开源沙箱工具（推荐）

| 工具 | 平台 | 特性 |
|------|------|------|
| bubblewrap | Linux | 轻量级，安全，用于 Flatpak |
| firejail | Linux | 功能完整，配置灵活 |
| Docker | 全平台 | 跨平台，功能强大 |
| nsjail | Linux | Google 开发，安全 |

**推荐方案**：使用 bubblewrap（Linux）+ Docker（跨平台）组合

### 5.2 方案二：实现轻量级权限控制

不做真正的系统级隔离，而是在应用层实现权限控制：

- 路径白名单/黑名单
- 命令白名单
- 文件访问拦截（通过 Node.js fs 钩子）
- 网络访问控制（通过代理）

### 5.3 方案三：混合方案

- **开发环境**：使用轻量级权限控制
- **生产环境**：使用 Docker 或 bubblewrap

## 6. 实际移植策略

### 6.1 阶段一：移植可移植部分（优先）

1. **移植配置系统**：
   - 复制 [sandboxTypes.ts](file:///workspace/caiode/claude-code-src/entrypoints/sandboxTypes.ts)
   - 移植配置验证逻辑

2. **移植权限规则系统**：
   - 复制权限解析逻辑
   - 移植路径模式匹配

3. **实现适配器接口**：
   - 创建 `SandboxManager` 类
   - 实现所有接口方法（先返回默认值或抛出 NotImplemented）

### 6.2 阶段二：实现替代沙箱

1. **选择技术栈**：
   - Linux：bubblewrap
   - macOS：Docker Desktop
   - Windows：WSL2 + Docker

2. **实现核心功能**：
   - 文件系统隔离
   - 网络隔离
   - 权限控制

3. **集成到适配器**：
   - 替换 `BaseSandboxManager` 调用
   - 保持接口兼容性

### 6.3 阶段三：优化和完善

1. **性能优化**：
   - 减少沙箱启动开销
   - 优化命令执行速度

2. **安全增强**：
   - 添加安全审计
   - 实现违规检测

3. **平台适配**：
   - 针对不同平台优化
   - 处理平台差异

## 7. 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 无法获取核心运行时 | 100% | 极高 | 使用开源替代方案 |
| 替代方案功能不足 | 中 | 高 | 分阶段实现，逐步完善 |
| 安全漏洞 | 中 | 极高 | 加强安全测试，使用成熟工具 |
| 平台兼容性 | 中 | 中 | 针对主要平台实现适配 |
| 性能影响 | 低 | 中 | 优化启动和执行流程 |

## 8. 结论

**重要结论**：

1. **无法完整移植**：由于 `@anthropic-ai/sandbox-runtime` 是私有包，没有源代码，无法完整移植沙箱系统。

2. **可以移植的部分**：
   - 配置系统
   - 权限规则系统
   - 接口定义
   - 配置转换逻辑

3. **推荐的做法**：
   - 移植可移植的部分
   - 使用开源沙箱工具（bubblewrap、Docker 等）实现替代方案
   - 保持接口兼容性，便于未来替换

4. **为 Caiode 中间版本**：
   - 可以先实现轻量级权限控制
   - 后续再引入完整的沙箱隔离

## 9. 附录

### 9.1 可移植代码清单

**完全可移植**：
- [entrypoints/sandboxTypes.ts](file:///workspace/caiode/claude-code-src/entrypoints/sandboxTypes.ts) - 类型定义
- [utils/sandbox/sandbox-ui-utils.ts](file:///workspace/caiode/claude-code-src/utils/sandbox/sandbox-ui-utils.ts) - UI 工具
- sandbox-adapter.ts 中的配置转换逻辑
- sandbox-adapter.ts 中的权限规则解析逻辑

**需要重写**：
- sandbox-adapter.ts 中所有对 `BaseSandboxManager` 的调用

### 9.2 开源沙箱工具推荐

| 工具 | GitHub | 文档 |
|------|--------|------|
| bubblewrap | https://github.com/containers/bubblewrap | https://github.com/containers/bubblewrap |
| firejail | https://github.com/netblue30/firejail | https://firejail.wordpress.com/ |
| nsjail | https://github.com/google/nsjail | https://nsjail.dev/ |

### 9.3 Docker 沙箱示例

```typescript
// 简单的 Docker 沙箱包装器示例
import { exec } from 'child_process';

export async function wrapWithDockerSandbox(
  command: string,
  workDir: string,
  allowedPaths: string[]
): Promise<string> {
  const volumeArgs = allowedPaths.map(p => `-v ${p}:${p}`).join(' ');
  
  const dockerCommand = `docker run --rm ${volumeArgs} -w ${workDir} alpine ${command}`;
  
  return new Promise((resolve, reject) => {
    exec(dockerCommand, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}
```