# OpenCode StoryTree 开发规则（Agent 消费版）

> **完整版**: [STORYTREE_RULES.md](../../../caiode/opencode-1.4.0/STORYTREE_RULES.md)
> **版本**: v1.0 | **日期**: 2026-06-11

---

## 你正在开发 storytree/caiode/opencode-1.4.0

### 项目定位

OpenCode 是**底座**，StoryTree/小说编辑器/故事画布/3D镜头是**业务扩展**。
默认保护 OpenCode 核心，优先在 `packages/app/src` 内完成业务功能。

---

## 边界规则

```
✅ 主要开发区:
   packages/app/src/novel        小说编辑器
   packages/app/src/novel-canvas  故事画布
   packages/app/src/novel-3d     3D 镜头
   packages/app/src/pages/       路由入口

❌ 默认保护（修改需审批）:
   packages/opencode/    Server/API/CLI 核心
   packages/sdk/          SDK 协议
   packages/plugin/       插件接口
   packages/desktop/      桌面壳
   packages/ui/           全局 UI 库
   根目录 package.json / turbo.json / tsconfig
```

## 技术规则

1. 使用 **Bun**，不使用 npm/yarn/pnpm
2. **不从 repo root 运行 `bun test`**，进入具体 package 执行
3. 类型检查: `cd packages/app && bun typecheck`（不直接跑 tsc）
4. **SolidJS + Vite** 项目，不引入 React/Vue 思路
5. 状态优先用 **createStore**，避免多 createSignal 维护同一对象
6. **默认不新增依赖**，优先使用已有依赖
7. 新增依赖必须说明必要性和影响范围

## 代码风格

```
const > let          默认 const
early return > else  避免 else
.catch() > try/catch  优先 .catch()
精确类型 > any         禁止 any
obj.a > const { a }   避免不必要解构
短单词名               底座代码严格短名
map/filter/flatMap    优先函数式数组方法
Bun API               能用则用
```

## 小说编辑器分层（核心）

```
types/       → 领域模型（契约源头）
mock-data/   → 种子数据（只读，不写业务逻辑）
providers/   → 数据访问层（返回副本、async、统一错误）
hooks/       → UI 适配层（组件只消费 Hook）
components/  → 展示交互层（禁止直接 import mock-data）
utils/       → 工具函数
```

**新功能顺序**: types → mock-data → providers → hooks → components → tests

## STDD 方法论

```
Spec(验收标准) → Types(类型) → Tests(测试) → Mock(跑通) → Dev(实现) → Verify(验证)
```

**没有 Spec 不写 UI。没有 Mock 跑通不接真实后端。**

每个 Spec 必须包含：用户目标、输入、输出、状态变化、成功/失败场景、验收标准。

## Mock Provider 规则

| 规则 |
|------|
| Provider 初始化时**复制** mock-data |
| 返回**对象副本**，防止 UI 污染内部状态 |
| 方法必须是 **async** |
| 必须模拟延迟 (`mock-delay.ts`) |
| 必须抛统一 `ProviderError` { code, message } |
| **UI 禁止直接修改 mock-data** |
| AI 结果禁止直接覆盖正文，必须经用户接受 |

## AI Agent 规则

```
所有 AI 操作走 AITask 协议:
  pending → running → success / failed / cancelled / denied / quota

流程: 生成任务 → 产出结果 → 结果卡片展示 → 用户接受/保存/丢弃
禁止: 按钮里直接调用模型、AI 直接改正文
```

## 测试规则

```
优先级: Provider测试 > Hook测试 > 组件行为测试 > E2E
每个新 Provider 方法: 成功路径 + 至少1个失败路径
测试文件: 与被测对象同目录, *.test.ts
Mock 必须: 成功/失败/拒绝/额度不足/取消
```

## 本地验证命令

```bash
# 类型检查
cd packages/app && bun typecheck

# 单元测试
cd packages/app && bun test

# 构建
cd packages/app && bun build

# 本地 dev（不要用 opencode dev web）
# 后端:
cd packages/opencode && bun run --conditions=browser ./src/index.ts serve --port 4096
# 前端:
cd packages/app && bun dev -- --port 4444
# 浏览器: http://localhost:4444
```

## 输出要求

每次完成任务后输出：
```
- 本次目标（一句话）
- 修改文件列表
- 是否触及 OpenCode 底座
- 数据流/交互流说明
- 验证命令和结果
- 风险与未完成事项
```

## 禁止事项

1. 不要大规模重构无关文件
2. 不要主动重启用户已有 app/server 进程
3. 不要从 root 运行测试
4. 不要随意新增依赖
5. 不要生成空泛总结（"我全面优化了项目"）
6. 不要绕过类型系统用 any
7. 不要让 UI 直接 import mock-data
8. 不要让 AI 结果自动覆盖正文

## 当前推荐首个任务

> **重构章节数据流**: 新增 `use-novel-chapters` Hook，移除 NovelEditor 对 mockChapters 的直接修改。

---

*本文件是 STORYTREE_RULES.md 的 Agent 消费精简版，每次开发前应先读取。*
