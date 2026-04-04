# Ralph 任务列表 (Implementation Plan)

> **迭代版本**: dreamweaver-mvp-v1
> **开发模式**: UI优先 + Mock接口 + TDD模式

<!-- 
AI 指令: 
1. 任务必须原子化 (1-4小时粒度)，严禁大颗粒度任务。
2. 必须遵循 TDD 模式: 先写测试 -> 再写实现 -> 运行测试 -> 重构。
3. 执行阶段：**必须**激活 `ralph-task-executor` Skill。每完成一个任务，必须**立即**更新此文件。
4. **顺序强制**: 必须严格按照列表顺序（从上到下）执行任务。严禁跳跃或乱序执行。
-->

> **⚠️ 执行铁律**: 必须严格按照列表顺序（从上到下）执行任务。严禁跳跃或乱序执行。
> **TDD 铁律**: 先写测试，看到测试失败，再写实现，看到测试通过。

## 任务状态图例
- [ ] 待开始 (Pending)
- [x] 已完成 (Completed)
- [~] 进行中 (In Progress)

---

## Phase 1: 基础工程 + Mock服务搭建

### 1.1 初始化 Next.js 项目
- [x] **1.1.1 创建 Next.js 15 + TypeScript 项目**
    - 使用 `create-next-app@latest` 创建项目
    - 配置 TypeScript 严格模式
    - 配置 Tailwind CSS
    - 验证项目能正常启动

- [x] **1.1.2 配置 ESLint + Prettier**
    - 安装 ESLint 相关依赖
    - 配置 Prettier 格式化规则
    - 添加 pre-commit hook (husky + lint-staged)
    - 验证代码格式化正常工作

- [x] **1.1.3 配置项目目录结构**
    - 创建 `src/app`, `src/components`, `src/lib`, `src/stores`, `src/types`, `src/hooks`, `src/mocks`
    - 创建 `tests/e2e/`, `tests/unit/`
    - 创建 `.env.example` 文件

### 1.2 配置测试框架 (Vitest + Playwright)
- [x] **1.2.1 配置 Vitest 单元测试**
    - 安装 Vitest 和 React Testing Library
    - 配置 `vitest.config.ts`
    - 编写示例单元测试验证配置

- [x] **1.2.2 配置 Playwright E2E 测试**
    - 安装 Playwright 和浏览器
    - 配置 `playwright.config.ts`
    - 配置测试目录结构编写首页访问测试验证配置

### 1.3 搭建 MSW Mock 服务
- [x] **1.3.1 安装配置 MSW**
    - 安装 MSW 和 @faker-js/faker
    - 创建 `src/mocks/browser.ts` 浏览器端初始化
    - 配置 Mock Service Worker

- [x] **1.3.2 创建 Mock 数据生成器**
    - 创建 `src/mocks/data.ts`
    - 实现 generateMockUser 函数
    - 实现 generateMockProject 函数
    - 实现 generateMockChapter 函数

- [x] **1.3.3 创建 Mock API 处理器**
    - 创建 `src/mocks/handlers.ts`
    - 实现认证模块 Mock API (register, login)
    - 实现项目管理 Mock API (list, create, get)
    - 实现章节管理 Mock API (list, get, create, update)
    - 所有响应遵循 `{result: {code: 10200, message: "", data: {}}}` 格式

- [x] **1.3.4 验证 Mock 服务正常工作**
    - 编写测试调用 Mock API
    - 验证响应格式正确

### 1.4 配置 API 请求封装
- [x] **1.4.1 创建 API 类型定义**
    - 创建 `src/types/api.ts`
    - 定义 ApiResponse<T> 接口
    - 定义 ApiErrorCode 枚举

- [x] **1.4.2 创建 API 请求封装**
    - 创建 `src/lib/api.ts`
    - 封装 axios 实例
    - 实现请求拦截器 (添加 token)
    - 实现响应拦截器 (统一错误处理)

---

## Phase 2: 认证模块 (TDD模式)

### 2.1 登录功能 (TDD)
- [x] **2.1.1 编写登录页面 E2E 测试 (Red)**
    - 创建 `tests/e2e/auth/login.spec.ts`
    - 测试: 页面元素渲染 (输入框、按钮)
    - 测试: 表单验证 (邮箱格式、密码长度)
    - 测试: 登录成功跳转
    - 测试: 登录失败提示
    - 运行测试，确认全部失败

- [x] **2.1.2 实现登录页面 UI (Green)**
    - 创建 `src/app/(auth)/login/page.tsx`
    - 实现登录表单组件
    - 实现表单校验逻辑
    - 集成 Mock API 调用

