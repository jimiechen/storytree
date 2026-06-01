# MODULE_MAP.md - 模块归属与责任矩阵

> **版本**: v0.1  
> **日期**: 2026-05-31  
> **状态**: 生效中  
> **用途**: PRD 21 页面 ↔ 现有模块的对齐表

---

## 一、模块归属总览

| 层级 | 模块 | 路径 | 状态 | 关系 |
|------|------|------|------|------|
| Core | OpenCode Core | `packages/opencode/` | 上游，禁止修改 | 复用 |
| Core | OpenCode Desktop | `packages/desktop/` | 上游，禁止修改 | 复用 |
| App | Novel Editor | `packages/app/src/novel/` | 已实现 | 扩展 |
| App | Novel 3D | `packages/app/src/novel-3d/` | 已实现 | **冻结(v2)** |
| App | Novel Canvas | `packages/app/src/novel-canvas/` | 已实现 | 扩展 |
| Plugin | Plugin Novel AI | `packages/plugin-novel-ai/` | **待新建** | 新建 |
| Plugin | Plugin Novel Assets | `packages/plugin-novel-assets/` | **待新建** | 新建 |
| Server | Server Billing | `packages/server-billing/` | **待新建** | 新建 |
| Shared | Shared Schema | `packages/shared-schema/` | **待新建** | 新建 |

---

## 二、PRD 21 页面 ↔ 模块对齐表

| PRD # | 页面/功能名 | 归属包 | 关系 | Owner | 风险 |
|-------|-----------|--------|------|-------|------|
| PRD-01 | 首页/引导页 | `app/src/novel/` | 扩展 | - | 低 |
| PRD-02 | 登录/注册页 | `server-billing/` | 新建 | - | 中 |
| PRD-03 | 我的书架页 | `app/src/novel/` | 扩展 | - | 低 |
| PRD-04 | 创建项目-类型选择 | `app/src/novel/` | 扩展 | - | 低 |
| PRD-05 | 创建项目-基础信息 | `app/src/novel/` | 扩展 | - | 低 |
| PRD-06 | 角色追踪面板 | `app/src/novel/` | 扩展 | - | 低 |
| PRD-07 | 世界设定页 | `app/src/novel/` | 扩展 | - | 低 |
| PRD-08 | 创建项目-完成确认 | `app/src/novel/` | 扩展 | - | 低 |
| PRD-09 | 25道题引导-问卷页 | `app/src/novel/` | 扩展 | - | 中 |
| PRD-10 | 25道题引导-结果页 | `app/src/novel/` | 扩展 | - | 中 |
| PRD-11 | 大纲生成 Tool | `plugin-novel-ai/` | 新建 | - | 高 |
| PRD-12 | 细纲生成 Tool | `plugin-novel-ai/` | 新建 | - | 高 |
| PRD-13 | 正文生成 Tool | `plugin-novel-ai/` | 新建 | - | 高 |
| PRD-14 | 章节编辑器 | `app/src/novel/` | 扩展 | - | 低 |
| PRD-15 | AI 模型设置页 | `app/src/components/` | 扩展 | - | 低 |
| PRD-16 | 名字生成器 Tool | `plugin-novel-ai/` | 新建 | - | 中 |
| PRD-17 | 拆书分析 Tool | `plugin-novel-ai/` | 新建 | - | 中 |
| PRD-18 | AI 封面 Tool | `plugin-novel-ai/` | 新建 | - | 中 |
| PRD-19 | 积分账本页面 | `server-billing/` | 新建 | - | 高 |
| PRD-20 | VIP 充值页面 | `server-billing/` | 新建 | - | 高 |
| PRD-21 | 新手教程页 | `app/src/` | 扩展 | - | 低 |

---

## 三、17 项核心功能 ↔ 模块对齐表

