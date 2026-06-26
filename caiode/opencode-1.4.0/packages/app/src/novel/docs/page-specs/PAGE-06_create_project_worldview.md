# PAGE-06 创建新项目-世界观 开发文档

> PRD 来源：AI小说创作助手_PRD文档_完整版.md §3.6
> 路由：`/center`（弹窗形式，从 PAGE-05 主角设定下一步进入）
> 状态：草稿 v1.0
> 最后更新：2026-06-26

---

## 1. 页面定位

| 项 | 内容 |
|----|------|
| 一句话目标 | 用户选择世界背景（类型/时代/社会制度）并通过 AI 生成或手动填写世界观描述 |
| 入口 | PAGE-05 主角设定"下一步"按钮 |
| 出口 | 下一步 → 剧情总纲(PAGE-07) / 上一步 → 主角设定(PAGE-05) |
| 关键指标 | 世界观描述完整度、AI 生成使用率 |

---

## 2. 元素清单（PRD §3.6）

| 元素ID | 类型 | PRD描述 | 交互 | 状态 |
|--------|------|---------|------|------|
| EL-01 | 下拉框 | 世界类型 | onChange | 需新增 |
| EL-02 | 下拉框 | 时代背景 | onChange | 需新增 |
| EL-03 | 下拉框 | 社会制度 | onChange | 需新增 |
| EL-04 | 输入框 | 世界观描述 | onInput + LLM生成 | 需新增 |
| EL-05 | 输入框+按钮 | 提示词 + AI生成 | onInput + onClick | 需新增 |

---

## 3. 下拉框选项

### 3.1 世界类型（7 选项）

| 值 | 显示名称 |
|----|---------|
| ancient_china | 中国古代 |
| medieval_europe | 欧洲中世纪 |
| modern_urban | 现代都市 |
| near_future | 近未来 |
| far_future | 远未来 |
| fantasy | 奇幻架空 |
| custom | ⚡ 自定义 |

### 3.2 时代背景（10 选项）

| 值 | 显示名称 |
|----|---------|
| primitive | 原始社会 |
| ancient | 古代 |
| medieval | 中世纪 |
| pre_industrial | 工业革命前 |
| industrial | 工业时代 |
| modern | 现代 |
| near_future_tech | 近未来科技 |
| advanced_tech | 高度发达科技 |
| sci_fi | 科幻设定 |
| magitech | 魔导科技混合 |

### 3.3 社会制度（8 选项）

| 值 | 显示名称 |
|----|---------|
| tribal | 部落制 |
| feudal | 封建制 |
| imperial | 帝制 |
| constitutional_monarchy | 君主立宪 |
| republic | 共和制 |
| democracy | 民主制 |
| corporate_oligarchy | 企业寡头 |
| anarchy | 无政府 |

---

## 4. 数据模型扩展

```typescript
// CreateProjectInput 新增字段
export interface CreateProjectInput {
  // ...existing fields
  worldview?: string;        // 世界观描述（LLM 生成或手动输入）
  worldType?: string;       // 新增：世界类型
  era?: string;             // 新增：时代背景
  socialSystem?: string;    // 新增：社会制度
}
```

---

## 5. 组件设计

`worldview-tab.tsx`（独立组件，内联 LLM 生成逻辑）：
- 3 个下拉框（grid 3 列布局）
- 提示词输入 + AI 生成按钮
- 世界观描述 textarea（始终可见，避免条件渲染问题）
- 下拉框选择会自动拼接到 LLM context 中

---

## 6. Exit Criteria

- [ ] 世界类型下拉框（7 选项）
- [ ] 时代背景下拉框（10 选项）
- [ ] 社会制度下拉框（8 选项）
- [ ] 世界观描述输入框（始终可见）
- [ ] 提示词输入 + AI 生成按钮
- [ ] 上一步/下一步按钮正常
- [ ] `bun run typecheck` 0 errors
- [ ] `bun test src/novel` 全部通过
- [ ] `bun run novel:precommit` PASSED
- [ ] E2E 测试全部通过（有头浏览器）
