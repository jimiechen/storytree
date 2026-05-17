# SKILL-DEFINITION-AND-USAGE.md

> **角色**: 项目协调 Agent (Kimi-K2.6)  
> **任务ID**: DOC-PHASE0-011  
> **日期**: 2026-05-15  
> **版本**: v1.0  
> **状态**: [READY_FOR_REVIEW]

---

## 一、Skill 定义

**Skill = Agent 按需加载的 SKILL.md 任务说明包**

Skill 不是产品插件，不是 Provider，不是 Tool。它只是告诉 Agent 如何完成一个创作任务。

---

## 二、Skill 目录结构

```text
.claude/skills/
├── novel-outline/
│   └── SKILL.md
├── novel-to-script/
│   └── SKILL.md
├── story-to-shot/
│   └── SKILL.md
├── shot-camera-plan/
│   └── SKILL.md
├── shot-to-image-prompt/
│   └── SKILL.md
├── shot-to-video-prompt/
│   └── SKILL.md
├── timeline-assembly/
│   └── SKILL.md
└── consistency-check/
    └── SKILL.md
```

---

## 三、Skill 文件格式

### 3.1 标准格式

```markdown
---
name: story-to-shot
description: Convert a novel scene or script scene into structured storyboard shots with camera, composition, motion, duration, and prompt seeds.
when_to_use: Use when a task requires storyboard generation, shot breakdown, camera planning, or visual scene decomposition.
---

# Story to Shot

## Purpose

Transform narrative or script content into production-ready storyboard shot data.

## Required Plugin Capability

Use the `storyboard.createShots` capability when available.

## Required Context

Read:
- selected chapter or scene
- character cards
- location descriptions
- visual style settings
- continuity notes

## Workflow

1. Identify the scene goal.
2. Extract action, emotion, conflict, location, and characters.
3. Split the scene into visual beats.
4. Convert each beat into 1-3 shots.
5. For each shot, define shot size, camera angle, camera movement, composition, duration, image prompt seed, and video prompt seed.
6. Return structured JSON that matches the Storyboard Shot schema.

## Rules

- Do not generate images directly.
- Do not generate videos directly.
- Do not invent existing assets.
- Save generated shots through the task output channel.
```

### 3.2 关键字段

| 字段 | 说明 |
|------|------|
| `name` | Skill 唯一标识 |
| `description` | Skill 功能描述 |
| `when_to_use` | 触发条件 |
| `Required Plugin Capability` | 需要调用的插件能力 |
| `Required Context` | 需要读取的上下文 |
| `Workflow` | 执行步骤 |
| `Rules` | 约束规则 |

---

## 四、Skill 与 Plugin 的关系

```text
Skill 不是 Plugin
Plugin 不是 Skill

Skill 告诉 Agent 怎么做
Plugin 提供 Agent 能用的能力

Skill 调用 Plugin Capability
Plugin Capability 暴露给 Agent 使用
```

### 4.1 调用链路

```text
用户在 UI 发起任务
  ↓
Core 创建 Creative Task
  ↓
Task Runtime 检查 License Gate
  ↓
Task Runtime 选择并加载 Skill
  ↓
Skill Loader 读取 .claude/skills/<name>/SKILL.md
  ↓
Agent 根据 Skill 指令调用 Plugin Capability
  ↓
Plugin Capability 调用 Tool / Provider
  ↓
Asset Library 保存产物
  ↓
Task Center 更新状态
```

### 4.2 示例

```text
story-to-shot Skill
  不是 Storyboard Plugin
  不是 OpenRouter
  不是分镜 UI
  它只是告诉 Agent 如何把小说场景拆成镜头

Storyboard Studio Plugin
  是产品模块
  提供分镜页面、Shot 数据结构、分镜编辑器、导出能力

OpenRouter Provider
  是 LLM 调用适配器
  负责模型、密钥、计费、重试、错误处理

WriteAssetTool
  是具体工具
  负责把生成结果写入 Asset Library
```

---

## 五、首批 Skill 列表

| Skill | 用途 | 对应 Plugin Capability |
|-------|------|----------------------|
| novel-outline | 小说大纲生成 | - |
| novel-to-script | 小说转剧本 | script.convertFromNovel |
| story-to-shot | 场景拆镜头 | storyboard.createShots |
| shot-camera-plan | 镜头相机规划 | storyboard.refineShot |
| shot-to-image-prompt | 镜头转图像提示词 | imagePrompt.generate |
| shot-to-video-prompt | 镜头转视频提示词 | videoPrompt.generate |
| timeline-assembly | 时间线组装 | timeline.assemble |
| consistency-check | 一致性检查 | consistency.check |

---

*[READY_FOR_REVIEW]*
