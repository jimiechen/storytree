# PRD-NOVEL-EDITOR-MVP.md

> **角色**: 项目协调 Agent (Kimi-K2.6)  
> **任务ID**: MVP-PRD-001  
> **日期**: 2026-05-15  
> **版本**: v0.1  
> **状态**: READY_FOR_DEV

---

## 1. 背景与目标

OpenCode Creative Studio 的核心入口是小说编辑器。MVP 的唯一目标是验证「文本 → 结构化场景 → 初版分镜」这一最关键的创作前置链路。本期不做图像、视频、3D、剧本、协作。

**北极星指标**：一个测试用户能在 30 分钟内，把一段 2000 字以内的小说章节，转化为可编辑、可保存、可重新打开的「结构化场景列表 + 镜头列表」，并完成至少一次 AI 辅助拆镜。

**本期成功标志**：

```text
1. 能新建 / 打开 / 保存项目
2. 能在编辑器中粘贴小说原文
3. 能手动或 AI 辅助创建场景卡
4. 能从场景一键生成 5–10 个镜头
5. 能编辑镜头字段并保存
6. 关闭重启后数据不丢
```

---

## 2. 用户角色

```text
单机创作者
  - 网文 / 短剧 / 漫画 / AI 视频创作者
  - 一人项目，不需要协作
  - 已有写作习惯，会复制粘贴自己的稿子
  - 期待 AI 不替他写，而是帮他做"分场 / 分镜 / 整理"
```

不在本期服务的角色：团队、编辑、出版方、付费用户体系下的高级用户。

---

## 3. 核心用户故事

```text
US1：作为创作者，我要新建一个小说项目并命名，避免和其它项目混在一起。
US2：作为创作者，我要把一章小说粘贴到编辑器里，能像写文档一样修改。
US3：作为创作者，我要把章节切分成若干场景，每个场景能独立查看与编辑。
US4：作为创作者，我要为每个场景填写发生地点、出场角色、目标和冲突。
US5：作为创作者，我要让 AI 帮我把当前场景拆成 5–10 个镜头，并能逐条修改。
US6：作为创作者，我要给每个镜头补充景别、机位、镜头运动和动作描述。
US7：作为创作者，我要随时保存项目，关电脑后下次打开内容还在。
US8：作为创作者，我要看到 AI 任务正在运行 / 完成 / 失败，并可重试或取消。
US9：作为创作者，我要能切换深 / 浅主题，长时间写作不刺眼。
US10：作为创作者，我要能在不联网的情况下使用 Mock AI，先把流程跑通。
```

---

## 4. 功能范围

### 4.1 必做（P0）

```text
F1  项目管理：新建项目、项目列表、打开项目、删除项目（带二次确认）
F2  章节管理：新建章节、章节列表（左侧大纲）、重命名、删除、排序（拖拽）
F3  章节编辑器：纯文本编辑、自动保存（节流 1s）、字数统计
F4  场景结构化：手动新建场景卡、绑定章节、填写 title/summary/location/characters/goal/conflict
F5  AI 拆场景：选中一段章节文字 → 调用 novel-outline Skill → 返回场景卡草稿
F6  AI 拆镜头：在场景卡上点「生成镜头」 → 调用 story-to-shot Skill → 返回 5–10 个 Shot
F7  镜头编辑：编辑 Shot 的所有字段；增加 / 删除 / 排序
F8  本地持久化：单文件 .novelproj.json，使用 File System Access API
F9  任务中心：右下角任务面板，显示 AI 任务状态（pending / running / done / failed）
F10 Mock AI Provider：固定模板返回结构化结果，保证流程能跑
F11 主题切换：深 / 浅
F12 错误兜底：AI 失败时给清晰提示并支持重试
```

### 4.2 推荐（P1，时间允许才做）

```text
F13 Character / Location 卡片管理：基础 CRUD
F14 文本选区与场景的位置绑定（rawTextSpan），可在编辑器中高亮
F15 OpenRouter 真 Provider：仅用于 demo
F16 项目导入 / 导出（.novelproj.json）
F17 最近打开项目列表
```

### 4.3 不做（P2，明确划掉）

