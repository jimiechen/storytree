# 测试计划 (Test Plan)

> **生成时间**: 2026-04-04
> **基于文档**: 01-requirements.md, 02-architecture.md
> **测试框架**: Playwright (E2E) + Vitest (Unit) + React Testing Library (Component)
> **迭代版本**: dreamweaver-mvp-v1

> **⚠️ 执行铁律**: 必须严格按照列表顺序（从上到下）执行测试用例。严禁跳跃或乱序执行。

---

## 1. 页面测试详情 (Test Cases)

> **Test Case ID Format**: `[TC-<MODULE>-<TYPE>-<NUMBER>]`
> - Modules: `AUTH`, `PROJ`, `WB`, `CHAPTER`
> - Types: `HP` (Happy Path), `SP` (Sad Path), `EC` (Edge Case), `UI` (UI/UX)

---

### 1.1 登录页面 (`/login`) - Module: AUTH

#### 1.1.1 功能交互穷举

**Happy Path (HP):**
- [ ] `[TC-AUTH-HP-001]` 输入有效邮箱和密码，点击登录，跳转项目列表页 (P0)
- [ ] `[TC-AUTH-HP-002]` 点击"注册"链接，跳转注册页面 (P1)

**Sad Path (SP):**
- [ ] `[TC-AUTH-SP-001]` 邮箱格式无效，显示错误提示 (P1)
- [ ] `[TC-AUTH-SP-002]` 密码为空，显示"密码不能为空" (P1)
- [ ] `[TC-AUTH-SP-003]` 邮箱未注册，显示"用户不存在" (P1)
- [ ] `[TC-AUTH-SP-004]` 密码错误，显示"密码错误" (P0)

**Edge Cases (EC):**
- [ ] `[TC-AUTH-EC-001]` 输入框前后空格自动去除 (P2)
- [ ] `[TC-AUTH-EC-002]` 回车键提交表单 (P2)
- [ ] `[TC-AUTH-EC-003]` 密码显示/隐藏切换 (P2)

#### 1.1.2 Chrome DevTools 深度验证 (UI)

| 检查面板 | ID | 检查项 | 验证标准 | 状态 |
| :--- | :--- | :--- | :--- | :--- |
| Console | `[TC-AUTH-UI-001]` | Runtime Errors | 0 Errors | [ ] |
| Network | `[TC-AUTH-UI-002]` | API Response Time | < 500ms | [ ] |
| Lighthouse | `[TC-AUTH-UI-003]` | Performance | > 90 | [ ] |

---

### 1.2 注册页面 (`/register`) - Module: AUTH

#### 1.2.1 功能交互穷举

**Happy Path (HP):**
- [ ] `[TC-AUTH-HP-010]` 输入有效用户名、邮箱、密码，注册成功并跳转 (P0)

**Sad Path (SP):**
- [ ] `[TC-AUTH-SP-010]` 用户名已存在，显示"用户名已被使用" (P1)
- [ ] `[TC-AUTH-SP-011]` 邮箱已注册，显示"邮箱已被注册" (P1)
- [ ] `[TC-AUTH-SP-012]` 密码少于8位，显示"密码至少8位" (P1)

**Async Validation (EC):**
- [ ] `[TC-AUTH-EC-010]` 用户名输入后触发唯一性校验 (P2)
- [ ] `[TC-AUTH-EC-011]` 校验中显示 Loading 状态 (P2)

---

### 1.3 项目列表页 (`/projects`) - Module: PROJ

#### 1.3.1 功能交互穷举

**Happy Path (HP):**
- [ ] `[TC-PROJ-HP-001]` 页面加载显示项目列表 (P0)
- [ ] `[TC-PROJ-HP-002]` 点击新建项目按钮，打开创建弹窗 (P0)
- [ ] `[TC-PROJ-HP-003]` 填写项目信息，创建成功并显示在列表中 (P0)
- [ ] `[TC-PROJ-HP-004]` 点击项目卡片，进入写作工作台 (P0)

**Sad Path (SP):**
- [ ] `[TC-PROJ-SP-001]` 项目名称为空，显示"名称不能为空" (P1)
- [ ] `[TC-PROJ-SP-002]` 项目名称超过100字符，显示长度限制提示 (P1)

**Edge Cases (EC):**
- [ ] `[TC-PROJ-EC-001]` 无项目时显示空状态提示 (P2)
- [ ] `[TC-PROJ-EC-002]` 搜索过滤功能正常工作 (P2)

---

### 1.4 写作工作台 (`/workbench/:projectId`) - Module: WB

#### 1.4.1 功能交互穷举

**Happy Path (HP):**
- [ ] `[TC-WB-HP-001]` 页面加载显示章节导航、编辑器、AI面板 (P0)
- [ ] `[TC-WB-HP-002]` 点击章节，编辑器加载对应内容 (P0)
- [ ] `[TC-WB-HP-003]` 在编辑器中输入内容，字数统计实时更新 (P0)
- [ ] `[TC-WB-HP-004]` 内容变更后等待2秒，自动保存成功 (P0)
- [ ] `[TC-WB-HP-005]` 点击新建章节，创建新章节并切换到该章节 (P0)
- [ ] `[TC-WB-HP-006]` 展开AI面板，可以发送消息 (P0)

