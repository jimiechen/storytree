# Phase 0 前置工作清单 (Pre-Phase 0 Checklist)

> **角色**: 项目协调 Agent (Kimi-K2.6)  
> **任务ID**: PRE-PHASE0-20260515  
> **日期**: 2026-05-15  
> **目标**: 为 OpenCode Creative Studio 插件平台 Roadmap 执行前置清理、备份与准备工作  
> **路书来源**: `caiode/docs/tabbit/TabAI会话_1778857995607.md`

---

## 一、工作空间清理 (Workspace Cleanup)

### 1.1 已删除的不合规/临时文件

| # | 文件路径 | 类型 | 删除原因 |
|---|---------|------|---------|
| 1 | `.trae/documents/1.md` | 不合规工作空间文件 | 违反 model-auto-file.md 命名规范 (纯数字) |
| 2 | `.trae/documents/2.md` | 不合规工作空间文件 | 违反 model-auto-file.md 命名规范 (纯数字) |
| 3 | `.trae/documents/3.md` | 不合规工作空间文件 | 违反 model-auto-file.md 命名规范 (纯数字) |
| 4 | `WEEK0-EXECUTION-EVIDENCE.md.new` | 临时文件 | 已完成历史使命，已备份 |
| 5 | `WEEK0-GO-NOGO-CHECKLIST.md.new` | 临时文件 | 已完成历史使命，已备份 |
| 6 | `WEEK0-NOVEL-EDITOR-FEASIBILITY-CHECK.md.new` | 临时文件 | 已完成历史使命，已备份 |
| 7 | `WEEK0-OPENCODE-1.4.0-BUILD-RUN-CHECK.md.new` | 临时文件 | 已完成历史使命，已备份 |
| 8 | `WEEK0-OPENCODE-1.4.0-DEPENDENCY-CHECK.md.new` | 临时文件 | 已完成历史使命，已备份 |

### 1.2 清理后目录状态

- `.trae/documents/` 目录：已无非合规数字命名文件
- 根目录：已无 `WEEK0-*.md.new` 临时文件
- `workspaces/` 目录：不存在（无需清理）

---

## 二、文件备份 (Backup)

### 2.1 备份位置

```
backups/pre-phase0-20260515/
├── 1.md.bak                          # 原 .trae/documents/1.md
├── 2.md.bak                          # 原 .trae/documents/2.md
├── 3.md.bak                          # 原 .trae/documents/3.md
├── WEEK0-EXECUTION-EVIDENCE.md.new   # Week 0 执行证据
├── WEEK0-GO-NOGO-C