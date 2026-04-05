# DreamWeaver PRD v5 开发任务清单

> **基于文档**: `03-stage-execution-plan.md` 与 PRD v5
> **任务粒度**: 单任务以独立交付、可测试、可验收为准
> **估算口径**: 人天

***

## Phase 1: 基础平台与治理

### 1.1 认证与用户会话

- [x] **1.1.1 用户、偏好与订阅基础数据模型**
  - 输入: PRD 中 `users`、`user_preferences`、`subscriptions` 核心字段
  - 输出: 数据表迁移、ORM schema、默认值策略
  - 完成标准: 注册后自动创建偏好记录；订阅默认 `free`；字段与 PRD 对齐
  - 预估/优先级/依赖: 1.5 人天 / P0 / 无
  - Playwright 验收: `TC-AUTH-HP-001`, `TC-SETTING-HP-001`
- [ ] **1.1.2 登录、注册、刷新令牌 API**
  - 输入: 统一响应格式、JWT + Refresh Token 约束
  - 输出: `/api/auth/register`、`/api/auth/login`、`/api/auth/refresh`
  - 完成标准: 表单校验、错误码、令牌刷新、未授权拦截全部可验证
  - 预估/优先级/依赖: 2 人天 / P0 / 1.1.1
  - Playwright 验收: `TC-AUTH-HP-001`, `TC-AUTH-SP-001`, `TC-AUTH-SP-002`
- [ ] **1.1.3 路由守卫与会话恢复**
  - 输入: 登录态、公开页/私有页路由表
  - 输出: App Router 守卫、中间件或等价鉴权层、登出流程
  - 完成标准: 未登录访问私有页会重定向；刷新页面可恢复会话；登出后清理状态
  - 预估/优先级/依赖: 1 人天 / P0 / 1.1.2
  - Playwright 验收: `TC-AUTH-HP-003`, `TC-AUTH-EC-001`

### 1.2 工程基线与测试底座

- [ ] **1.2.1 统一 API 响应与错误处理层**
  - 输入: PRD 统一响应格式、业务错误码
  - 输出: API client、error mapper、toast/alert 规范
  - 完成标准: 4xx/5xx 错误在 UI 层有统一提示；业务码可被前端识别
  - 预估/优先级/依赖: 1 人天 / P0 / 1.1.2
  - Playwright 验收: `TC-SYSTEM-SP-001`, `TC-AUTH-SP-003`
- [ ] **1.2.2 Playwright fixtures、测试数据与报告链路**
  - 输入: 现有 `playwright.config.ts`、fixtures/page objects
  - 输出: 分阶段 fixtures、稳定 mock 数据、HTML + JSON 报告约定
  - 完成标准: 可通过命令批量执行分阶段测试，并落盘报告
  - 预估/优先级/依赖: 1 人天 / P0 / 无
  - Playwright 验收: `TC-QA-HP-001`
- [ ] **1.2.3 埋点、日志与错误监控基线**
  - 输入: 核心页面、关键 API、traceId 规范
  - 输出: 日志中间件、客户端错误采集、API trace 透传
  - 完成标准: 登录、创建项目、保存章节、AI 请求均可追踪
  - 预估/优先级/依赖: 1 人天 / P1 / 1.2.1
  - Playwright 验收: `TC-OBS-HP-001`

## Phase 2: 核心创作闭环

### 2.1 项目与工作台入口

- [ ] **2.1.1 项目列表与新建项目流程**
  - 输入: `projects` 数据模型、项目创建字段
  - 输出: `/projects` 页面、创建项目弹窗、搜索过滤
  - 完成标准: 用户可创建项目并进入工作台；空状态和校验提示正确
  - 预估/优先级/依赖: 2 人天 / P0 / 1.1.3, 1.2.1
  - Playwright 验收: `TC-PROJ-HP-001`, `TC-PROJ-HP-002`, `TC-PROJ-SP-001`
- [ ] **2.1.2 工作台三栏布局与项目上下文加载**
  - 输入: 项目详情、章节列表、工作台路由结构
  - 输出: 章节导航、编辑区、AI 面板的统一布局
  - 完成标准: 首屏展示项目标题、章节列表、编辑区骨架和 AI 面板
  - 预估/优先级/依赖: 1.5 人天 / P0 / 2.1.1
  - Playwright 验收: `TC-WB-HP-001`, `TC-WB-UI-001`

### 2.2 章节编辑与保存

- [ ] **2.2.1 章节 CRUD 与切换能力**
  - 输入: `chapters` 数据模型、章节排序规则
  - 输出: 创建章节、切换章节、更新标题、读取章节详情 API/UI
  - 完成标准: 支持按卷/章顺序展示；新建后自动切换；切章内容同步正确
  - 预估/优先级/依赖: 2 人天 / P0 / 2.1.2
  - Playwright 验收: `TC-CHAPTER-HP-001`, `TC-CHAPTER-HP-002`, `TC-WB-HP-002`