```text
N1 图像 / 视频 / 3D / 剧本输出
N2 用户登录、云同步、多人协作
N3 付费 License、插件市场
N4 富文本编辑器（不上 TipTap / Lexical）
N5 移动端适配
N6 全文检索、全局替换
N7 版本历史、撤销栈持久化
```

---

## 5. 数据模型

```ts
// packages/novel-core/src/types.ts

export interface NovelProject {
  schemaVersion: 1;
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  settings: { theme: 'light' | 'dark' };

  chapters: Chapter[];
  scenes: Scene[];
  shots: Shot[];
  characters: Character[];
  locations: Location[];
}

export interface Chapter {
  id: string;
  order: number;
  title: string;
  rawText: string;
}

export interface Scene {
  id: string;
  chapterId: string;
  order: number;
  title: string;
  summary: string;
  locationId?: string;
  characterIds: string[];
  goal?: string;
  conflict?: string;
  mood?: string;
  rawTextSpan?: { start: number; end: number };
}

export interface Shot {
  id: string;
  sceneId: string;
  order: number;
  shotSize?: 'ECU' | 'CU' | 'MS' | 'WS' | 'EWS';
  cameraAngle?: 'eye' | 'high' | 'low' | 'dutch' | 'topdown';
  cameraMovement?: 'static' | 'pan' | 'tilt' | 'dolly' | 'tracking' | 'zoom';
  composition?: string;
  durationSec?: number;
  actionDescription?: string;
  dialogue?: string;
  imagePromptSeed?: string;
  videoPromptSeed?: string;
}

export interface Character {
  id: string;
  name: string;
  shortDescription?: string;
  appearance?: string;
  tags: string[];
}

export interface Location {
  id: string;
  name: string;
  shortDescription?: string;
  tags: string[];
}
```

---

## 6. 信息架构与页面结构

```text
/novel                      项目列表页
  ├── + 新建项目
  ├── 最近打开
  └── 项目卡片（点击进入）

/novel/:projectId           项目主界面
  ├── 顶栏：项目名 / 主题切换 / 保存状态 / 任务图标
  ├── 左栏：章节大纲 + 角色 / 地点 标签
  ├── 中栏：当前章节文本编辑器
  ├── 右栏：当前章节场景卡列表
  └── 右下：任务面板（折叠）

/novel/:projectId/scene/:sceneId   场景详情页（可弹层或独立页）
  ├── 场景元数据编辑（title/summary/location/characters/goal/conflict）
  ├── 场景对应原文段落（高亮）
  └── 镜头列表（卡片形态，可拖拽排序）
```

---

## 7. 关键交互流

### 7.1 新建项目流

```text
点击"新建项目" → 弹窗输入项目名 → 选择本地保存位置（File System Access API）
→ 创建空 .novelproj.json → 自动跳转到项目主界面
```

### 7.2 写小说流

```text
打开项目 → 选择章节（或新建）→ 在中栏编辑器粘贴 / 输入正文
→ 编辑器节流 1s 自动保存到内存 store → store 节流 3s 写入磁盘文件
→ 顶栏显示"已保存"或"保存中"
```

### 7.3 AI 拆场景流

```text
在编辑器中选中一段文字（或不选 = 整章）→ 右键或 Ctrl+/ → 选择"拆为场景卡"
→ 任务面板新增任务 task: scene.extract → 调用 novel-outline Skill + Mock Provider
→ 返回 1–N 个场景草稿 → 弹出预览面板让用户确认 → 确认后写入 scenes
→ 任务变为 done
```

### 7.4 AI 拆镜头流

```text
进入场景详情 → 点击"生成镜头" → 任务 task: shot.extract → story-to-shot Skill
→ 返回 5–10 个 Shot 草稿 → 直接 append 到该场景的 shots（不弹预览）
→ 用户在镜头卡片上逐个编辑
```

### 7.5 任务失败重试流

```text
任务面板每条任务三态：running / done / failed
失败 → 显示错误摘要 + "重试"按钮 → 重试时复用同一 task input
```

---

## 8. 非功能需求

