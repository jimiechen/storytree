# VIBE_TASK_SPEC.md - Vibecoding 任务卡规范

> **版本**: v0.1  
> **日期**: 2026-05-31  
> **状态**: 生效中  
> **Schema**: JSON Schema 格式

---

## 一、任务卡格式规范

### 1.1 7 段式结构（强制）

每个 Vibecoding 任务卡必须包含以下 7 个段落，顺序不可调换：

```
[VIBE] <任务编号>
[WHY ] <为什么做>
[WHAT] <做什么>
[HOW ] <怎么做>
[DONT] <禁止做什么>
[DONE] <验收标准>
[VIBE_TONE] <风格/氛围要求>
```

### 1.2 强制字段说明

| 字段 | 用途 | 强制/可选 |
|------|------|----------|
| `[VIBE]` | 任务唯一编号 | 强制 |
| `[WHY]` | 业务价值说明 | 强制 |
| `[WHAT]` | 具体实现描述 | 强制 |
| `[HOW]` | 技术实现路径 | 强制 |
| `[DONT]` | 禁止行为 | 强制 |
| `[DONE]` | 验收标准 | 强制 |
| `[VIBE_TONE]` | 设计风格要求 | 强制 |

---

## 二、JSON Schema 定义

### 2.1 VibeTask Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://storytree.example.com/schemas/vibe-task.json",
  "title": "VibeTask",
  "description": "StoryTree2 Vibecoding 任务卡 schema",
  "type": "object",
  "required": ["id", "module", "sections", "metadata"],
  "properties": {
    "id": {
      "type": "string",
      "pattern": "^[A-Z]+-[A-Z]+\\d{2}-T\\d{3}$",
      "examples": ["S0-T01-T001", "M1-S1-T03"]
    },
    "module": {
      "type": "string",
      "enum": ["M0", "M1", "M2", "M3", "M4", "M5", "PRECHECK", "BOUNDARY"],
      "description": "所属模块（对应 MODULE_MAP.md）"
    },
    "sections": {
      "type": "object",
      "required": ["VIBE", "WHY", "WHAT", "HOW", "DONT", "DONE", "VIBE_TONE"],
      "properties": {
        "VIBE": {
          "type": "string",
          "pattern": "^\\[VIBE\\]",
          "description": "任务编号"
        },
        "WHY": {
          "type": "string",
          "minLength": 20,
          "description": "为什么做，业务价值"
        },
        "WHAT": {
          "type": "string",
          "minLength": 50,
          "description": "具体做什么，完整描述"
        },
        "HOW": {
          "type": "string",
          "minLength": 50,
          "description": "如何做，实现路径"
        },
        "DONT": {
          "type": "string",
          "minLength": 20,
          "description": "禁止做什么"
        },
        "DONE": {
          "type": "string",
          "minLength": 50,
          "description": "验收标准"
        },
        "VIBE_TONE": {
          "type": "string",
          "minLength": 10,
          "description": "设计风格要求"
        }
      }
    },
    "metadata": {
      "type": "object",
      "required": ["priority", "owner", "sprint"],
      "properties": {
        "priority": {
          "type": "string",
          "enum": ["P0", "P1", "P2", "P3"]
        },
        "owner": {
          "type": "string",
          "description": "负责人（待分配）"
        },
        "sprint": {
          "type": "string",
          "pattern": "^sprint-\\d+$"
        },
        "touchesBoundary": {
          "type": "boolean",
          "description": "是否触碰 BOUNDARY.md"
        },
        "redTestFile": {
          "type": "string",
          "pattern": "^tests/.+\\.spec\\.ts$",
          "description": "对应的红测文件路径"
        },
        "estimatedHours": {
          "type": "number",
          "minimum": 0.5,
          "maximum": 40
        }
      }
    }
  }
}
```

### 2.2 示例任务卡（符合 Schema）

```markdown
[VIBE] S0-T01-T001
[WHY ] 在 Trae 写任何业务代码之前，先把仓库现状摸清，避免重复造轮子。
[WHAT] 对 caiode/opencode-1.4.0/packages/app/src/{novel,novel-3d,novel-canvas} 做代码审计，
       输出 docs/precheck/novel-modules-audit.md，按 PC-2 模板给完成度评分。
[HOW ] 用 `tokei` 与 `bun test --coverage` 双数据源；
       每个子模块给出 "类型完整度 / 接口稳定度 / UI 覆盖度 / 测试覆盖率" 四项 0~100 分；
       结尾给出 "复用 / 扩展 / 重写" 建议。