| 功能 # | 功能名 | 归属包 | 关系 | 依赖 |
|-------|-------|--------|------|------|
| F-01 | 大纲生成 | `plugin-novel-ai/` | 新建 | shared-schema |
| F-02 | 细纲生成 | `plugin-novel-ai/` | 新建 | shared-schema |
| F-03 | 正文生成 | `plugin-novel-ai/` | 新建 | shared-schema |
| F-04 | 角色管理 | `app/src/novel/` | 扩展 | - |
| F-05 | 世界设定 | `app/src/novel/` | 扩展 | - |
| F-06 | 剧情线 | `app/src/novel-canvas/` | 扩展 | - |
| F-07 | 25道题引导 | `app/src/novel/` | 扩展 | - |
| F-08 | 章节编辑 | `app/src/novel/` | 扩展 | - |
| F-09 | 富文本编辑 | `app/src/novel/` | 扩展 | TipTap |
| F-10 | AI 模型切换 | `app/src/components/` | 扩展 | ProviderRegistry |
| F-11 | 名字生成 | `plugin-novel-ai/` | 新建 | shared-schema |
| F-12 | 拆书分析 | `plugin-novel-ai/` | 新建 | shared-schema |
| F-13 | AI 封面生成 | `plugin-novel-ai/` | 新建 | shared-schema |
| F-14 | 积分获取 | `server-billing/` | 新建 | - |
| F-15 | 积分消耗 | `server-billing/` | 新建 | - |
| F-16 | VIP 订阅 | `server-billing/` | 新建 | - |
| F-17 | 数据导入导出 | `shared-schema/` | 新建 | - |

---

## 四、待新建包骨架

### 4.1 `packages/plugin-novel-ai/`

```
packages/plugin-novel-ai/
├── README.md
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts
    ├── tools/
    │   ├── outline.ts        # 大纲生成
    │   ├── detail.ts         # 细纲生成
    │   ├── content.ts        # 正文生成
    │   ├── name-gen.ts       # 名字生成
    │   └── book-analysis.ts  # 拆书分析
    └── types/
        └── index.ts
```

### 4.2 `packages/plugin-novel-assets/`

```
packages/plugin-novel-assets/
├── README.md
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts
    ├── mcp/
    │   ├── character.ts
    │   ├── world.ts
    │   └── plot.ts
    └── types/
        └── index.ts
```

### 4.3 `packages/server-billing/`

```
packages/server-billing/
├── README.md
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts
    ├── routes/
    │   ├── credits.ts
    │   ├── vip.ts
    │   └── order.ts
    ├── db/
    │   └── schema.ts
    └── services/
        └── billing.ts
```

### 4.4 `packages/shared-schema/`

```
packages/shared-schema/
├── README.md
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts
    ├── project.ts
    ├── chapter.ts
    ├── character.ts
    ├── world.ts
    ├── location.ts
    ├── beat.ts
    ├── task.ts
    ├── asset.ts
    └── billing.ts
```

---

## 五、模块 Owner 分配（待填）

| 模块 | Owner | 职责 |
|------|-------|------|
| `app/src/novel/` | 待分配 | M1 创作工作台 |
| `app/src/novel-canvas/` | 待分配 | M2 资产关系图谱 |
| `plugin-novel-ai/` | 待分配 | 5 个 AI Tool |
| `plugin-novel-assets/` | 待分配 | MCP Server |
| `server-billing/` | 待分配 | 积分/VIP/订单 |
| `shared-schema/` | 待分配 | 类型定义 |

---

## 六、重构计划

### 6.1 Sprint 1 内的重构任务

| 任务 | 从 | 到 | 说明 |
|------|-----|-----|------|
| 提取 Character 类型 | `app/src/novel/types/` | `shared-schema/` | 对齐作战计划 |
| 提取 World 类型 | `app/src/novel/types/` | `shared-schema/` | 对齐作战计划 |
| 提取 Location 类型 | - | `shared-schema/` | 新增 |
| 提取 Beat 类型 | - | `shared-schema/` | 新增 |

### 6.2 Sprint 2+ 的重构任务

| 任务 | 状态 | 说明 |
|------|------|------|
| novel-3d 重构 | **冻结** | 等主控决策 |
| novel-canvas 重构 | 待定 | 评估与 M2 关系 |

---

*本文档是 StoryTree2 模块归属的最终裁定，任何变更必须经过主控批准。*