- [x] **2.1.3 运行测试验证 (Green)**
    - 运行 E2E 测试
    - 确认所有测试通过

- [x] **2.1.4 重构优化 (Refactor)**
    - 提取可复用组件
    - 优化代码结构
    - 确保测试仍然通过

### 2.2 注册功能 (TDD)
- [ ] **2.2.1 编写注册页面 E2E 测试 (Red)**
    - 创建 `tests/e2e/auth/register.spec.ts`
    - 测试: 页面元素渲染
    - 测试: 表单验证 (用户名、邮箱、密码)
    - 测试: 异步唯一性校验
    - 测试: 注册成功跳转
    - 运行测试，确认全部失败

- [ ] **2.2.2 实现注册页面 UI (Green)**
    - 创建 `src/app/(auth)/register/page.tsx`
    - 实现注册表单组件
    - 实现表单校验和异步校验
    - 集成 Mock API 调用

- [ ] **2.2.3 运行测试验证 (Green)**
    - 运行 E2E 测试
    - 确认所有测试通过

- [ ] **2.2.4 重构优化 (Refactor)**
    - 提取表单组件
    - 优化代码结构
    - 确保测试仍然通过

### 2.3 认证状态管理
- [ ] **2.3.1 编写 auth-store 单元测试 (Red)**
    - 创建 `tests/unit/stores/auth-store.test.ts`
    - 测试: 登录状态管理
    - 测试: Token 存储
    - 测试: 登出功能
    - 运行测试，确认失败

- [ ] **2.3.2 实现 auth-store (Green)**
    - 创建 `src/stores/auth-store.ts`
    - 实现 Zustand store
    - 实现登录/登出方法
    - 实现 Token 持久化

- [ ] **2.3.3 运行测试验证 (Green)**
    - 运行单元测试
    - 确认所有测试通过

---

## Phase 3: 项目管理模块 (TDD模式)

### 3.1 项目列表功能 (TDD)
- [ ] **3.1.1 编写项目列表 E2E 测试 (Red)**
    - 创建 `tests/e2e/projects/list.spec.ts`
    - 测试: 页面加载显示项目列表
    - 测试: 空状态显示
    - 测试: 搜索过滤功能
    - 测试: 点击项目卡片跳转
    - 运行测试，确认全部失败

- [ ] **3.1.2 实现项目列表页面 UI (Green)**
    - 创建 `src/app/(main)/projects/page.tsx`
    - 实现项目卡片组件
    - 实现搜索过滤功能
    - 集成 Mock API 获取项目列表

- [ ] **3.1.3 运行测试验证 (Green)**
    - 运行 E2E 测试
    - 确认所有测试通过

- [ ] **3.1.4 重构优化 (Refactor)**
    - 提取项目卡片组件
    - 优化代码结构
    - 确保测试仍然通过

### 3.2 新建项目功能 (TDD)
- [ ] **3.2.1 编写新建项目 E2E 测试 (Red)**
    - 创建 `tests/e2e/projects/create.spec.ts`
    - 测试: 点击新建按钮打开弹窗
    - 测试: 表单验证
    - 测试: 创建成功显示在列表中
    - 运行测试，确认全部失败

- [ ] **3.2.2 实现新建项目功能 (Green)**
    - 实现新建项目弹窗组件
    - 实现表单校验
    - 集成 Mock API 创建项目

- [ ] **3.2.3 运行测试验证 (Green)**
    - 运行 E2E 测试
    - 确认所有测试通过

### 3.3 项目状态管理
- [ ] **3.3.1 编写 project-store 单元测试 (Red)**
    - 创建 `tests/unit/stores/project-store.test.ts`
    - 测试: 项目列表状态
    - 测试: 当前项目状态
    - 测试: 创建项目方法
    - 运行测试，确认失败

- [ ] **3.3.2 实现 project-store (Green)**
    - 创建 `src/stores/project-store.ts`
    - 实现项目列表管理
    - 实现当前项目管理

- [ ] **3.3.3 运行测试验证 (Green)**
    - 运行单元测试
    - 确认所有测试通过

---

## Phase 4: 写作工作台模块 (TDD模式)

### 4.1 编辑器组件 (TDD)
- [ ] **4.1.1 编写编辑器组件单元测试 (Red)**
    - 创建 `tests/unit/components/editor.test.tsx`
    - 测试: 编辑器初始化
    - 测试: 富文本格式化 (加粗、斜体)
    - 测试: 内容变更回调
    - 运行测试，确认失败

