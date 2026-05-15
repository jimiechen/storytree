# FIRST-30-DAYS-ACTION-PLAN.md

> **角色**: 项目协调 Agent (Kimi-K2.6)  
> **任务ID**: DOC-PHASE0-007  
> **日期**: 2026-05-15  
> **版本**: v1.0  
> **状态**: [READY_FOR_REVIEW]

---

## 一、第 1 周：插件底座 (Week 1: Plugin Foundation)

### 目标

搭建插件化开发的地基，确保后续插件能正确加载、注册和运行。

### 任务清单

| # | 任务 | 交付物 | 负责人 |
|---|------|--------|--------|
| 1.1 | 定义 Plugin Manifest 规范 | `PLUGIN-MANIFEST-SPEC.md` + TypeScript 类型 | 架构师 |
| 1.2 | 实现 Plugin Runtime 核心 | `packages/app/src/core/plugin-runtime/` | 架构师 |
| 1.3 | 实现 Plugin Registry | 插件注册表 + 依赖解析 | 架构师 |
| 1.4 | 实现 Extension Point 机制 | 10 个扩展点注册接口 | 架构师 |
| 1.5 | 实现 Mock License Gate | 模拟权限校验 | 后端工程师 |
| 1.6 | 实现 Mock Billing State | 模拟计费状态 | 后端工程师 |

### 验收标准

- [ ] 能加载一个 Mock 插件
- [ ] 能在工作台注册一个页面
- [ ] 能在命令面板注册一个命令
- [ ] 能判断插件是否已授权
- [ ] 能显示"未购买/试用/已购买/过期"

---

## 二、第 2 周：Skill + Provider 底座 (Week 2: Skill & Provider Foundation)

### 目标

搭建 Skill 和 Provider 的注册与调用体系，确保 AI 任务能正确流转。

### 任务清单

| # | 任务 | 交付物 | 负责人 |
|---|------|--------|--------|
| 2.1 | 实现 Skill Registry | Skill 注册与调用规范 | 后端工程师 |
| 2.2 | 实现 OpenRouter Provider Adapter | 文本模型接入抽象 | 后端工程师 |
| 2.3 | 实现 Mock LLM Provider | 模拟 AI 响应 | 后端工程师 |
| 2.4 | 实现 Task Center Core | 任务状态机 + 调度 | 后端工程师 |
| 2.5 | 实现 AILog 记录 | AI 调用日志 | 后端工程师 |
| 2.6 | 实现 Cost Metadata | 成本元数据记录 | 后端工程师 |

### 验收标准

- [ ] 能注册一个 Skill
- [ ] 能调用 Mock LLM Provider
- [ ] 能创建并跟踪一个 AI 任务
- [ ] 能记录任务成本和日志
- [ ] 失败任务可重试

---

## 三、第 3 周：Novel Studio Alpha (Week 3: Novel Studio Alpha)

### 目标

实现第一个可演示的付费插件雏形，验证插件化开发流程。

### 任务清单

| # | 任务 | 交付物 | 负责人 |
|---|------|--------|--------|
| 3.1 | 定义 Novel Plugin Manifest | `novel-studio/manifest.json` | 架构师 |
| 3.2 | 实现项目设定页面 | 项目名称、类型、描述 | 前端工程师 |
| 3.3 | 实现角色卡管理 | 角色创建、编辑、列表 | 前端工程师 |
| 3.4 | 实现章节大纲 | 章节结构、排序 | 前端工程师 |
| 3.5 | 实现 AI Mock 续写 | FakeAgentProvider 模拟续写 | 后端工程师 |
| 3.6 | 接入 License Gate | 插件付费校验 | 后端工程师 |
| 3.7 | 可选：接入 OpenRouter | 真实文本调用（保留 Mock 模式） | 后端工程师 |

### 验收标准

- [ ] 能加载 Novel Studio Plugin
- [ ] 能判断 Novel Studio 是否已购买
- [ ] 能运行 Novel Skill
- [ ] 能创建角色和章节
- [ ] AI 续写能返回模拟结果
- [ ] 结果能进入建议区或草稿区

