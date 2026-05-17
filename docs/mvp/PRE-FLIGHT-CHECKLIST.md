# PRE-FLIGHT-CHECKLIST.md

> **角色**: 项目协调 Agent (Kimi-K2.6)  
> **任务ID**: MVP-PREFLIGHT-001  
> **日期**: 2026-05-15  
> **版本**: v1.0  
> **状态**: [READY_FOR_REVIEW]

---

## 一、范围与目标对齐（30 分钟）

| 项 | 内容 | 预计 | 状态 |
|---|---|---|---|
| 1.1 | 写一句话定义本次 MVP | 5min | ✅ |
| 1.2 | 明确不在范围内的能力 | 5min | ✅ |
| 1.3 | 明确目标用户画像 | 5min | ✅ |
| 1.4 | 明确本期成功定义 | 5min | ✅ |
| 1.5 | 明确本期非目标 | 10min | ✅ |

输出物：`docs/mvp/SCOPE-NOVEL-MVP.md`（已完成）

---

## 二、环境与基础设施检查（约 1 小时）

| 项 | 内容 | 预计 | 风险点 | 状态 |
|---|---|---|---|---|
| 2.1 | 确认开发分支模型 | 10min | 不要直接在 main 上做 | ⏳ 待执行 |
| 2.2 | 确认本地启动正常 | 10min | Bun / Node 版本一致性 | ⏳ 待执行 |
| 2.3 | 确认 workspace 结构正确 | 10min | 落点直接影响后续路径 | ⏳ 待执行 |
| 2.4 | 确认 TypeScript 编译无 error | 5min | 历史欠债清零 | ⏳ 待执行 |
| 2.5 | 确认 3D Shot Draft 可正常运行 | 10min | | ⏳ 待执行 |
| 2.6 | 确认 roadmap 文档已 commit | 5min | | ⏳ 待执行 |
| 2.7 | 准备 `.gitignore` 检查 | 5min | 本地数据库、临时 JSON 不要进仓库 | ⏳ 待执行 |
| 2.8 | 在 README 增加本周专注标识 | 5min | | ⏳ 待执行 |

---

## 三、数据模型 / 存储前置（约 1.5 小时，关键路径）

| 项 | 内容 | 预计 | 状态 |
|---|---|---|---|
| 3.1 | 确定 NovelProject 顶层数据结构 | 15min | ⏳ 待执行 |
| 3.2 | 确定 Chapter 结构 | 10min | ⏳ 待执行 |
| 3.3 | 确定 Scene 结构 | 15min | ⏳ 待执行 |
| 3.4 | 确定 Shot 结构 | 15min | ⏳ 待执行 |
| 3.5 | 确定 Character / Location 最小字段 | 10min | ⏳ 待执行 |
| 3.6 | 确定持久化方案 | 15min | ⏳ 待执行 |
| 3.7 | 确定 Schema 版本字段 | 5min | ⏳ 待执行 |
| 3.8 | 确定 ID 生成方式 | 5min | ⏳ 待执行 |
| 3.9 | 编写 5 条假数据 fixture | 15min | ⏳ 待执行 |

输出物：`packages/novel-core/src/types.ts` + `fixtures/sample-novel.json`

---

## 四、技术栈与架构选型（约 1 小时）

| 项 | 内容 | 预计 | 决策 | 状态 |
|---|---|---|---|---|
| 4.1 | 确认 UI 框架 | 5min | Solid.js | ⏳ 待执行 |
| 4.2 | 确认编辑器方案 | 15min | contentEditable | ⏳ 待执行 |
| 4.3 | 确认状态管理 | 5min | createStore | ⏳ 待执行 |
| 4.4 | 确认路由 | 10min | Solid Router | ⏳ 待执行 |
| 4.5 | 确认 LLM 通道接口 | 15min | TextProvider.complete | ⏳ 待执行 |
| 4.6 | 确认 Skill 落点 | 15min | .claude/skills/ | ⏳ 待执行 |
| 4.7 | 确认错误监控 / 日志 | 5min | console + logger.ts | ⏳ 待执行 |

输出物：`docs/mvp/TECH-STACK-NOVEL-MVP.md`

---

## 五、UI / 交互前置（约 45 分钟）

| 项 | 内容 | 预计 | 是否必做 | 状态 |
|---|---|---|---|---|
| 5.1 | 画 3 张低保真 wireframe | 20min | 必做 | ⏳ 待执行 |
| 5.2 | 确定快捷键最少集合 | 10min | 必做 | ⏳ 待执行 |
| 5.3 | 确定深浅主题 | 5min | 推荐 | ⏳ 待执行 |
| 5.4 | 决定首屏空状态文案 | 5min | 推荐 | ⏳ 待执行 |
| 5.5 | 决定加载 / 失败 / 任务运行中 UI 反馈 | 10min | 推荐 | ⏳ 待执行 |

输出物：`docs/mvp/WIREFRAME-NOVEL-MVP.md`

---

## 六、风险与依赖前置（30 分钟）

| 风险 | 概率 | 止损 |
|---|---|---|
| 编辑器选区与场景标记关联复杂超预期 | 中 | 退化为「整段章节作为一个场景」 |
| LLM Mock 输出结构不稳定 | 低 | 用固定 JSON 模板 |
| 拆镜结果质量差 | 中 | MVP 阶段先承认是 Demo 级别 |
| 本地 JSON 写文件被浏览器限制 | 中 | 用 File System Access API + 降级到下载/上传 |
| 时间不够 | 高 | 把 Character / Location 卡做成 stub |

---

## 七、Day 0 收尾（15 分钟）

```text
1. 把今晚产出的 6 份文档全部 commit 到 feature/novel-mvp 分支
2. 在仓库根目录创建 docs/mvp/INDEX.md 汇总所有 MVP 文档入口
3. 在任务管理工具里新建「Novel MVP」看板
4. 把 PRD 大纲拆成 epic + ticket，全部进 Backlog
5. 给自己留一句话目标：明天 EOD 前必须看到「项目列表 + 创建项目 + 打开章节空白编辑器」三件事跑通
```

---

*[READY_FOR_REVIEW]*
