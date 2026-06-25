我是：QA 验收工程师 / Novel 模块 E2E 测试 Agent (Kimi-K2.7-Code)，本次任务：PAGE-03 真实数据源与可见性问题调研，职责范围：调研报告输出；禁止触碰：任何源码修改。

# PAGE-03 真实数据源与可见性问题调研报告

**触发**: 用户反馈"书架相关操作请求都是模拟的吗，要真实请求啊，而且弹框的样式，输入框的字体的颜色，完全看不见啊，你执行 playwright 都没发现吗，方案没包含相关接口设计方案吗"

**结论**: 用户反馈的三个问题**全部成立**。当前 PAGE-03 实现是纯前端 mock 演示，无法达成业务目标。

---

## 一、核心问题：书架所有操作均为模拟，0 真实请求

### 1.1 数据来源逐项核查

| # | 数据点 | 当前来源 | 真实/模拟 | 持久化 | 文件位置 |
|---|--------|---------|----------|--------|---------|
| 1 | 项目列表 | `mockProjects` 硬编码 4 项 → 内存 Map 副本 | **模拟** | 否（刷新丢失） | `providers/novel-project.ts:8-10,14-19` ← `mock-data/projects.ts:3-48` |
| 2 | 删除项目 | 内存 Map 软删除 + `deletedProjects` Map | **模拟** | 否 | `providers/novel-project.ts:78-87` |
| 3 | 恢复项目 | 内存 Map 移回 | **模拟** | 否 | `providers/novel-project.ts:89-98` |
| 4 | 创建项目 | **表单 input 被丢弃，Provider 的 createProject 从未被调用** | **断裂** | 否 | `novel-app-shell.tsx:37` `onSubmit={async () => nav.openView('workspace')}` 忽略 input 参数 |
| 5 | 搜索过滤 | 前端 `filter()` on 内存列表 | **模拟** | - | `hooks/use-novel-project.ts:26-33` |
| 6 | 签到状态 | `localStorage` | 本地存储 | 是（浏览器级） | `hooks/use-achievements.ts:33,35-60` |
| 7 | 签到奖励 | 硬编码 `+10` | **模拟** | 否 | `hooks/use-achievements.ts:94` |
| 8 | 成就列表 | `mockAchievements` 硬编码 25 项 | **模拟** | 否 | `mock-data/achievements.ts:3-32` |
| 9 | 总字数 | `mockUser.stats.wordCount = 156800` | **模拟** | 否 | `bookshelf/index.tsx:107` ← `mock-data/profile.ts:9` |
| 10 | 在线人数 | 字面量 `'256'` | **模拟** | 否 | `bookshelf/index.tsx:108` |
| 11 | 活动标题 | 字面量 `'活动 点击查看'` | **模拟** | 否 | `bookshelf/index.tsx:106` |

### 1.2 网络请求扫描

对 `packages/app/src/novel/` 全目录搜索 `fetch(` / `XMLHttpRequest` / `axios` / `httpClient`：

- **书架数据流链路中 0 个真实 HTTP 调用**
- 唯一的 `fetch` 相关在 `llm/deepseek-transport.ts`（续写模块，与书架无关）
- `createResource` 的 `refetch()` 是 SolidJS 资源重取，非 HTTP 调用

### 1.3 致命缺陷：创建项目流程断裂

`novel-app-shell.tsx:37`:
```tsx
onSubmit={async () => nav.openView('workspace')}
```

表单填完点"创建"**只是跳转视图**，`CreateProjectInput` 参数被忽略，Provider 的 `createProject()` 方法（`providers/novel-project.ts:47-76`）从未被调用。**新建项目不会出现在书架上**。

### 1.4 真实后端存在但未接入

opencode server（Hono）已存在 project 路由：

- `packages/opencode/src/server/routes/project.ts` — `GET /` (list projects)、`POST /` (create project) 等
- `packages/opencode/src/server/server.ts:98` — `.route("/global", GlobalRoutes())`

**但 novel 模块的 Provider 层完全没有调用这些接口**，而是用模块级单例 `new NovelProjectProvider()` 持有内存 mock 数据。

---

## 二、弹框与输入框可见性问题

### 2.1 静态 CSS 审查结果