---

## 四、第 4 周：Storyboard + 3D Shot Draft Spike (Week 4: Storyboard & 3D Spike)

### 目标

快速验证从文本到视觉的转换链路，为 Visual Story Pack 做准备。

### 任务清单

| # | 任务 | 交付物 | 负责人 |
|---|------|--------|--------|
| 4.1 | 实现 Shot Card 组件 | 镜头卡片：景别、机位、运动 | 前端工程师 |
| 4.2 | 实现 Shot Prompt 生成 | 从 Shot 卡生成图像 prompt | 后端工程师 |
| 4.3 | 搭建 Three.js 3D 视口 | 基础 3D 场景渲染 | 前端工程师 |
| 4.4 | 实现相机预设 | 常见景别相机参数 | 前端工程师 |
| 4.5 | 实现导出参考图 | 当前视角 PNG 导出 | 前端工程师 |
| 4.6 | 整合为 Visual Story Pack 雏形 | 组合演示 | 项目协调 |

### 验收标准

- [ ] 能生成 Shot 卡
- [ ] 能打开 3D Shot Draft
- [ ] 能导出参考图
- [ ] 能看到模块付费入口
- [ ] 能演示从章节 → 剧本 → 分镜 → 3D 草稿的完整链路

---

## 五、30 天验收标准 (30-Day Acceptance Criteria)

### 5.1 功能验收

| # | 检查项 | 通过标准 |
|---|--------|---------|
| 1 | Mock 项目数据 | 能加载 1 个小说项目 |
| 2 | Mock 章节数据 | 能显示至少 3 个章节 |
| 3 | Mock 角色数据 | 能显示至少 3 个角色 |
| 4 | Provider 抽象 | UI 不直接依赖静态数据文件 |
| 5 | FakeAgentProvider | 能模拟续写、改写、摘要、失败、取消 |
| 6 | AITask 状态 | 能展示 pending/running/success/failed/cancelled |
| 7 | AILog | 能记录任务输入、输出、状态、时间 |
| 8 | 编辑器写回 | AI 结果能进入建议区或草稿区 |
| 9 | 权限边界 | 不调用真实 Bash/WebFetch/WebSearch/Agent/Task |
| 10 | 构建验证 | typecheck/build 仍然通过 |

### 5.2 商业验收

| # | 检查项 | 通过标准 |
|---|--------|---------|
| 1 | SKU 定义 | Novel Studio 有独立 SKU |
| 2 | License Gate | 能判断插件是否已购买 |
| 3 | 试用模式 | 能显示试用状态和剩余天数 |
| 4 | 付费入口 | UI 有明确的购买/升级入口 |
| 5 | 额度记录 | 能记录 Mock 任务的成本元数据 |

### 5.3 工程验收

| # | 检查项 | 通过标准 |
|---|--------|---------|
| 1 | 代码规范 | 所有文件 < 500 行 |
| 2 | 类型安全 | TypeScript 零错误 |
| 3 | 测试覆盖 | 核心接口有单元测试 |
| 4 | 文档完整 | 每个插件有 README |
| 5 | Git 规范 | Commit 符合 conventional commits |

---

## 六、风险与应对

| 风险 | 等级 | 应对 |
|------|------|------|
| opencode 插件机制不兼容 | 中 | 提前验证 Extension Point 可行性 |
| Three.js 集成复杂度 | 中 | 第 4 周只做最小 3D 视口 |
| OpenRouter 接入延迟 | 低 | Mock Provider 优先，真实接入延后 |
| 团队资源不足 | 中 | 按周优先级，确保每周有交付 |

---

## 七、每周里程碑

```text
Week 1 结束: 插件底座可运行，能加载 Mock 插件
Week 2 结束: Skill + Provider 可调用，能创建 Mock 任务
Week 3 结束: Novel Studio Alpha 可演示，能创建角色和章节
Week 4 结束: Storyboard + 3D Spike 可演示，有完整链路
```

---

*[READY_FOR_REVIEW]*
