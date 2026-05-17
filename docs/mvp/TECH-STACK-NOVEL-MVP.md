# TECH-STACK-NOVEL-MVP.md

> **角色**: 项目协调 Agent (Kimi-K2.6)  
> **任务ID**: MVP-TECH-001  
> **日期**: 2026-05-15  
> **版本**: v1.0  
> **状态**: [READY_FOR_REVIEW]

---

## 一、技术栈决策

| 层级 | 技术选型 | 决策理由 |
|------|---------|---------|
| UI 框架 | Solid.js | 与 3D Shot 一致，避免双框架；性能优秀 |
| 编辑器 | contentEditable | MVP 不上 TipTap / Lexical / Slate，避免 ProseMirror 体系复杂度 |
| 状态管理 | Solid `createStore` + signal | 与 shot-3d-store 风格一致 |
| 路由 | Solid Router | 新增 `/novel`、`/novel/:projectId`、`/novel/:projectId/chapter/:chapterId` |
| LLM 通道 | `TextProvider.complete(prompt, opts) → AsyncIterator<string>` | 本期实现 MockTextProvider + OpenRouterTextProvider（可选） |
| Skill 落点 | `.claude/skills/novel-outline/SKILL.md` + `.claude/skills/story-to-shot/SKILL.md` | 必须在 T0 前把骨架写出来 |
| 错误监控 | `console.*` + 最简 `logger.ts` | MVP 不上 Sentry |
| ID 生成 | `nanoid` / `crypto.randomUUID` | 统一标准，不用时间戳 |

---

## 二、LLM 通道接口

```typescript
interface TextProvider {
  complete(prompt: string, opts?: CompleteOptions): AsyncIterator<string>
}

interface CompleteOptions {
  model?: string
  temperature?: number
  maxTokens?: number
  systemPrompt?: string
}

// 本期实现
class MockTextProvider implements TextProvider {
  // 固定模板返回结构化结果
}

class OpenRouterTextProvider implements TextProvider {
  // 可选，仅用于 demo 演示
}
```

---

## 三、Skill 设计

### 3.1 novel-outline Skill

```text
.claude/skills/novel-outline/SKILL.md
  作用：把小说文本拆成场景卡（title / summary / location / characters / goal / conflict）
  输入：rawText, optional charactersHint, optional locationsHint
  输出：Scene[]（不含 id / order，由前端补）
```

### 3.2 story-to-shot Skill

```text
.claude/skills/story-to-shot/SKILL.md
  作用：把一个场景拆成 5–10 个 Shot
  输入：Scene + 上下文章节段落
  输出：Shot[]（不含 id / order）
```

---

## 四、持久化方案

### 4.1 MVP 阶段

```text
本地单文件 .novelproj.json
使用 File System Access API
不支持时降级为下载 / 上传
```

### 4.2 Schema 版本

```text
schemaVersion: 2
预留 migration 钩子（不写实现，先占位）
```

---

## 五、快捷键集合

| 快捷键 | 功能 |
|--------|------|
| Ctrl+S | 保存 |
| Ctrl+N | 新场景 |
| Ctrl+Shift+S | 拆镜 |
| Ctrl+/ | 唤起 Skill |

---

*[READY_FOR_REVIEW]*