- [ ] **2.2.2 富文本编辑器与字数统计**
  - 输入: TipTap 扩展、写作语言基础规则
  - 输出: 富文本编辑器、字数统计、格式快捷键
  - 完成标准: 输入不卡顿；字数实时更新；基础加粗/斜体/标题可用
  - 预估/优先级/依赖: 2 人天 / P0 / 2.2.1
  - Playwright 验收: `TC-WB-HP-003`, `TC-WB-EC-001`
- [ ] **2.2.3 自动保存与冲突控制**
  - 输入: 章节内容、版本号、保存防抖规则
  - 输出: 自动保存、手动保存、失败重试、状态指示器
  - 完成标准: 2 秒防抖生效；保存失败可见；快速切章不覆盖他章内容
  - 预估/优先级/依赖: 1.5 人天 / P0 / 2.2.2
  - Playwright 验收: `TC-WB-HP-004`, `TC-WB-SP-001`, `TC-WB-UI-002`

### 2.3 AI 对话面板

- [ ] **2.3.1 AI 消息流与快捷操作栏**
  - 输入: 对话消息模型、续写/改写/扩写快捷动作
  - 输出: 对话面板、消息列表、输入框、快捷操作栏
  - 完成标准: 支持发送消息、显示流式结果、复用选中文本触发快捷动作
  - 预估/优先级/依赖: 2 人天 / P0 / 2.1.2
  - Playwright 验收: `TC-AI-HP-001`, `TC-AI-HP-002`
- [ ] **2.3.2 模型选择器与失败回退提示**
  - 输入: 多模型配置、模型可用性状态
  - 输出: 模型选择器、回退提示、超时/失败展示
  - 完成标准: 切换模型后新请求生效；模型不可用时给出 fallback 提示
  - 预估/优先级/依赖: 1 人天 / P0 / 2.3.1
  - Playwright 验收: `TC-AI-HP-003`, `TC-AI-SP-001`

## Phase 3: 知识资产与分支系统

### 3.1 角色、世界观与伏笔

- [ ] **3.1.1 角色卡管理**
  - 输入: `characters` 表字段、角色关系与成长弧线要求
  - 输出: 角色列表、角色详情抽屉或页面、章节引用信息
  - 完成标准: 角色可新增、编辑、删除、关联章节与关系数据
  - 预估/优先级/依赖: 2 人天 / P0 / 2.2.1
  - Playwright 验收: `TC-CHAR-HP-001`, `TC-CHAR-SP-001`
- [ ] **3.1.2 世界观设定管理**
  - 输入: `world_settings` 表字段、分类/类型/关系约束
  - 输出: 世界观列表、详情编辑、引用与版本号展示
  - 完成标准: 支持分类筛选、版本更新、章节反查引用
  - 预估/优先级/依赖: 2 人天 / P0 / 2.2.1
  - Playwright 验收: `TC-WORLD-HP-001`, `TC-WORLD-EC-001`
- [ ] **3.1.3 伏笔追踪面板**
  - 输入: `foreshadowing` 字段、状态流转与优先级
  - 输出: 伏笔列表、回收状态更新、章节来源定位
  - 完成标准: 伏笔可从 planted 追踪到 payoff；能展示预期/实际回收章节
  - 预估/优先级/依赖: 1.5 人天 / P0 / 2.2.1
  - Playwright 验收: `TC-FORESHADOW-HP-001`, `TC-FORESHADOW-HP-002`

### 3.2 分支系统

- [ ] **3.2.1 分支创建、切换与分叉点记录**
  - 输入: `branches` 表、章节版本链、分支类型规则
  - 输出: 创建分支弹窗、分支切换器、fork point 记录
  - 完成标准: 支持 main/exploration/perspective/timeline/style 分支类型创建与切换
  - 预估/优先级/依赖: 2 人天 / P0 / 2.2.1
  - Playwright 验收: `TC-BRANCH-HP-001`, `TC-BRANCH-HP-002`
- [ ] **3.2.2 分支差异对比与合并保护**
  - 输入: 分支章节内容、版本元数据
  - 输出: 章节 diff 视图、合并前检查、人工确认入口
  - 完成标准: 可对比分支差异；存在冲突时禁止直接合并并给出原因
  - 预估/优先级/依赖: 1.5 人天 / P1 / 3.2.1
  - Playwright 验收: `TC-BRANCH-HP-003`, `TC-BRANCH-SP-001`

## Phase 4: 多模型智能编排

### 4.1 模型路由与检索

