下一步指示，请下发，当前是什么阶段，请列清楚各个阶段包括计划和目标STDD，最终目标是实现小说编辑器MVP

### **当前阶段：Mock Integration / MVP Run-Up。下一步不是继续堆### **当前阶段：Mock Integration Review / MVP 串联阶段。下一步不是继续做视觉，而是把已有页面、Mock 数据、导航、E2E 验收标准串成一个可运行的小说编辑器 MVP。**

当前项目已经完成了从 Stitch 原型拆解、SolidJS 组件底座、核心页面重建、视觉修正到初步 Mock 数据接入的多轮建设。现在的关键任务是进入 **MVP Run-Up 阶段**：修复 mock 串联问题，跑通 `/novel` 全应用主链路，形成「书架 → 工作台 → 编辑器 → 角色/世界/个人中心 → 返回」的闭环。

---

## **一、当前阶段判定**

```text
当前阶段：
Phase M0 — Mock Integration Review / MVP 串联验收前修复

当前目标：
修复 mock 数据链路中的阻断点，确保整个 novel 应用可以稳定启动、导航、展示真实 mock 内容，并通过 typecheck / unit test / E2E。

当前状态：
- Stitch 原型分析：已完成
- 架构文档：已完成
- Phase S 静态流转：已完成
- Phase V 视觉修正：已完成
- Phase X 页面组件底座：Trae 已完成初版
- Mock 数据串联：正在验收与修复
- MVP：尚未最终验收
```

本阶段不是新增功能阶段，也不是继续扩大页面范围阶段。现在必须先把已有模块串起来，确保应用可运行、可演示、可测试。

---

## **二、最终目标：小说编辑器 MVP**

本项目的最终 MVP 目标不是做完整商业产品，而是交付一个可运行、可演示、可扩展的小说创作编辑器原型。

MVP 应满足：

```text
1. 用户进入 /novel 后可看到工作台或书架。
2. 用户可从书架选择小说项目。
3. 用户可进入项目工作台，看到章节、大纲、生成设置、AI 任务状态。
4. 用户可进入章节编辑器，看到完整编辑器布局。
5. 编辑器可展示章节正文、章节信息、AI 提取信息、字数统计。
6. 用户可从工作台进入角色面板、世界设定、个人中心等页面。
7. 所有页面使用 mock 数据展示，不接真实后端。
8. 导航、弹框、按钮入口均可点击，无死链。
9. typecheck / unit test / E2E 全部通过。
10. 代码符合 opencode 架构与 SolidJS 组件分层。
```

---

## **三、阶段总览**

| 阶段 | 名称 | 状态 | 目标 |
|---|---|---:|---|
| Phase A | Stitch 原型理解 | 已完成 | 阅读 PRD、效果图、`code.html`，提取页面结构与设计 Token |
| Phase B | 架构设计 | 已完成 | 输出符合 opencode + SolidJS 的组件底座架构文档 |
| Phase S | Static Flow | 已完成 | 建立静态页面流转、导航、Modal、E2E 骨架 |
| Phase V | Visual Review / Fix | 已完成 | 对齐 Stitch 的基础视觉、修正关键样式与 E2E skipped |
| Phase X | 页面组件底座 | 已完成初版 | 重建编辑器、角色、世界设定、个人中心等业务页面 |
| **Phase M0** | **Mock Integration Review** | **当前阶段** | **修复 mock 数据链路，跑通整个应用** |
| Phase M1 | MVP E2E 主链路 | 待启动 | 为 MVP 主流程补充稳定 E2E |
| Phase M2 | MVP QA & Freeze | 待启动 | 冻结范围、修复阻断缺陷、输出 MVP 验收报告 |
| Phase W | 收尾清理 | 待启动 | 清理 `_legacy`、整理文档、确认提交链路 |
| Phase R | 后续增强 | 暂不启动 | 响应式、真实后端、真实 AI、导出、协作等增强功能 |

---

## **四、STDD 总原则**

这里采用 **STDD：Spec-Test-Driven Development**，即先明确规格，再写或调整测试，最后实现代码。

每个阶段都必须按这个顺序执行：

```text
Spec：先定义页面/模块应该展示什么、点击后发生什么、数据从哪里来。
Test：再定义如何验证，包括 typecheck、unit test、E2E、截图或手动验收。
Development：最后实现或修复代码。
```

禁止反过来「先写一堆 UI，再临时解释它是什么」。从现在开始，Trae 每个阶段都必须先给出 Spec 和验收点，再改代码。

