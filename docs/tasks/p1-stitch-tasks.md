# P1 Stitch UI-First - Vibe 任务卡

> **阶段**: P1 Stitch UI-First  
> **周期**: W2-W3  
> **目标**: 21 个 PRD 页面的静态原型（HTML+CSS+假数据）  
> **退出标准**: 主控翻页评审通过、视觉锁版

---

## 任务索引

| 任务编号 | 阶段 | 任务名称 | 优先级 |
|---------|------|---------|-------|
| P1-T01 | P1 | 建立 Stitch 提示词管线 + 21 个空文件 | P0 |
| P1-T02 | P1 | 填充 21 份 Stitch 提示词内容 | P0 |
| P1-T03 | P1 | 实现 stitch-to-solid 转换脚本 | P0 |
| P1-T04 | P1 | 我的书架全流程验证闭环 | P0 |

---

## 详细任务卡

---

### [VIBE] 任务编号：P1-T01
[WHY ] P1 阶段需要一个"提示词→落地"的统一管线，不能 21 页各写各的。
[WHAT] 在 docs/stitch/ 下建立 21 个空提示词文件（S01..S21），按 PRD 页面命名；
       同时创建 docs/stitch/_template.md 五段式模板（PageSpec/Layout/Components/SampleData/VibeTone）。
[HOW ] 文件名严格 S{编号:02d}-{kebab-case-name}.md；
       _template.md 中 Components 段必须示例 dataTestId 的命名规范：data-testid="{page}-{role}-{name}"。
[DONT] 不要往提示词里写真实 PRD 文案（留到 P1-T02 批量填充）；不要在 stitch/ 之外建目录。
[DONE] ① 21 个空文件 + 1 个模板 commit；② docs/boundary/MODULE_MAP.md 表中追加 stitch 列引用。
[VIBE_TONE] 像建档案库，先排好抽屉再放文件。

**metadata**:
```json
{
  "phase": "P1",
  "module": "M0",
  "priority": "P0",
  "touchesBoundary": false,
  "redTestFile": null,
  "estimatedHours": 1
}
```

---

### [VIBE] 任务编号：P1-T02
[WHY ] 把 PRD 21 页一次性灌进 stitch 提示词，避免后续零散补漏。
[WHAT] 依据 PRD 文档，逐页填充 docs/stitch/S01..S21.md。
[HOW ] 每页必须包含全部 5 段；Components 段每个交互元素都要给 dataTestId；
       Sample Data 段用 PRD 中真实示例（如积分=100、VIP=月卡 30 元）；
       Vibe Tone 段统一引用 docs/boundary/DESIGN_TOKENS.md。
[DONT] 不要发明 PRD 没有的字段；不要把多个页面合并到一个文件；不要在提示词里写代码。
[DONE] ① 21 份提示词通过 markdownlint；② DESIGN_TOKENS.md v0.1 落地；
       ③ 在 DECISION_LOG.md 追加"主色调=紫罗兰渐变 #7C3AED→#A855F7"的 pending 提案。
[VIBE_TONE] 像写电影分镜脚本，每一格都要够具体到能直接拍。

**metadata**:
```json
{
  "phase": "P1",
  "module": "M0",
  "priority": "P0",
  "touchesBoundary": false,
  "redTestFile": null,
  "estimatedHours": 8
}
```

---

### [VIBE] 任务编号：P1-T03
[WHY ] Stitch 输出的 HTML 必须能机械化地落到 SolidJS 工程，否则 P2 装配会卡壳。
[WHAT] 实现 scripts/stitch-to-solid.ts：输入 HTML，输出 SolidJS 组件骨架。
[HOW ] 先写 tests/unit/scripts/stitch-to-solid.spec.ts 的 red 用例（含 3 个 fixture）；
       脚本只做 className→class、保留 data-testid、剥离 inline script、包一层 export default function。
[DONT] 不要尝试转换交互逻辑；不要引入 jsdom 之外的解析器；不要修改 packages/core。
[DONE] ① 三个 fixture 红→绿；② 脚本通过 `bun run stitch:gen` 可批量执行；
       ③ 在 README 增加 P1 工作流说明三行。
[VIBE_TONE] 像写一台冲洗底片的机器，进什么出什么，零艺术加工。

**metadata**:
```json
{
  "phase": "P1",
  "module": "M0",
  "priority": "P0",
  "touchesBoundary": false,
  "redTestFile": "tests/unit/scripts/stitch-to-solid.spec.ts",
  "estimatedHours": 4
}
```

---

### [VIBE] 任务编号：P1-T04
[WHY ] 用一页"我的书架"打通 Stitch→HTML→TSX→可访问路由的完整闭环，验证管线。
[WHAT] 走通 S03 我的书架的全流程：填提示词 → 调 Stitch 生成 HTML → 落档 → run stitch:gen → 注册路由 → 浏览器可访问。
[HOW ] 数据全部来自 __mocks__/fixtures/shelf.json（≥3 本假书）；
       不写任何 onClick 真逻辑，按钮一律 console.log；
       页面必须在 1440 / 768 / 375 三档断点下视觉无塌陷。
[DONT] 不要调任何 LLM；不要改 Provider Registry；不要写 e2e 测试（留到 P2）。
[DONE] ① /shelf 在 dev server 上可访问且渲染 3 本假书；② 截图存 docs/stitch/__screenshots__/S03/；
       ③ 在 DECISION_LOG.md 追加"P1 管线验证通过"的 approved 记录。
[VIBE_TONE] 像第一次试机，目标是"亮起来"，不是"漂亮"。

**metadata**:
```json
{
  "phase": "P1",
  "module": "M1",
  "priority": "P0",
  "touchesBoundary": false,
  "redTestFile": null,
  "estimatedHours": 4
}
```

---

## 交付物清单

| 交付物 | 路径 | 状态 |
|-------|------|------|
| Stitch 模板 | `docs/stitch/_template.md` | ✅ 已创建 |
| 21 个提示词文件 | `docs/stitch/S01-S21.md` | ✅ 空文件已创建 |
| 设计令牌 | `docs/boundary/DESIGN_TOKENS.md` | ✅ 已创建 |
| 转换脚本 | `scripts/stitch-to-solid.ts` | ⏳ 待实现 |
| 路由注册 | - | ⏳ 待实现 |
| 截图存档 | `docs/stitch/__screenshots__/` | ⏳ 待创建 |

---

## 验收检查清单

- [ ] 21 个 Stitch 提示词文件全部填充完成
- [ ] 每个 prompt 包含完整的 5 段结构
- [ ] 所有组件都有正确的 dataTestId
- [ ] Sample Data 使用 PRD 真实数据
- [ ] Vibe Tone 引用 DESIGN_TOKENS.md
- [ ] stitch-to-solid 脚本可正常工作
- [ ] 至少一个页面（书架）可浏览器访问
- [ ] 三档断点视觉无塌陷
- [ ] 主控翻页评审通过

---

## 与 P0/P2 的衔接

### P0 → P1 (已完成)
- ✅ BOUNDARY.md 宪法生效
- ✅ MODULE_MAP.md 模块归属明确
- ✅ TDD_PROTOCOL.md 规范就绪
- ✅ VIBE_TASK_SPEC.md Schema 可用
- ✅ DECISION_LOG.md 决策账本建立

### P1 → P2 (待开始)
- P1 输出的 21 个静态页面 → P2 接入 Mock Provider
- P1 的 dataTestId → P2 Playwright 选择器锚点
- P1 的 Sample Data → P2 __mocks__ fixtures

---

**P1 负责人**: Trae IDE  
**主控**: 项目主控  
**审批状态**: ✅ 可执行