- [ ] **4.1.1 语言检测与任务意图路由**
  - 输入: 中英文样本文本、任务分类规则、区域信息
  - 输出: 语言检测器、任务分类器、模型路由器
  - 完成标准: 中文写作默认走 DeepSeek/Qwen/GLM；英文默认走 Claude/GPT；任务路由可解释
  - 预估/优先级/依赖: 2 人天 / P0 / 2.3.2
  - Playwright 验收: `TC-ROUTER-HP-001`, `TC-I18N-HP-003`
- [ ] **4.1.2 RAG 索引与多路检索**
  - 输入: 章节、角色、世界观、伏笔、记忆数据
  - 输出: 向量检索、关键词检索、结果融合与 token 预算控制
  - 完成标准: AI 请求可带回相关章节/角色/世界观上下文；检索耗时满足 PRD
  - 预估/优先级/依赖: 2 人天 / P0 / 3.1.1, 3.1.2, 3.1.3
  - Playwright 验收: `TC-RAG-HP-001`, `TC-RAG-EC-001`

### 4.2 Agent 与 Hook

- [ ] **4.2.1 Agent 会话与多回合执行**
  - 输入: `agent_sessions` 字段、最大回合数、任务状态机
  - 输出: agent session 管理、任务状态展示、结果快照
  - 完成标准: 主代理可创建/更新/结束会话；状态流转可审计
  - 预估/优先级/依赖: 2 人天 / P0 / 4.1.2
  - Playwright 验收: `TC-AGENT-HP-001`, `TC-AGENT-SP-001`
- [ ] **4.2.2 Hook 配置与事件执行管道**
  - 输入: `hooks_config` 字段、allow/deny/modify/inform 规则
  - 输出: Hook 列表、编辑器事件触发、执行日志
  - 完成标准: 命中规则时可阻断、修改或提示，并形成审计记录
  - 预估/优先级/依赖: 1.5 人天 / P1 / 4.2.1
  - Playwright 验收: `TC-HOOK-HP-001`, `TC-HOOK-SP-001`

## Phase 5: Harness 工程基础设施

### 5.1 Prompt Cache 与 Permission

- [ ] **5.1.1 Prompt Cache 分块、schema cache 与命中监控**
  - 输入: 静态段/动态段定义、工具 schema、缓存指标
  - 输出: `promptBuilder`、`cacheSplitter`、命中率监控
  - 完成标准: 支持静态/动态分段、1h TTL、sticky latch 与 bust 事件追踪
  - 预估/优先级/依赖: 2 人天 / P1 / 4.1.2
  - Playwright 验收: `TC-HARNESS-HP-001`
- [ ] **5.1.2 Permission fail-closed 与两阶段分类器**
  - 输入: JSONL transcript、危险操作分类规则、多竞态审批源
  - 输出: stage1/stage2 检查器、拒绝反馈链、权限审计日志
  - 完成标准: 解析失败/API 错误默认阻断；危险操作需确认；决策可追踪
  - 预估/优先级/依赖: 2 人天 / P1 / 4.2.2
  - Playwright 验收: `TC-PERM-HP-001`, `TC-PERM-SP-001`

### 5.2 Memory 与 Compaction

- [ ] **5.2.1 Memory Harness 检索、提取与老化警告**
  - 输入: `memory_entries` 表、阈值策略、NOVEL.md 约束
  - 输出: 记忆提取流程、相关记忆检索、过期提醒
  - 完成标准: 达到阈值后自动提取；过期记忆提示明确；路径安全受控
  - 预估/优先级/依赖: 1.5 人天 / P1 / 4.1.2
  - Playwright 验收: `TC-MEMORY-HP-001`, `TC-MEMORY-EC-001`
- [ ] **5.2.2 四级压缩与可逆压缩记录**
  - 输入: 对话历史、压缩阈值、L1-L4 决策树
  - 输出: microcompact、session compact、full compact、撤销能力
  - 完成标准: 连续失败 3 次自动熔断；压缩记录可追溯；可逆恢复可触发
  - 预估/优先级/依赖: 2 人天 / P1 / 5.2.1
  - Playwright 验收: `TC-COMPACT-HP-001`, `TC-COMPACT-SP-001`

### 5.3 Collaboration 与 Build

- [ ] **5.3.1 协调器、多代理权限过滤与消息顺序控制**
  - 输入: 协调器工具白名单、FlushGate、QueryGuard 状态机
  - 输出: coordinator mode、异步代理限制、串行执行保护
  - 完成标准: 子代理无用户直连权限；消息顺序一致；取消任务无竞态污染
  - 预估/优先级/依赖: 2 人天 / P1 / 4.2.1
  - Playwright 验收: `TC-COLLAB-HP-001`, `TC-COLLAB-SP-001`
