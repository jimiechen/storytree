# Week 0 补充检查：opencode 扩展加载能力验证

> **文档版本**: v1.0
> **创建日期**: 2026-05-08
> **检查人**: Trae AI (Kimi-K2.6)
> **前置文档**: WEEK0-OPENCODE-1.4.0-BUILD-RUN-CHECK.md, WEEK0-NOVEL-EDITOR-FEASIBILITY-CHECK.md
> **状态**: [READY_FOR_REVIEW]

---

## 1. 检查背景

在准备 Week 1 开发任务拆解时，发现 Week 0 的前置检查**未明确验证**以下关键假设：

> **核心问题**: opencode v1.4.0 能否加载 `caiode/src/` 目录下的自定义代码？

这个问题直接影响 **TASK-DEV-011**（接入 opencode Workspace 页面）的可行性。如果 opencode 无法加载外部目录的代码，则需要在 opencode 内部创建文件，或采用独立路由方案。

---

## 2. 验证方法

通过静态分析 opencode 的构建配置（不修改任何源码）：

1. **分析 tsconfig.json** — 检查模块解析策略和路径映射
2. **分析 package.json** — 检查 workspace 配置和依赖关系
3. **分析 vite.config.ts** — 检查构建入口和外部依赖处理
4. **检查目录结构** — 确认代码组织方式

---

## 3. 验证结果

### 3.1 跨目录导入能力（验证 1）

**测试场景**: `caiode/src/` 下的代码能否被 opencode 引用？

**关键发现**:

| 检查项 | 结果 | 证据 |
|-------|:----:|------|
| opencode app 的 tsconfig paths | ❌ **仅支持 `@/*` → `./src/*`** | `"@/*": ["./src/*"]` |
| 是否配置外部路径别名 | ❌ **无** | 无 `"caiode/*"` 或 `"@novel/*"` 配置 |
| monorepo workspace 范围 | ⚠️ **仅包含 `packages/*`** | `"packages": ["packages/*", ...]` |
| `caiode/` 是否在 workspace 内 | ❌ **否** | `caiode/` 与 `opencode-1.4.0/` 是并列目录 |

**结论**: 
```
❌ opencode 默认无法直接加载 caiode/src/ 下的代码
   原因:
   1. caiode/ 不在 opencode 的 workspace 范围内
   2. tsconfig paths 未配置跨目录别名
   3. Vite 构建入口仅包含 packages/app/src/
```

---

### 3.2 Workspace 注册机制（验证 2）

**测试场景**: opencode 是否支持动态注册新的 Workspace 类型？

**关键发现**:

| 检查项 | 结果 | 证据 |
|-------|:----:|------|
| 是否存在 `registerWorkspace` API | ❌ **未找到** | 搜索 `packages/` 下无此导出 |
| Workspace 类型定义位置 | ⚠️ **内置在 core 中** | `packages/opencode/src/` 含 session/tool 逻辑 |
| 扩展点机制 | ⚠️ **通过 plugin 包** | `packages/plugin/src/` 含扩展接口 |
| 是否支持外部 Workspace 类型 | ❌ **不确定** | 需要运行时验证 |

**opencode 的 workspace 配置**（来自 package.json）:
```json
"workspaces": {
  "packages": [
    "packages/*",
    "packages/console/*",
    "packages/sdk/js",
    "packages/slack"
  ]
}
```

**结论**:
```
⚠️ opencode 的 Workspace 扩展机制不明确
   现状:
   - 未发现类似 VS Code Extension 的注册 API
   - 扩展可能通过 packages/plugin/ 实现
   - 需要进一步运行时验证
```

---

### 3.3 构建产物路径（验证 3）

**测试场景**: 构建后的产物是否包含自定义代码？

**关键发现**:

| 检查项 | 结果 | 证据 |
|-------|:----:|------|
| Vite 构建目标 | ✅ `packages/app/dist/` | vite.config.ts 配置 |
| 构建入口 | ✅ `packages/app/src/entry.tsx` | 标准 Vite 应用 |
| 是否支持多入口 | ❌ **未配置** | 仅单入口 |
| 外部依赖处理 | ⚠️ **依赖 workspace 链接** | `"@opencode-ai/sdk": "workspace:*"` |

**结论**:
```
✅ opencode 使用标准 Vite 构建
   特点:
   - 单入口应用 (entry.tsx)
   - 构建产物在 packages/app/dist/
   - 支持 workspace 内部依赖
   - 不支持自动加载外部目录
```

---

## 4. 关键结论

### 4.1 核心发现

