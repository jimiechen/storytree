# PAGE-07 创建新项目-剧情总纲

> PRD §3.7 | 页面编号 07_创建新项目_剧情总纲

## 页面元素（PRD §3.7）

| 元素类型 | 元素名称 | 功能描述 |
|----------|----------|----------|
| 大文本框 | 核心剧情线 | 200-500字的核心剧情描述 |
| 大文本框 | 开端 | 世界观建立、主角出场、核心冲突引入 |
| 大文本框 | 发展 | 冲突升级、势力对抗、小高潮迭起 |
| 大文本框 | 高潮 | 核心冲突推进、角色成长、真相揭示 |
| 大文本框 | 决战 | 最高潮对决、决战时刻 |
| 大文本框 | 结局 | 收束线索、解决结局 |
| 大文本框 | 最终走向 | 故事的最终结局描述 |
| 大文本框 | 核心矛盾 | 故事的核心矛盾冲突 |
| 输入框 | 提示词 | LLM 生成关键词输入 |
| 按钮 | AI 生成 | 调用 LLM 生成核心剧情线 |

## 数据模型扩展

```typescript
// CreateProjectInput 新增字段（types/project.ts）
plotCore?: string;        // 核心剧情线
plotBeginning?: string;  // 开端
plotDevelopment?: string; // 发展
plotClimax?: string;     // 高潮
plotBattle?: string;     // 决战
plotEnding?: string;     // 结局
plotFinale?: string;     // 最终走向
plotConflict?: string;   // 核心矛盾
```

## 组件设计

- **组件文件**: `components/create-project-modal/plot-outline-tab.tsx`
- **Props**: `fields` (PlotOutlineFields store) + `setField` (function) + `context` (string)
- **布局**: LLM 生成区（提示词 + AI 按钮）+ 8 个结构化文本框（`For` 循环渲染）
- **LLM 生成**: 填充到 `plotCore` 字段

## Exit Criteria

- [ ] 8 个大文本框全部可见
- [ ] 提示词输入 + AI 生成按钮
- [ ] AI 生成结果填充到核心剧情线
- [ ] 上一步/下一步按钮正常
- [ ] `bun run typecheck` 0 errors
- [ ] `bun test src/novel` 全部通过
- [ ] `bun run novel:precommit` PASSED
- [ ] E2E 测试全部通过（有头浏览器）
