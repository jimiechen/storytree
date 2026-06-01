# Stitch 提示词模板

> **版本**: v0.1  
> **日期**: 2026-05-31  
> **用途**: Google Stitch 页面生成提示词标准模板

---

## 模板结构

每个 Stitch 提示词文件必须包含以下 **5 个段落**，顺序不可调换：

### 第一段：Page Spec（页面定位）

```
## Page Spec

- **页面编号**: S{编号:02d}
- **页面名称**: {中文名}
- **页面路径**: /{route-path}
- **所属模块**: M{X} (M1~M5)
- **所属阶段**: P{Y} (P1~P5)
- **PRD 编号**: PRD-{编号}
```

### 第二段：Layout（栅格布局）

```
## Layout

- **桌面端 (1440px)**: {栅格描述}
- **平板端 (768px)**: {响应式变化}
- **移动端 (375px)**: {响应式变化}
- **关键断点**: {断点列表}
```

### 第三段：Components（组件清单含 dataTestId）

```
## Components

| 组件名 | 类型 | dataTestId | 说明 |
|--------|------|-----------|------|
| {name} | {button/input/card/list...} | {page}-{role}-{name} | {说明} |
```

**dataTestId 命名规范**:
- 格式: `{page}-{role}-{name}`
- 示例: `shelf-btn-create`, `editor-input-title`, `outline-list-chapters`

**role 列表**:
- `btn` - 按钮
- `input` - 输入框
- `select` - 选择器
- `card` - 卡片
- `list` - 列表
- `item` - 列表项
- `modal` - 弹窗
- `dialog` - 对话框
- `nav` - 导航
- `tab` - 标签页
- `panel` - 面板
- `header` - 头部
- `footer` - 底部
- `sidebar` - 侧栏
- `status` - 状态指示器

### 第四段：Sample Data（假数据片段）

```
## Sample Data

```json
{
  "field": "value",
  "number": 100,
  "array": ["item1", "item2"]
}
```
```

**数据来源优先级**:
1. PRD 中真实示例数据
2. 符合业务逻辑的合理数据
3. 禁止使用 lorem ipsum 或无意义占位符

### 第五段：Vibe Tone（视觉氛围）

```
## Vibe Tone

- **主色调**: 引用 DESIGN_TOKENS.md
- **间距**: 使用 4 倍数系统 (4/8/12/16/24/32/48/64px)
- **圆角**: 统一使用 token
- **字体**: 使用 token
- **动效**: P1 阶段禁止动效
- **特殊要求**: {如有}
```

---

## 文件命名规范

| 格式 | 示例 | 说明 |
|------|------|------|
| `S{编号:02d}-{kebab-case-name}.md` | `S03-my-shelf.md` | 我的书架 |
| `S01-home-guide.md` | `S01-home-guide.md` | 首页引导 |
| `S21-tutorial.md` | `S21-tutorial.md` | 新手教程 |

---

## 21 页面索引

| 编号 | 文件名 | 页面名 | 路径 |
|------|-------|--------|------|
| S01 | `home-guide` | 首页/引导页 | `/` |
| S02 | `login-register` | 登录/注册页 | `/auth/login` |
| S03 | `my-shelf` | 我的书架页 | `/shelf` |
| S04 | `project-type-select` | 创建项目-类型选择 | `/project/new/type` |
| S05 | `project-basic-info` | 创建项目-基础信息 | `/project/new/info` |
| S06 | `character-tracker` | 角色追踪面板 | `/project/:id/characters` |
| S07 | `world-setting` | 世界设定页 | `/project/:id/world` |
| S08 | `project-confirm` | 创建项目-完成确认 | `/project/new/confirm` |
| S09 | `guide-questionnaire` | 25道题引导-问卷页 | `/guide/questionnaire` |
| S10 | `guide-result` | 25道题引导-结果页 | `/guide/result` |
| S11 | `outline-generate` | 大纲生成 Tool | `/project/:id/tools/outline` |
| S12 | `detail-generate` | 细纲生成 Tool | `/project/:id/tools/detail` |
| S13 | `content-generate` | 正文生成 Tool | `/project/:id/tools/content` |
| S14 | `chapter-editor` | 章节编辑器 | `/project/:id/chapter/:chId` |
| S15 | `ai-model-settings` | AI 模型设置页 | `/settings/models` |
| S16 | `name-generator` | 名字生成器 Tool | `/tools/name-gen` |
| S17 | `book-analysis` | 拆书分析 Tool | `/tools/book-analysis` |
| S18 | `ai-cover` | AI 封面 Tool | `/tools/ai-cover` |
| S19 | `credits-ledger` | 积分账本页面 | `/credits/ledger` |
| S20 | `vip-recharge` | VIP 充值页面 | `/vip/recharge` |
| S21 | `tutorial` | 新手教程页 | `/help/tutorial` |

---

*模板版本: v0.1*
*最后更新: 2026-05-31*