| 组件 | 文件 | overlay | 内容区 | 文字色 | 静态审查 |
|------|------|---------|--------|--------|---------|
| 删除确认 Modal | `bookshelf/index.tsx:256-283` | `bg-black/40` | `bg-white` | `#0d1c2f`/`#494454`/`#7b7486` | ✓ 对比度足够 |
| 创建项目 Modal | `create-project-modal/index.tsx` | `bg-black/50` | `bg-white` | `#0d1c2f`/`#494454` | ✓ 对比度足够 |
| 通用占位 Modal | `novel-modal-host.tsx:47-76` | `bg-black/40` | `bg-white` | `#0d1c2f`/`#7b7486` | ✓ 对比度足够 |
| 搜索框 | `bookshelf/index.tsx:134-141` | - | `bg-white` | **未显式设置** | ⚠️ 依赖继承 |
| 表单 input | `create-project-modal/index.tsx:111` | - | `bg-[#f8f9ff]` | **未显式设置** | ⚠️ 依赖继承 |

### 2.2 "看不见"的根因分析

静态 CSS class 定义本身**对比度足够**，但用户报告"完全看不见"，可能根因：

| 假设 | 可能性 | 依据 |
|------|--------|------|
| **Tailwind v4 JIT 未编译 arbitrary value 类** | 高 | `bg-[#f8f9ff]`、`text-[#0d1c2f]` 等任意值类依赖 JIT 扫描。`packages/ui/src/styles/tailwind/index.css:4` 的 `source("../../../../")` 指向 `packages/` 目录，理论应覆盖 novel，但若 Tailwind v4 配置变更或缓存失效，这些类不会生成 CSS 规则，导致元素无样式（白底白字、无边框、无背景） |
| **input/textarea 未显式设置 text 色** | 中 | `inputBase`（`create-project-modal/index.tsx:111`）和搜索框（`bookshelf/index.tsx:140`）均未设 `text-*`，依赖从 `novel-app-shell.tsx:22` 的 `color: '#0d1c2f'` 继承。若继承链断裂（如 Modal 挂载到 portal/body 下而非 shell 内），文字退化为浏览器默认色 |
| **placeholder 颜色未设置** | 中 | 所有 input 的 placeholder 未设 `::placeholder` 颜色，依赖浏览器默认（中灰），在浅色背景上偏淡 |
| **暗色模式强制覆盖** | 低 | 若浏览器/系统强制暗色模式，`bg-white` 可能被反转 |
| **CSS 加载顺序/层叠覆盖** | 低 | `@layer theme, base, components, utilities` 声明在 `tailwind/index.css:1`，novel 组件的 utility 类应在 utilities 层，但若有 base 层的 `input { color: ... }` 全局规则可能覆盖 |

### 2.3 Playwright 为何没发现

**E2E 测试的设计缺陷**：

| 测试维度 | 当前 E2E 是否覆盖 | 问题 |
|---------|-----------------|------|
| 元素存在性 | ✓ 已覆盖 | `waitForSelector` 只检查 DOM 存在，不检查可见性/样式 |
| 点击交互 | ✓ 已覆盖 | 验证了点击后视图跳转 |
| **视觉渲染质量** | ✗ 未覆盖 | 未用 `toHaveCSS` / `toBeVisible` 验证颜色、对比度 |
| **数据持久化** | ✗ 未覆盖 | 未刷新页面验证删除/创建是否持久 |
| **真实 API 调用** | ✗ 反向验证 | "数据隔离性测试"断言"0 外部请求"——这反而**证明了全是 mock**，但测试把它当通过项 |
| **截图人工审查** | ⚠️ 截图但未审 | 17 张截图已生成但未人工检查视觉质量 |

**关键反思**: "数据隔离性测试"（`page-03-acceptance.spec.ts` 数据隔离性用例）断言书架页不发起外部 AI/后端请求，结果 passed——这恰恰是"全是 mock"的证据，但测试设计将其视为"正确行为"。这是测试用例设计逻辑错误。

---

## 三、PAGE-03 规范缺失接口设计方案

### 3.1 规范章节核查

`PAGE-03_bookshelf.md` 共 503 行，章节结构：

```
1.页面定位 / 2.信息架构 / 3.用户流程 / 4.交互规格 / 5.数据契约 /
6.状态机 / 7.视觉规格 / 8.与其他页面的协同 / 9.当前实现差距 /
10.验收清单 / 11.关联割裂点 / 12.重构建议 / 附录
```

**缺失的章节**：
- ✗ 无"接口设计"/"API 设计"/"后端接口"章节
- ✗ 无 REST/GraphQL 路径定义（如 `GET /api/projects`、`DELETE /api/projects/:id`）
- ✗ 无请求/响应 JSON schema
- ✗ 无 HTTP 状态码定义
- ✗ 无数据库 schema / 持久化方案
- ✗ 无认证/鉴权机制（token/cookie/session）
- ✗ 无"mock → real 迁移策略"独立章节

### 3.2 第 5 章"数据契约"实际内容

第 5 章是**纯前端 Hook/Provider 调用契约**，非后端 API 契约：

