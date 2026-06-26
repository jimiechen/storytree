# PAGE-08 创建新项目-自定义设定

> **PRD 来源**: §3.8 创建新项目-自定义设定（08_创建新项目_自定义设定）
> **路由**: `/center`（弹窗形式，第 5 个 Tab）

## 元素清单（PRD §3.8）

| 元素类型 | 元素名称 | 功能描述 |
|----------|----------|----------|
| 按钮 | 添加设定 | 添加新的设定模板（空白骨架） |
| 预设按钮 | 修仙体系 | 修仙题材设定模板（境界/功法/丹药/法宝） |
| 预设按钮 | 西方贵族 | 西式贵族设定模板（爵位/领地/家族） |
| 预设按钮 | 科幻体系 | 科幻题材设定模板（科技/种族/星际） |
| 预设按钮 | 都市体系 | 都市题材设定模板（势力/经济/异能） |
| 大文本框 | 自定义设定描述 | 自由编辑设定内容 |

## 交互设计

- 点击预设按钮：将预设模板内容**追加**到 textarea（不覆盖已有内容）
- 点击"添加设定"：追加空白模板骨架到 textarea
- textarea 始终可编辑，支持自由输入

## 数据模型

复用 `CreateProjectInput.customSettings?: string`，无需新增字段。

## 组件设计

- 文件：`components/create-project-modal/custom-settings-tab.tsx`
- Props：`value: string` / `setValue: (v: string) => void`
- 4 个预设按钮使用 `PRESET_TEMPLATES` 配置数组驱动渲染
- 模板内容以 Markdown 风格骨架形式追加

## Exit Criteria

1. 4 个预设按钮全部可见
2. "添加设定"按钮可见
3. 点击预设按钮追加模板到 textarea
4. textarea 可自由编辑
5. 上一步/下一步按钮正常
6. `bun run typecheck` 0 errors
7. `bun test src/novel` 全部通过
8. `bun run novel:precommit` PASSED
9. E2E 测试全部通过（有头浏览器）