**Sad Path (SP):**
- [ ] `[TC-WB-SP-001]` 网络断开，显示保存失败提示 (P1)
- [ ] `[TC-WB-SP-002]` 章节标题为空，显示提示 (P1)

**Edge Cases (EC):**
- [ ] `[TC-WB-EC-001]` 编辑器支持富文本格式（加粗、斜体） (P2)
- [ ] `[TC-WB-EC-002]` 快速切换章节，内容正确加载 (P2)
- [ ] `[TC-WB-EC-003]` 大文本内容（>10万字）编辑器性能正常 (P2)

#### 1.4.2 Chrome DevTools 深度验证 (UI)

| 检查面板 | ID | 检查项 | 验证标准 | 状态 |
| :--- | :--- | :--- | :--- | :--- |
| Console | `[TC-WB-UI-001]` | Runtime Errors | 0 Errors | [ ] |
| Network | `[TC-WB-UI-002]` | Auto-save API | 防抖2s触发 | [ ] |
| Lighthouse | `[TC-WB-UI-003]` | Performance | > 85 | [ ] |
| Memory | `[TC-WB-UI-004]` | 内存泄漏 | 无持续增长 | [ ] |

---

### 1.5 章节管理 - Module: CHAPTER

#### 1.5.1 功能交互穷举

**Happy Path (HP):**
- [ ] `[TC-CHAPTER-HP-001]` 创建新章节，章节列表更新 (P0)
- [ ] `[TC-CHAPTER-HP-002]` 编辑章节标题，保存成功 (P0)
- [ ] `[TC-CHAPTER-HP-003]` 切换章节，编辑器内容正确切换 (P0)

**Sad Path (SP):**
- [ ] `[TC-CHAPTER-SP-001]` 创建章节时网络错误，显示错误提示 (P1)

---

## 2. API 测试详情

### 2.1 认证 API

- [ ] `[TC-API-AUTH-001]` POST /api/auth/register - 正常注册返回201
- [ ] `[TC-API-AUTH-002]` POST /api/auth/register - 重复邮箱返回400
- [ ] `[TC-API-AUTH-003]` POST /api/auth/login - 正常登录返回200+token
- [ ] `[TC-API-AUTH-004]` POST /api/auth/login - 错误密码返回401

### 2.2 项目 API

- [ ] `[TC-API-PROJ-001]` GET /api/projects - 返回项目列表
- [ ] `[TC-API-PROJ-002]` POST /api/projects - 创建项目返回201
- [ ] `[TC-API-PROJ-003]` GET /api/projects/:id - 返回项目详情

### 2.3 章节 API

- [ ] `[TC-API-CHAPTER-001]` GET /api/projects/:id/chapters - 返回章节列表
- [ ] `[TC-API-CHAPTER-002]` POST /api/projects/:id/chapters - 创建章节返回201
- [ ] `[TC-API-CHAPTER-003]` GET /api/projects/:id/chapters/:chapterId - 返回章节内容
- [ ] `[TC-API-CHAPTER-004]` PUT /api/projects/:id/chapters/:chapterId - 更新章节返回200

---

## 3. 组件单元测试

### 3.1 UI 组件

- [ ] `[TC-UNIT-UI-001]` Button 组件 - 正常渲染和点击事件
- [ ] `[TC-UNIT-UI-002]` Input 组件 - 受控组件行为
- [ ] `[TC-UNIT-UI-003]` Modal 组件 - 打开/关闭行为

### 3.2 编辑器组件

- [ ] `[TC-UNIT-EDITOR-001]` Editor 组件 - 初始化正常
- [ ] `[TC-UNIT-EDITOR-002]` Editor 组件 - 富文本格式化
- [ ] `[TC-UNIT-EDITOR-003]` Editor 组件 - 内容变更回调

### 3.3 业务组件

- [ ] `[TC-UNIT-CHAT-001]` ChatPanel 组件 - 消息列表渲染
- [ ] `[TC-UNIT-CHAT-002]` ChatPanel 组件 - 发送消息
- [ ] `[TC-UNIT-SIDEBAR-001]` ChapterSidebar 组件 - 章节列表渲染

---

## 4. 集成测试场景

### 4.1 完整用户流程

- [ ] `[TC-INTEGRATION-001]` 注册 -> 登录 -> 创建项目 -> 进入工作台 -> 创建章节 -> 编辑内容 -> 自动保存

### 4.2 并发操作

- [ ] `[TC-INTEGRATION-002]` 快速切换章节，无数据错乱
- [ ] `[TC-INTEGRATION-003]` 连续创建多个章节，顺序正确

---

## 5. 性能测试基准

| 指标 | 目标值 | 测试方法 |
|------|--------|----------|
| 首屏加载时间 | < 2s | Lighthouse |
| 编辑器输入延迟 | < 50ms | Performance API |
| API 响应时间 | < 500ms | Network Panel |
| 自动保存防抖 | 2s ± 200ms | 代码测试 |

---

## 6. 测试执行检查清单

- [ ] 所有单元测试通过 (Vitest)
- [ ] 所有 E2E 测试通过 (Playwright)
- [ ] 代码覆盖率 > 70%
- [ ] Lighthouse Performance > 85
- [ ] 无 Console Error
- [ ] 无 TypeScript Error
