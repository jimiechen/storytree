# Stitch 设计稿还原规则 (Stitch Design Fidelity Rule)

> **⚠️ 全局生效**: 此规则适用于所有对应 Stitch 原型的页面/组件开发，所有 Agent 必须无条件遵守。
> **生效范围**: 从 Phase 1.1 开始，所有新开发和重构的页面/组件
> **版本**: v1.0 | **日期**: 2026-06-12 | **来源**: TabAI 主控评审会话_1781241815940

---

## 核心原则

**Stitch 原型是视觉单一真源。** 所有对应原型的页面、弹窗、面板、组件，必须以 `stitch/stitch_ai_novel_writing_dashboard/` 下的截图和 code.html 为准。

**功能可以分阶段交付，但本阶段承诺实现的页面必须视觉接近原型。**
不允许用线框 UI、默认边框、临时布局作为最终交付。

---

## 一、强制执行清单（每次任务必须检查）

### 1. 任务理解汇报必须包含「设计稿对照分析」

每个 Phase 的任务理解汇报文档必须新增以下章节：

```markdown
## 设计稿对照分析

### 1. 对应原型
- 原型编号: XX_页面名称
- 截图路径: stitch/.../screen.png
- HTML 参考: stitch/.../code.html

### 2. 视觉 Token 要求
| 维度 | 原型值 | 实现方案 |
|------|--------|---------|
| 主色 | #6b38d4 | primary / text-primary |
| 背景 | #f8f9ff | bg-background |
| 表面 | #f8f9ff | bg-surface |
| 字体(标题) | Plus Jakarta Sans | font-headline |
| 字体(正文) | Work Sans | font-body |
| 图标 | Material Symbols Outlined | icon-* class |

### 3. 本阶段必须还原的视觉范围
- [ ] 页面布局结构
- [ ] 颜色和背景
- [ ] 字体大小、字重、行高
- [ ] 卡片圆角、阴影、边框
- [ ] 间距体系
- [ ] 按钮、输入框、Tab、卡片等组件状态
- [ ] 空状态、加载态、错误态

### 4. 本阶段明确不还原的范围
- （列出延期项及原因）

### 5. 关键组件清单与原型对照
| 组件 | 原型位置 | 还原优先级 |
|------|---------|-----------|
| ... | ... | P0/P1/P2 |
```

### 2. 完成报告必须包含「视觉还原验收」

```markdown
## 视觉还原验收

### 1. 原型目标说明
（引用原型截图的关键视觉特征）

### 2. 当前实现截图
（本地 dev server 截图）

### 3. 差异清单
| # | 区域 | 原型 | 实现 | 差距级别 | 是否接受 |
|---|------|------|------|---------|---------|

### 4. 已完成还原项
（逐项勾选）

### 5. 未完成还原项与原因
（每项必须有延期理由）

### 6. 视觉验收结论
[ ] 通过 — 可进入下一阶段
[ ] 有条件通过 — 差距在可接受范围，下一阶段补齐
[ ] 不通过 — 必须在本阶段修复后重新提交
```

---

## 二、设计令牌体系（从原型提取）

所有颜色、字体、间距、圆角、阴影必须使用以下令牌，禁止硬编码随机值。

### 2.1 颜色系统

```
主色系:
  primary:        #6b38d6   (深紫)
  primary-light:  #8455ef   (亮紫)
  surface-tint:   #6d3bd7   (表面色调)
  on-primary:     #ffffff   (主色上文字)

背景系:
  background:     #f8f9ff   (全局背景, 淡蓝白)
  surface:        #f8f9ff   (表面)
  surface-bright: #ffffff   (高亮表面)
  surface-container-lowest: #ffffff
  surface-container-low:    #eff4ff
  surface-container:        #e6eeff
  surface-container-high:   #dde9ff
  surface-container-highest:#d5e3fd
  surface-dim:              #ccdbf4

文字系:
  on-background:  #0d1c2f   (近黑蓝)
  on-surface:     #0d1c2f
  on-surface-variant: #494454

辅助色:
  secondary:      #9d4300   (橙)
  secondary-container: #fd761a
  tertiary:       #0058be   (蓝)
  tertiary-container: #2170e4
  error:          #ba1a1a
  outline:        #7b7486
  outline-variant:#cbc3d7
```

### 2.2 字体系统