| 方法 | 来源 | 说明 |
|------|------|------|
| `useNovelProject().filteredProjects` | hook | 前端 memo |
| `useNovelProject().deleteProject(id)` | hook（**待补**） | 未定义后端接口 |
| `useAchievements().signin()` | hook（**待补**） | 未定义后端接口 |
| `useProfile().stats` | hook | 未定义后端接口 |

所有"方法"来源标注为 `hook`，`deleteProject` 和 `signin` 显式标注"待补"，**未补后端接口契约**。

### 3.3 规范应补充的接口设计

PAGE-03 规范需补充以下后端 API 契约章节：

```
## 13. 后端接口设计

### 13.1 项目列表
GET /api/novel/projects
  Auth: Bearer <token>
  Response 200: { projects: Project[] }

### 13.2 创建项目
POST /api/novel/projects
  Body: { name, genre, type, ... }
  Response 201: { project: Project }

### 13.3 删除项目（软删除）
DELETE /api/novel/projects/:id
  Response 200: { success: boolean }

### 13.4 恢复项目
POST /api/novel/projects/:id/restore
  Response 200: { project: Project }

### 13.5 搜索项目
GET /api/novel/projects?q=keyword
  Response 200: { projects: Project[] }

### 13.6 签到
POST /api/novel/signin
  Response 200: { reward: number, streak: number }

### 13.7 成就列表
GET /api/novel/achievements
  Response 200: { achievements: Achievement[] }

### 13.8 用户统计
GET /api/novel/stats
  Response 200: { wordCount, novelCount, onlineUsers }
```

---

## 四、问题根因总结

| # | 问题 | 根因 | 影响 |
|---|------|------|------|
| 1 | 书架操作全是模拟 | Provider 层用内存 Map 持有 mock 数据，未接入 opencode server | 刷新丢失、创建无效、无法达成业务目标 |
| 2 | 创建项目断裂 | `novel-app-shell.tsx:37` 忽略表单 input | 新建项目不会出现在书架 |
| 3 | 弹框/输入框看不见 | 疑似 Tailwind JIT 未编译 arbitrary value 类，或 input 未显式设 text 色 | 用户体验崩溃 |
| 4 | 规范缺接口设计 | PAGE-03 规范只写前端 Hook 契约，未写后端 API 契约 | 后端开发无依据 |
| 5 | Playwright 未发现 | 测试只验证 DOM 存在+点击跳转，未验证视觉/持久化/真实 API | 虚假通过 |

---

## 五、整改建议（优先级排序）

### P0（阻塞，必须立即修复）

1. **补充 PAGE-03 后端接口设计章节**：定义 REST 路径、请求/响应 schema、认证机制、错误码
2. **接入真实后端**：将 `NovelProjectProvider` 从内存 Map 改为调用 opencode server 的 project 路由（或新建 novel 专用路由）
3. **修复创建项目断裂**：`novel-app-shell.tsx:37` 的 `onSubmit` 必须调用 `createProject(input)` 再跳转
4. **修复弹框/输入框可见性**：
   - 所有 input/textarea 显式设置 `text-[#0d1c2f]`
   - 所有 placeholder 显式设置 `placeholder:text-[#7b7486]`
   - 验证 Tailwind JIT 是否正确编译 `bg-[#xxx]` 类（检查浏览器 DevTools 的 computed style）

### P1（重要）

5. **E2E 测试补充视觉断言**：用 `expect(locator).toBeVisible()` + `toHaveCSS('color', ...)` 验证文字颜色可见
6. **E2E 测试补充持久化验证**：删除/创建后 `page.reload()` 验证状态持久
7. **E2E 测试修正数据隔离逻辑**：当前"0 外部请求"断言应改为"调用真实后端 API"断言
8. **签到/成就接入真实 API**：从 localStorage 改为后端持久化

### P2（增强）

9. **搜索改为后端搜索**：`searchProjects(keyword)` 调用 `GET /api/novel/projects?q=keyword`
10. **在线人数改为实时数据**：WebSocket 或轮询 `GET /api/novel/stats/online`

---

## 六、当前 PAGE-03 验收状态修正

**撤销** `[READY_FOR_PAGE-03_FINAL_REVIEW]` 标记。

PAGE-03 当前状态：**❌ 验收不通过**——纯前端 mock 演示，未接入真实后端，创建项目流程断裂，弹框/输入框存在可见性风险，规范缺接口设计章节。

需完成 P0 整改后重新提交验收。

---

**报告生成时间**: 2026-06-25
**执行人**: Kimi-K2.7-Code（QA 验收工程师）
**当前积分**: 30/100