- [ ] **4.1.2 集成 TipTap 编辑器 (Green)**
    - 安装 TipTap 核心和扩展
    - 创建 `src/components/editor/Editor.tsx`
    - 实现基础富文本功能
    - 实现内容变更回调

- [ ] **4.1.3 运行测试验证 (Green)**
    - 运行单元测试
    - 确认所有测试通过

### 4.2 章节导航组件 (TDD)
- [ ] **4.2.1 编写章节导航 E2E 测试 (Red)**
    - 创建 `tests/e2e/workbench/chapters.spec.ts`
    - 测试: 章节列表显示
    - 测试: 点击章节切换内容
    - 测试: 新建章节功能
    - 运行测试，确认失败

- [ ] **4.2.2 实现章节导航组件 (Green)**
    - 创建 `src/components/layout/ChapterSidebar.tsx`
    - 实现章节列表展示
    - 实现章节切换功能
    - 实现新建章节按钮

- [ ] **4.2.3 运行测试验证 (Green)**
    - 运行 E2E 测试
    - 确认所有测试通过

### 4.3 写作工作台页面 (TDD)
- [ ] **4.3.1 编写工作台 E2E 测试 (Red)**
    - 创建 `tests/e2e/workbench/workbench.spec.ts`
    - 测试: 三栏布局渲染
    - 测试: 编辑器加载章节内容
    - 测试: 自动保存功能 (防抖2s)
    - 测试: 字数统计更新
    - 运行测试，确认失败

- [ ] **4.3.2 实现写作工作台页面 (Green)**
    - 创建 `src/app/(main)/workbench/[projectId]/page.tsx`
    - 实现三栏布局 (章节导航 + 编辑器 + AI面板占位)
    - 实现自动保存逻辑 (防抖2s)
    - 实现字数统计

- [ ] **4.3.3 运行测试验证 (Green)**
    - 运行 E2E 测试
    - 确认所有测试通过

### 4.4 AI 对话面板 (TDD)
- [ ] **4.4.1 编写 AI 对话面板单元测试 (Red)**
    - 创建 `tests/unit/components/chat.test.tsx`
    - 测试: 消息列表渲染
    - 测试: 发送消息
    - 测试: 模型切换
    - 运行测试，确认失败

- [ ] **4.4.2 实现 AI 对话面板 (Green)**
    - 创建 `src/components/chat/ChatPanel.tsx`
    - 实现消息列表展示
    - 实现消息输入和发送
    - 实现模型选择器

- [ ] **4.4.3 运行测试验证 (Green)**
    - 运行单元测试
    - 确认所有测试通过

### 4.5 章节管理 Mock API 完善
- [ ] **4.5.1 完善章节管理 Mock API**
    - 更新 `src/mocks/handlers.ts`
    - 实现章节列表 Mock API
    - 实现章节内容 Mock API
    - 实现创建章节 Mock API
    - 实现更新章节 Mock API (带自动保存)

---

## Phase 5: 集成测试与验收

### 5.1 全量测试运行
- [ ] **5.1.1 运行全量单元测试**
    - 运行 `npm run test:unit`
    - 确保覆盖率 > 70%
    - 修复失败的测试

- [ ] **5.1.2 运行全量 E2E 测试**
    - 运行 `npm run test:e2e`
    - 验证所有核心流程
    - 修复失败的测试

### 5.2 代码质量检查
- [ ] **5.2.1 TypeScript 类型检查**
    - 运行 `npm run type-check`
    - 修复类型错误

- [ ] **5.2.2 ESLint 检查**
    - 运行 `npm run lint`
    - 修复代码规范问题

- [ ] **5.2.3 代码审查**
    - 检查代码规范
    - 检查错误处理
    - 检查测试覆盖率

---

## 任务统计

| Phase | 任务数 | 说明 |
|-------|--------|------|
| Phase 1 | 10 | 基础工程 + Mock服务 |
| Phase 2 | 8 | 认证模块 (TDD) |
| Phase 3 | 7 | 项目管理模块 (TDD) |
| Phase 4 | 9 | 写作工作台模块 (TDD) |
| Phase 5 | 3 | 集成测试与验收 |
| **总计** | **37** | - |

---

<!-- 
注意: 
部署与交付 (Deployment) 不在此任务列表中管理。
当所有测试通过后，请启动专门的 `ralph-deployer` (如果存在) 或手动进行部署。
本文件仅关注开发与验证闭环。
-->
