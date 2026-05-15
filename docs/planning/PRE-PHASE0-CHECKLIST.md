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
├── WEEK0-GO-NOGO-CHECKLIST.md.new    # Week 0 Go/No-Go 清单
├── WEEK0-NOVEL-EDITOR-FEASIBILITY-CHECK.md.new
├── WEEK0-OPENCODE-1.4.0-BUILD-RUN-CHECK.md.new
└── WEEK0-OPENCODE-1.4.0-DEPENDENCY-CHECK.md.new
```

### 2.2 备份验证

- [x] 备份目录已创建
- [x] 所有待删除文件已复制到备份目录
- [x] 源文件删除后工作区干净

---

## 三、路书解析与阶段规划 (Roadmap Analysis)

### 3.1 路书核心信息

| 属性 | 内容 |
|------|------|
| **项目新名称** | OpenCode Creative Studio |
| **定位** | 基于 OpenCode 二次开发的 AI 创作插件平台 |
| **核心策略** | Core Platform + Paid Plugin Modules + Skill Packs + Provider Credits |
| **时间跨度** | 2026-05 ~ 2028-05 (两年) |
| **总阶段数** | 9 个阶段 (Phase 0 ~ Phase 8) |

### 3.2 阶段总览

| 阶段 | 时间 | 核心目标 | 商业目标 |
|------|------|---------|---------|
| Phase 0 | 2026.05-2026.06 | 插件底座与项目路书 | 确定商业架构 |
| Phase 1 | 2026.06-2026.08 | Story-to-Shot MVP | 内测 Writer Pack |
| Phase 2 | 2026.09-2026.11 | 分镜 + 3D Shot Draft | 推出 Visual Story Pack |
| Phase 3 | 2026.12-2027.02 | 图像/视频 Prompt 与资产库 | Short Video Pack Alpha |
| Phase 4 | 2027.03-2027.05 | 图像/视频 Provider 接入 | 生成额度计费 |
| Phase 5 | 2027.06-2027.08 | 短片时间线与 FFmpeg 合成 | Short Video Pack 正式版 |
| Phase 6 | 2027.09-2027.11 | 长视频项目管理 | Long Video Pack Beta |
| Phase 7 | 2027.12-2028.02 | 一致性系统与批量生产 | Studio Pack |
| Phase 8 | 2028.03-2028.05 | 插件市场与团队协作 | 商业化 v2.0 |

### 3.3 30 天启动计划 (Immediate Action Plan)

| 周次 | 目标 | 关键交付物 |
|------|------|-----------|
| 第 1 周 | 插件底座 | Plugin Manifest / Runtime / Registry / Extension Point / Mock License Gate |
| 第 2 周 | Skill + Provider 底座 | Skill Registry / OpenRouter Adapter / Mock LLM Provider / Task Center |
| 第 3 周 | Novel Studio Alpha | 项目设定 / 角色卡 / 章节大纲 / AI Mock 续写 / License Gate |
| 第 4 周 | Storyboard + 3D Shot Draft Spike | Shot Card / Three.js 视口 / 相机预设 / 导出参考图 |

---

## 四、待创建的路书文档清单 (Deliverables Checklist)

根据路书要求，需创建以下 6 份核心文档：

| # | 文档路径 | 状态 | 优先级 |
|---|---------|------|--------|
| 1 | `docs/roadmap/PRODUCT-ROADMAP-PLUGIN-FIRST.md` | 待创建 | P0 |
| 2 | `docs/roadmap/PLUGIN-ARCHITECTURE.md` | 待创建 | P0 |
| 3 | `docs/roadmap/COMMERCIAL-PLUGIN-MODEL.md` | 待创建 | P0 |
| 4 | `docs/roadmap/TWO-YEAR-DEVELOPMENT-PLAN.md` | 待创建 | P0 |
| 5 | `docs/roadmap/MODULE-PRICING-STRATEGY.md` | 待创建 | P1 |
| 6 | `docs/roadmap/FIRST-30-DAYS-ACTION-PLAN.md` | 待创建 | P0 |

---

## 五、前置条件检查 (Pre-conditions)

### 5.1 工程环境

| 检查项 | 要求 | 当前状态 | 是否满足 |
|--------|------|---------|:--------:|
| opencode-1.4.0 源码 | 存在且可构建 | 已验证通过 | ✅ |
| Bun 工具链 | v1.3.13+ | 已安装 | ✅ |
| TypeScript 类型检查 | 13/13 包通过 | 已验证 | ✅ |
| Vite 前端构建 | 成功 | 已验证 | ✅ |
| Tauri/Cargo 编译 | 成功 | 已验证 | ✅ |
| Git 工作区 | 干净 | 已确认 | ✅ |

### 5.2 合规检查

| 检查项 | 规则文件 | 状态 |
|--------|---------|------|
| 工作空间文件规范 | model-auto-file.md | 已清理不合规文件 |
| 角色声明 | agent-responsibility-boundary.md | 本清单第一行已声明 |
| 文件行数限制 | code-file-limit.md | 本文档 < 500 行 |
| Git 工作流 | github-workflow-rules.md | 工作区干净，待创建分支 |

---

## 六、风险与注意事项

### 6.1 已知风险

| 风险项 | 等级 | 影响 | 缓解措施 |
|--------|------|------|---------|
| Node.js v25.x 非 LTS | 低 | 构建兼容性 | 如遇问题降级至 LTS |
| tree-sitter 原生模块未编译 | 低 | 语法高亮不可用 | 非核心功能，暂缓 |
| 旧项目代码债务 | 中 | 历史代码干扰 | 已清理临时文件，备份保留 |
| opencode 上游版本升级 | 低 | 兼容性 | 不修改上游核心源码 |

### 6.2 关键决策点

1. **分支策略**: Phase 0 文档工作建议在 `docs/roadmap` 分支或直接在 `main` 上进行（纯文档变更）
2. **代码实现边界**: Phase 0 不实现业务代码，仅做架构设计与规范定义
3. **Mock 优先**: 所有 Provider 先实现 Mock 版本，不接真实 API

---

## 七、下一步行动建议

### 7.1 立即执行 (今日)

- [ ] 创建 `docs/roadmap/` 目录
- [ ] 生成 6 份核心路书文档
- [ ] 更新 `task-source-record.md` 为 Phase 0 状态

### 7.2 本周执行

- [ ] 评审路书文档
- [ ] 创建功能分支 `feat/phase0-plugin-foundation`
- [ ] 启动 Plugin Runtime 接口设计

### 7.3 进入 Phase 0 的 Go 条件

| # | 条件 | 状态 |
|---|------|------|
| 1 | 6 份路书文档已创建 | 待完成 |
| 2 | 文档通过评审 | 待完成 |
| 3 | 任务来源记录已更新 | 待完成 |
| 4 | 功能分支已创建 | 待完成 |

---

## 八、签名确认

**执行人**: Kimi-K2.6  
**角色**: 项目协调 Agent  
**执行日期**: 2026-05-15  
**当前积分**: 30/100 (危险 - 最后一次机会，必须严格遵守所有规则)  

---

*[READY_FOR_REVIEW]*