```
标题字体: "Plus Jakarta Sans", sans-serif
  headline-lg: 32px / 1.2 / 700
  headline-md: 24px / 1.3 / 600
  headline-sm: 20px / 1.4 / 600

正文字体: "Work Sans", sans-serif
  body-lg:    18px / 1.8 / 400
  body-md:    16px / 1.7 / 400

标签字体: "Work Sans", sans-serif
  label-md:   14px / 1.5 / 500
  label-sm:   12px / 1.5 / 500
```

### 2.3 间距系统

```
xs:  4px
sm:  8px
md:  16px (base)
lg:  24px
xl:  32px
gutter: 20px
margin-desktop: 40px
margin-mobile: 16px
```

### 2.4 圆角系统

```
DEFAULT: 0.25rem (4px)
lg:      0.5rem  (8px)
xl:      0.75rem (12px)
full:    9999px  (圆形/药丸)
```

### 2.5 图标系统

```
库: Material Symbols Outlined (Google)
用法: <span class="material-symbols-outlined">icon_name</span>
引入: Google Fonts CDN 或本地 SVG
尺寸:
  导航图标: 20px
  按钮图标: 18px
  大图标:   24px
状态:
  filled: font-variation-settings: 'FILL' 1
  默认: 无 FILL
```

---

## 三、双门禁验收标准

从 Phase 1.1 起，每个阶段完成后必须通过**两类验收**才算产品级通过：

### 门禁 A：工程验收（原有标准）

```bash
cd packages/app && bun typecheck   → 0 错误
cd packages/app && bun test        → 全部通过
grep -r "import.*mock-data" components/ → 空
Provider 返回副本验证 ✅
Hook 数据流正确 ✅
```

### 门禁 B：视觉验收（新增标准）

| 检查项 | 标准 | 方式 |
|--------|------|------|
| 是否对应 Stitch 原型 | 有明确编号映射 | 文档声明 |
| 是否有截图对照 | 提交实现截图 vs 原型截图 | 报告附件 |
| 是否存在明显线框 UI | 无纯边框+无颜色+无圆角的区域 | 人工审查 |
| 颜色是否对齐 | 使用 design token，非 Tailwind 灰色默认值 | 代码审查 |
| 间距/圆角/阴影 | 符合令牌规范 | 代码审查 |
| 组件状态覆盖 | default/hover/active/disabled/empty/loading/error | 功能验证 |
| 未还原项是否有明确延期 | 每项有理由+计划修复时间 | 文档声明 |

**只有 A + B 双门禁都通过，才算产品级通过。**

---

## 四、Legacy 标记规则

以下组件已标记为 **Legacy（数据流验证版）**，不是最终 UI：

| 组件 | 路径 | 替代计划 |
|------|------|---------|
| NovelEditor | novel-editor/index.tsx | Phase 1.3 按 Stitch 04 重构 |
| ChapterList | novel-editor/chapter-list.tsx | Phase 1.3b 已升级为 OutlineSidebar |
| ChapterEditor | novel-editor/chapter-editor.tsx | Phase 2.1 按 Stitch 05 重构 |
| CharacterPanel | novel-editor/character-panel.tsx | Phase 2.2 按 Stitch 06 重构 |
| CreateProjectPlaceholder | 已删除 | Phase 1.2 已替换为 Modal |

**注意**: Legacy 组件可以继续作为数据流参考，但不得出现在最终产品路径中。

---

## 五、违规处理

| 违规行为 | 扣分 | 处理方式 |
|---------|------|---------|
| 交付线框 UI（无设计还原） | -10 分 | 必须在本阶段内修复 |
| 任务理解汇报缺设计稿对照章节 | -5 分 | 补充后重新提交评审 |
| 完成报告缺视觉还原验收章节 | -5 分 | 补充后重新提交评审 |
| 硬编码颜色值（非 design token） | -3 分 | 改用 token 变量 |
| 使用 Tailwind 默认灰色替代原型色 | -3 分 | 改用 primary/surface 等 |
| 未标注 Legacy 组件为临时 | -2 分 | 添加 Legacy 注释标记 |

---

*本规则自 Phase 1.1 起强制执行。违反将影响 Agent 积分和阶段验收。*

**署名**: GLM-5V-Turbo
**确认日期**: 2026-06-12
**来源**: TabAI 主控评审会话_1781241815940