[DONT] 不要修改任何源码；不要给出主观褒贬；不要把 novel-3d 列入 Sprint 1 范围。
[DONE] ① 报告通过 markdownlint；② 在 DECISION_LOG.md 追加"novel-3d 是否冻结"的 pending 提案。
[VIBE_TONE] 像做体检报告一样冷静、克制、用数据说话。
```

对应 JSON：

```json
{
  "id": "S0-T01-T001",
  "module": "PRECHECK",
  "sections": {
    "VIBE": "[VIBE] S0-T01-T001",
    "WHY": "在 Trae 写任何业务代码之前，先把仓库现状摸清，避免重复造轮子。",
    "WHAT": "对 caiode/opencode-1.4.0/packages/app/src/{novel,novel-3d,novel-canvas} 做代码审计...",
    "HOW": "用 `tokei` 与 `bun test --coverage` 双数据源...",
    "DONT": "不要修改任何源码；不要给出主观褒贬；不要把 novel-3d 列入 Sprint 1 范围。",
    "DONE": "① 报告通过 markdownlint；② 在 DECISION_LOG.md 追加...",
    "VIBE_TONE": "像做体检报告一样冷静、克制、用数据说话。"
  },
  "metadata": {
    "priority": "P0",
    "owner": "待分配",
    "sprint": "sprint-0",
    "touchesBoundary": false,
    "redTestFile": null,
    "estimatedHours": 4
  }
}
```

---

## 三、任务编号规范

### 3.1 编号格式

```
<前缀>-<Sprint编号>-T<序号>
```

| 前缀 | 含义 |
|------|------|
| `S0` | Sprint 0（地基阶段） |
| `S1` | Sprint 1（M1 创作工作台） |
| `M1-S1` | M1 模块 Sprint 1 |
| `PRECHECK` | 前置检查任务 |
| `BOUNDARY` | 边界文档任务 |

### 3.2 示例

| 编号 | 含义 |
|------|------|
| `S0-T01` | Sprint 0 第 1 个任务 |
| `S0-T02` | Sprint 0 第 2 个任务 |
| `M1-S1-T01` | M1 模块 Sprint 1 第 1 个任务 |
| `PRECHECK-T01` | 前置检查第 1 个任务 |

---

## 四、任务卡存放规范

### 4.1 目录结构

```
docs/
└── tasks/
    ├── sprint-0/
    │   ├── vibe-tasks.md      # 所有 Sprint 0 任务卡
    │   └── vibe-tasks.json    # 验证用的 JSON
    ├── sprint-1/
    │   ├── vibe-tasks.md
    │   └── vibe-tasks.json
    ├── precheck/
    │   └── vibe-tasks.md
    └── boundary/
        └── vibe-tasks.md
```

### 4.2 文件命名

- `vibe-tasks.md` - 人类可读的任务卡
- `vibe-tasks.json` - Schema 验证用的 JSON

---

## 五、Schema 验证

### 5.1 验证脚本

```bash
# 安装 ajv
bun add -D ajv ajv-formats

# 验证所有任务卡
pnpm validate:tasks
```

### 5.2 验证规则

1. **格式检查**: 7 个段落必须完整
2. **编号检查**: 必须符合正则 `^[A-Z]+-[A-Z]+\d{2}-T\d{3}$`
3. **模块检查**: module 必须在允许列表中
4. **优先级检查**: priority 必须是 P0/P1/P2/P3
5. **边界检查**: touchesBoundary 为 true 时必须检查 BOUNDARY.md

---

## 六、TDD 绑定

### 6.1 强制绑定

每个任务卡**必须**关联一个红测文件：

```yaml
metadata:
  redTestFile: "tests/unit/plugin-novel-ai/outline.spec.ts"
```

### 6.2 验证流程

```
任务卡创建
    ↓
关联红测文件
    ↓
编写 Red 测试 (red:)
    ↓
实现功能 (green:)
    ↓
重构优化 (refactor:)
    ↓
任务完成
```

---

## 七、禁止事项

| 禁止 | 原因 |
|------|------|
| 任务卡不完整 | 无法验证 |
| 编号不规范 | 无法追踪 |
| touchesBoundary 为 false 但实际触犯了 | 违反宪法 |
| 任务卡无红测绑定 | 违反 TDD 流程 |

---

*本文档是 StoryTree2 Vibecoding 任务卡的强制规范，所有任务卡必须符合此 Schema。*