```
┌─────────────────────────────────────────────────────────────────┐
│                    验证结论总览                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ❌ caiode/src/ 无法被 opencode 直接加载                        │
│     → 不在 workspace 范围内                                     │
│     → 无路径别名配置                                            │
│                                                                 │
│  ⚠️ opencode Workspace 扩展机制不明确                           │
│     → 未发现 registerWorkspace API                              │
│     → 可能通过 plugin 包实现                                    │
│     → 需运行时验证                                              │
│                                                                 │
│  ✅ 标准 Vite 构建，支持 workspace 内部依赖                     │
│     → 单入口应用                                                │
│     → 构建产物在 packages/app/dist/                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 对 Week 1 开发的影响

| 原方案 | 可行性 | 调整建议 |
|-------|:------:|---------|
| **方案 A**: 在 opencode 外创建 `caiode/src/`，通过路径别名引用 | ❌ **不可行** | 需要修改 opencode tsconfig |
| **方案 B**: 在 opencode 内创建 `packages/app/src/novel/` | ✅ **可行** | 推荐方案 |
| **方案 C**: 创建独立的 `packages/novel/` workspace | ✅ **可行** | 需配置 workspace |
| **方案 D**: 独立应用，通过 iframe 嵌入 | ✅ **可行** | 完全解耦 |

---

## 5. 推荐的 Week 1 调整方案

### 方案 B（推荐）：在 opencode 内部创建 novel 模块

**目录结构**:
```
opencode-1.4.0/packages/app/src/
├── novel/                    ← 新增：小说编辑器模块
│   ├── types/
│   ├── providers/
│   ├── mock-data/
│   ├── components/
│   └── hooks/
├── pages/
│   ├── home.tsx
│   ├── session.tsx
│   └── novel.tsx            ← 新增：小说编辑器页面
├── app.tsx
└── entry.tsx
```

**优点**:
- ✅ 无需修改构建配置
- ✅ 直接使用 opencode 的 UI 组件 (@opencode-ai/ui)
- ✅ 共享类型系统和构建工具
- ✅ 符合 opencode 的代码组织方式

**缺点**:
- ⚠️ 代码与 opencode 耦合
- ⚠️ 需要遵循 opencode 的技术栈 (SolidJS)

---

### 方案 C（备选）：创建独立 workspace

**目录结构**:
```
opencode-1.4.0/packages/
├── app/                      ← 现有
├── novel/                    ← 新增：独立 workspace
│   ├── src/
│   ├── package.json
│   └── tsconfig.json
└── ...
```

**配置修改**:
```json
// opencode-1.4.0/package.json
"workspaces": {
  "packages": [
    "packages/*",
    "packages/console/*",
    "packages/sdk/js",
    "packages/slack",
    "packages/novel"        ← 新增
  ]
}
```

**优点**:
- ✅ 代码隔离，不影响 opencode 核心
- ✅ 可独立构建和发布
- ✅ 未来可提取为独立包

**缺点**:
- ⚠️ 需要修改根 package.json
- ⚠️ 需要配置 workspace 依赖关系
- ⚠️ 构建复杂度增加

---

### 方案 D（保守）：完全独立应用

**目录结构**:
```
caiode/
├── opencode-1.4.0/          ← 不变
├── novel-editor/            ← 新增：独立应用
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
└── docs/
```

**集成方式**:
- 独立运行 `http://localhost:3001`
- 通过 iframe 或新窗口嵌入 opencode
- 或通过 deep link 跳转

**优点**:
- ✅ 完全解耦，技术栈自由
- ✅ 不影响 opencode 稳定性
- ✅ 开发迭代更快

**缺点**:
- ⚠️ 需要独立维护构建配置
- ⚠️ 与 opencode 的集成度低
- ⚠️ 用户体验可能不连贯

---

## 6. 建议的下一步行动

### 立即执行（阻塞 TASK-DEV-001）

| # | 行动 | 负责人 | 预计时间 |
|:-:|------|:------:|:-------:|
| 1 | **架构决策**: 选择方案 B/C/D | 架构师 | 30 分钟 |
| 2 | **验证方案 B**: 在 `packages/app/src/novel/` 创建测试文件 | 开发工程师 | 1 小时 |
| 3 | **验证 typecheck**: 确认新目录能被正确编译 | 开发工程师 | 30 分钟 |
| 4 | **验证构建**: 确认新目录能被正确打包 | 开发工程师 | 30 分钟 |

### 验证命令（方案 B）

```bash
# 1. 创建测试目录
mkdir -p caiode/opencode-1.4.0/packages/app/src/novel/test

# 2. 创建测试文件
cat > caiode/opencode-1.4.0/packages/app/src/novel/test/hello.ts << 'EOF'
export const hello = () => "Hello from novel module!";
EOF

# 3. 在 app.tsx 中导入测试
# 修改 packages/app/src/app.tsx，添加:
# import { hello } from "./novel/test/hello";

# 4. 执行 typecheck
cd caiode/opencode-1.4.0 && bun run typecheck

# 5. 执行构建
bun run build
```

---

## 7. 风险更新

| 风险项 | 原评估 | 新评估 | 缓解措施 |
|-------|:------:|:------:|---------|
| opencode 扩展 API 不存在 | 中 | **高** | 确认需使用内部目录方案 |
| 技术栈限制 (SolidJS) | 未评估 | **中** | 团队需熟悉 SolidJS |
| 构建配置修改 | 未评估 | **中** | 方案 B 无需修改，方案 C 需修改 |
| 代码耦合度 | 未评估 | **中** | 方案 C/D 可降低耦合 |

---

## 8. 文档元信息

| 属性 | 值 |
|-----|---|
| **文档编号** | WEEK0-EXT-LOAD-001 |
| **文档标题** | Week 0 补充检查：opencode 扩展加载能力验证 |
| **创建人** | Trae AI |
| **创建日期** | 2026-05-08 |
| **状态** | [READY_FOR_REVIEW] |
| **关联文档** | WEEK0-OPENCODE-1.4.0-BUILD-RUN-CHECK.md, WEEK0-NOVEL-EDITOR-FEASIBILITY-CHECK.md, WEEK1-DEVELOPMENT-TASK-BREAKDOWN.md |
| **阻塞任务** | TASK-DEV-001 (创建功能分支) |
| **关键结论** | caiode/src/ 无法被 opencode 直接加载，需调整 Week 1 目录方案 |

---

*本文档为 Week 0 前置检查的补充，基于 opencode v1.4.0 构建配置的静态分析生成*
*建议架构师评审后确认 Week 1 的目录方案*