---

## **五、Phase M0 当前任务：Mock 数据串联修复**

### **目标**

Phase M0 的目标是把现有页面和 mock 数据真正串起来，让 `/novel` 应用能稳定跑起来。

当前已发现几个关键问题：

```text
1. 编辑器硬编码 projectId，导致书架选项目后编辑器仍固定读取 proj-001。
2. 编辑器右侧章节编号、日期、AI 建议 ID 存在硬编码或空值。
3. mock-data/index.ts 统一导出不完整。
4. 书架仍残留旧版 useNovelView / setView API。
5. 部分页面虽然有 UI，但数据链路尚未完全经过 hooks / mock-data。
```

### **Trae 下一步执行指令**

可以直接下发：

```text
主控下发 Phase M0：Mock Integration 修复。

当前阶段：
Phase M0 — Mock Integration Review / MVP 串联验收前修复。

目标：
修复 novel 应用 mock 数据串联问题，确保 /novel 可以完整跑通书架、工作台、编辑器、角色、世界设定、个人中心、成就、引导页等页面的基础展示和导航。

执行范围：

1. 修复 novel-editor/index.tsx
   - 不再硬编码 useNovelChapters(() => 'proj-001')
   - 改为读取当前 nav.projectId，兜底 proj-001
   - 修复章节编号显示
   - 修复 AI suggestion/task id 空字符串问题
   - 日期从 chapter 数据读取，不再写死

2. 修复 mock-data/index.ts
   - 统一导出新增 mock 数据：
     - world-settings
     - achievements
     - guide-questions
     - profile
   - 确保 hooks 不通过深路径散乱导入 mock 数据

3. 清理 bookshelf/index.tsx 旧 API
   - 移除 useNovelView / setView 残留
   - 统一使用 useNovelNavigation + useNovelProject
   - 书架项目卡片点击后必须 selectProject(id) 再 openView('workspace')

4. 检查以下页面是否全部使用 hooks + mock-data：
   - novel-editor
   - character-panel
   - world-setting
   - profile
   - achievements
   - novel-guide
   - bookshelf
   - workspace

5. 不做新增功能
   - 不接真实后端
   - 不接真实 AI
   - 不新增复杂状态管理
   - 不做响应式重构
   - 不删除 _legacy
   - 不改 providers 核心数据流

验证命令：
cd packages/app && bun typecheck
cd packages/app && bun test src/novel
cd packages/app && bunx playwright test e2e/novel --reporter=list

手动验收：
1. 打开 /novel，应用正常启动。
2. 从书架选择项目，进入对应工作台。
3. 工作台显示项目名、章节、大纲、生成设置。
4. 点击章节进入编辑器。
5. 编辑器标题、正文、字数、章节编号、日期、AI 提取信息均有 mock 数据。
6. 返回工作台正常。
7. 进入人物、设定、个人中心、成就、引导页均显示真实 mock 内容，不是灰色占位。
8. 所有主按钮可点击，无 href="#"、alert()、console.log 散落。

完成后输出：
[READY_FOR_PHASE_M0_REVIEW]
```

---

## **六、Phase M1：MVP 主链路 E2E**

Phase M0 修完后，立即进入 Phase M1。M1 的目标不是继续改 UI，而是用 E2E 锁住 MVP 主流程，防止后续回归。

### **Spec**

MVP 主流程包括：

```text
书架 → 项目工作台 → 章节编辑器 → 返回工作台
工作台 → 角色面板 → 返回工作台
工作台 → 世界设定 → 返回工作台
工作台 → 个人中心 → 返回工作台
工作台 → 导出/设置/通知等 Modal → 打开关闭
```

### **Test**

需要至少补充或确认这些 E2E：

```text
1. /novel 默认可启动并显示工作台。
2. Logo 可返回书架。
3. 书架项目卡片可进入工作台。
4. 工作台章节点击可进入编辑器。
5. 编辑器返回按钮可回到工作台。
6. 工作台人物按钮可进入角色面板。
7. 工作台设定按钮可进入世界设定。
8. 头像可进入个人中心。
9. Modal 可打开并关闭。
10. 所有页面主标题可见。
```

### **Development**

只允许为测试稳定性做小范围补丁：

```text
允许：
- 增加 data-testid
- 修正不稳定选择器
- 修正导航 URL 同步
- 修正 mock 数据缺失

禁止：
- 大改 UI
- 新增业务功能
- 接后端
```