- [ ] **5.3.2 四层 Feature Gate 与构建变体控制**
  - 输入: `feature_gates` 表、GrowthBook 或等价运行时开关、环境变量
  - 输出: L1-L4 gate 管理、内联 DCE 规则、attestation 占位机制
  - 完成标准: Pro/Beta/禁用功能可独立切换；紧急禁用路径可验证
  - 预估/优先级/依赖: 1.5 人天 / P1 / 5.3.1
  - Playwright 验收: `TC-FEATURE-HP-001`, `TC-FEATURE-SP-001`

## Phase 6: 全球化商业化能力

### 6.1 国际化与双语写作

- [ ] **6.1.1 UI 国际化与本地化格式**
  - 输入: `locales` 结构、语言检测优先级、格式化规则
  - 输出: en/zh 基础翻译、日期/时间/货币格式化、语言切换入口
  - 完成标准: 公共页与工作台可切换语言；刷新后保持设置；格式随 locale 改变
  - 预估/优先级/依赖: 2 人天 / P0 / 2.1.2, 1.1.1
  - Playwright 验收: `TC-I18N-HP-001`, `TC-I18N-HP-002`
- [ ] **6.1.2 双语写作规则与模型联动**
  - 输入: `primary_language`、`secondary_language`、章节语言字段、模型路由器
  - 输出: 中文/英文写作模式、字数统计规则、语言级模型路由
  - 完成标准: 中英文作品统计口径不同；写作语言切换后 AI 路由同步变化
  - 预估/优先级/依赖: 1.5 人天 / P0 / 4.1.1, 6.1.1
  - Playwright 验收: `TC-I18N-HP-003`, `TC-WB-EC-003`

### 6.2 支付订阅与用户偏好

- [ ] **6.2.1 Stripe Checkout、Webhook 与订阅生命周期**
  - 输入: Stripe 产品/价格、订阅计划矩阵、Webhook 事件清单
  - 输出: Checkout 会话、Webhook 处理器、订阅状态同步
  - 完成标准: 创建订阅、升级/降级、取消、支付失败均更新本地状态
  - 预估/优先级/依赖: 2 人天 / P0 / 1.1.1
  - Playwright 验收: `TC-BILLING-HP-001`, `TC-BILLING-SP-001`
- [ ] **6.2.2 用量计费、额度提示与 Customer Portal**
  - 输入: `usage_records`、套餐额度、overage 规则
  - 输出: 用量统计任务、额度提示、Portal 跳转
  - 完成标准: 套餐字数与 token 用量可视化；超额时提示并落账
  - 预估/优先级/依赖: 1.5 人天 / P0 / 6.2.1
  - Playwright 验收: `TC-BILLING-HP-002`, `TC-BILLING-EC-001`
- [ ] **6.2.3 用户区域、货币、时区与偏好设置**
  - 输入: `user_preferences` 字段、浏览器 locale、IP/地区推断策略
  - 输出: 设置页偏好管理、默认推断逻辑、持久化接口
  - 完成标准: UI 语言、写作语言、时区、货币、区域可保存并立即生效
  - 预估/优先级/依赖: 1.5 人天 / P0 / 6.1.1
  - Playwright 验收: `TC-SETTING-HP-001`, `TC-SETTING-HP-002`

## Phase 7: 稳定性与上线验收

### 7.1 合规、性能与回归

- [ ] **7.1.1 GDPR/Cookie/年龄确认合规模块**
  - 输入: GDPR 导出/删除、Cookie Consent、13+ 年龄确认要求
  - 输出: 设置页导出/删除入口、cookie banner、年龄确认流程
  - 完成标准: 用户能申请导出/删除数据；未同意前非必要 cookie 不写入
  - 预估/优先级/依赖: 1.5 人天 / P0 / 6.2.3
  - Playwright 验收: `TC-COMPLIANCE-HP-001`, `TC-COMPLIANCE-SP-001`
- [ ] **7.1.2 性能指标与长文稿稳定性优化**
  - 输入: PRD 性能指标、10 万字以上长文稿样本
  - 输出: 性能基准、编辑器长文稿优化、检索/保存/AI 响应监控
  - 完成标准: 关键性能指标达到 PRD 下限；长文稿编辑不出现明显卡顿
  - 预估/优先级/依赖: 2 人天 / P0 / 2.2.2, 4.1.2, 5.2.2
  - Playwright 验收: `TC-PERF-HP-001`, `TC-PERF-EC-001`
- [ ] **7.1.3 全量回归套件与发布闸门**
  - 输入: P0/P1 任务、Playwright 测试矩阵、SLO 门槛
  - 输出: 回归测试分组、失败分级、发布 checklist
  - 完成标准: P0 业务用例通过后才允许发布；失败可定位到模块与阶段
  - 预估/优先级/依赖: 1.5 人天 / P0 / 全部前置任务
  - Playwright 验收: `TC-RELEASE-HP-001`