```text
NFR1 性能：粘贴 5 万字章节，编辑器输入延迟 < 50ms
NFR2 自动保存：编辑停顿 3s 内必须落盘
NFR3 启动：从命令行启动到打开最近项目 ≤ 3s
NFR4 容灾：保存失败必须有用户可见提示，不能静默丢数据
NFR5 可观察：所有 AI 任务必须有 task.id / 起止时间 / 输入哈希 / 输出长度
NFR6 国际化：本期仅中文 UI，但所有文案集中在 i18n.ts，便于后续替换
NFR7 隐私：本期所有数据仅落本地磁盘，不上传任何外部服务（Mock Provider 不联网）
```

---

## 9. AI 任务与 Skill 设计

### 9.1 涉及的 Skill

```text
.claude/skills/novel-outline/SKILL.md
  作用：把一段小说文本拆成场景卡（title / summary / location / characters / goal / conflict）
  输入：rawText, optional charactersHint, optional locationsHint
  输出：Scene[]（不含 id / order，由前端补）

.claude/skills/story-to-shot/SKILL.md
  作用：把一个场景拆成 5–10 个 Shot
  输入：Scene + 上下文章节段落
  输出：Shot[]（不含 id / order）
```

### 9.2 Task 类型

```text
task: scene.extract
task: shot.extract
task: scene.refine（可选 P1）
task: shot.refine（可选 P1）
```

### 9.3 Provider

```text
MockTextProvider：本期默认，离线可用
OpenRouterTextProvider：可选，仅用于 demo 录屏
```

---

## 10. 验收标准（Definition of Done）

```text
DoD1 本地全新环境从 git clone 到看到项目列表页 ≤ 5 分钟
DoD2 创建项目 → 写章节 → 拆场景 → 拆镜头 → 关闭重启 → 数据完整 全流程跑通
DoD3 AI 任务在 Mock 模式下 100% 成功，在 OpenRouter 模式下能跑成功 1 次
DoD4 主题切换无残留样式
DoD5 至少 1 名外部测试用户跑完一遍并写出反馈
DoD6 错误路径有兜底：保存失败、Skill 失败、文件被占用
DoD7 docs/mvp 下所有文档同步更新，ROADMAP-PLUGIN-FIRST 中"Novel Editor Core"状态从 planned → in-progress
```

---

## 11. 里程碑（建议两周）

```text
Day 1   项目脚手架 + 路由 + 项目列表 + 新建项目 + 本地存储读写
Day 2   章节大纲 + 简易编辑器 + 自动保存
Day 3   场景卡数据结构 + 手动新建 + 列表展示
Day 4   场景详情页 + 镜头数据结构 + 手动新建 / 编辑
Day 5   任务中心 UI + Mock TextProvider + Skill Loader 最小版
Day 6   novel-outline Skill 接入 + scene.extract 任务 + 预览确认
Day 7   story-to-shot Skill 接入 + shot.extract 任务
Day 8   主题切换 + 文案润色 + 空状态 / 错误态
Day 9   导入导出 + 最近项目
Day 10  自测 + Bug 修复 + 拉外部用户试用
Day 11  根据反馈修最关键 3 个问题
Day 12  录制 2 分钟 demo 视频
Day 13  Buffer 日（用于追赶 / 修 bug）
Day 14  收尾、写后记、规划下一阶段
```

---

## 12. 风险登记

```text
R1 编辑器选区与 rawTextSpan 同步复杂 → 降级为整段绑定
R2 大文本性能 → 早期用 contentEditable 即可，必要时切换到虚拟滚动
R3 LLM 输出格式不稳 → Mock 返回固定 JSON；真实 Provider 用 JSON Schema 强约束
R4 File System Access API 浏览器兼容性 → 不支持时降级为下载 / 上传
R5 时间不够 → P1 全部砍掉，确保 P0 闭环
```

---

## 13. 不解决的问题清单（明确转交后续）

```text
- 富文本格式（粗体、引用、注释）
- 多版本草稿管理
- 角色 / 地点的视觉资产
- 跨章节一致性检查
- 多人协作
- 任何形式的 LLM Token 计费
```

---

*[READY_FOR_REVIEW]*