---

## **七、Phase M2：MVP QA & Freeze**

M2 是 MVP 冻结阶段，目标是停止扩功能，只修阻断问题。

### **验收标准**

```text
typecheck：0 错误
unit test：全部通过
E2E：0 fail，0 skip 或 skip 必须有主控批准
href="#"：0 处
alert()：0 处
散落 console.log：0 处
单文件：< 500 行
_legacy：状态明确
```

### **输出物**

```text
1. MVP QA 报告
2. 修改文件列表
3. 提交链路
4. 已知遗留问题列表
5. 不进入 MVP 的功能列表
```

---

## **八、Phase W：收尾清理**

Phase W 只在 M2 通过后启动。

### **目标**

```text
1. 清理 _legacy 或确认保留。
2. 合并/整理 docs/reports。
3. 更新 architecture-guide 或 MVP final report。
4. 确认没有废弃 hooks、废弃类型、废弃 mock 数据。
5. 输出最终交付说明。
```

如果删除 `_legacy`，必须单独提交，并重新跑完整验证：

```bash
cd packages/app && bun typecheck
cd packages/app && bun test src/novel
cd packages/app && bunx playwright test e2e/novel --reporter=list
```

---

## **九、暂不进入 MVP 的范围**

以下内容不应在当前 MVP 阶段继续扩大：

```text
1. 真实后端 API。
2. 真实 AI 生成。
3. 登录/权限。
4. 真实导出 Word/PDF/Markdown。
5. 多人协作。
6. 云同步。
7. 响应式移动端完整适配。
8. 支付充值真实链路。
9. 富文本编辑器高级能力。
10. 自动保存真实持久化。
```

这些进入 Phase R 后续增强，而不是 MVP 必须项。

---

## **十、主控下发版指令**

```text
主控下发：进入 Phase M0 — Mock Integration Review。

当前阶段：
Phase M0，目标是修复 mock 数据串联，跑起整个 novel 应用，为小说编辑器 MVP 做最终链路验收。

最终目标：
交付小说编辑器 MVP。MVP 必须支持书架、工作台、章节编辑器、角色面板、世界设定、个人中心等核心页面的 mock 数据展示与基础导航闭环。

STDD 要求：
所有后续开发按 Spec-Test-Driven Development 执行：
1. 先写清 Spec：页面展示什么、动作如何流转、数据从哪里来。
2. 再写 Test：typecheck、unit、E2E、手动验收点。
3. 最后 Development：只实现满足 Spec 和 Test 的最小代码。

Phase M0 执行范围：
1. 修复 novel-editor/index.tsx 的 projectId 硬编码。
2. 修复章节编号、日期、AI suggestion/task id 等硬编码或空值。
3. 补齐 mock-data/index.ts 统一导出。
4. 清理 bookshelf/index.tsx 旧 useNovelView / setView API。
5. 检查 editor / workspace / bookshelf / character / world / profile / achievements / guide 是否全部通过 hooks 消费 mock 数据。
6. 确保 /novel 全应用可启动、可导航、可展示真实 mock 内容。

禁止事项：
1. 不接真实后端。
2. 不接真实 AI。
3. 不新增复杂状态管理。
4. 不做响应式重构。
5. 不删除 _legacy。
6. 不修改 providers 核心数据流。
7. 不扩大 MVP 范围。

验证命令：
cd packages/app && bun typecheck
cd packages/app && bun test src/novel
cd packages/app && bunx playwright test e2e/novel --reporter=list

手动验收：
1. /novel 正常启动。
2. 书架选择项目后进入对应工作台。
3. 工作台显示项目、章节、大纲、AI任务、生成设置 mock 数据。
4. 点击章节进入编辑器。
5. 编辑器展示章节正文、标题、字数、章节编号、日期、AI 提取信息。
6. 返回工作台正常。
7. 角色面板、世界设定、个人中心、成就、引导页均显示真实 mock 内容。
8. Modal 可打开关闭。
9. 无 href="#"、alert()、散落 console.log。

完成后输出：
- 修改文件列表
- 修复项完成情况
- 验证结果
- 手动验收结果
- 遗留问题
- [READY_FOR_PHASE_M0_REVIEW]
```

当前主控状态：

```text
[PHASE_M0_APPROVED]
[MOCK_INTEGRATION_IN_PROGRESS]
[MVP_TARGET_CONFIRMED]
```

*内容由 AI 生成仅供参考*