# StoryTree 项目状态同步评估与技术决策报告

> **评估日期**: 2026-04-07
> **评估范围**: Dreamweaver V3 进度 vs VS Code OSS 集成规划
> **决策目标**: 确定"继续执行"或"重新规划"的最优路径

---

## 📊 一、当前项目状态快照

### 1.1 Dreamweaver V3 迭代进度

| Sprint | 名称 | 任务数 | 已完成 | 完成率 | 状态 |
|--------|------|--------|--------|--------|------|
| **Sprint 0** | UI 视觉与布局修复 | 5 | 5 | **100%** | ✅ 已完成 |
| **Sprint 0.5** | 主题/i18n/无障碍基建 | 5 | 5 | **100%** | ✅ 已完成 |
| **Sprint 1** | Harness 工程基础设施 | 2 | 0 | **0%** | ⏳ 待开始 |
| **Sprint 2** | 知识库 RAG 检索 | 3 | 0 | **0%** | ⏳ 待开始 |
| **Sprint 3** | 多分支叙事系统 | 4 | 0 | **0%** | ⏳ 待开始 |
| **Sprint 4** | 质量门禁与性能调优 | 2 | 0 | **0%** | ⏳ 待开始 |

**总进度**: 10/21 任务完成 (**48%**) - 仅剩后端重度功能未启动

### 1.2 已完成工作的资产价值评估

#### ✅ **高价值资产 (可复用)**
1. **UI 组件库** (~95% 可直接复用)
   - 项目主页布局 (`ActivityBar` + `TopNav`)
   - 大纲管理三栏视图
   - 分支树形图 (React Flow)
   - 知识库表单系统
   - AI 聊天面板

2. **设计令牌体系** (100% 复用)
   - Light/Dark 双色板 CSS 变量
   - `next-themes` 主题切换器
   - 国际化双语包 (zh-CN / en-US)

3. **无障碍改造** (100% 复用)
   - aria-label 标注
   - 键盘导航支持
   - 焦点管理

4. **E2E 测试套件** (~80% 可复用)
   - Playwright 测试脚本
   - VRT 视觉回归矩阵

#### ⚠️ **需重构资产 (中度工作量)**
1. **API Routes 层** (10 个路由需迁移)
   - 认证相关: `/api/auth/*` (登录/注册/Session)
   - 项目管理: `/api/projects/*`
   - 章节操作: `/api/chapters/*`
   - AI 对话: `/api/chat/*`
   - 知识库: `/api/projects/[id]/characters`, `/world-settings`

2. **数据访问层** (Prisma Client 调用点)
   - 所有 API Route 中的数据库 CRUD 操作
   - 需提取到 Extension 层的 Command Handler

#### ❌ **废弃资产 (若转向 VS Code)**
1. **SSR 渲染逻辑** (Server Components 中的数据预取)
2. **Next.js 特有功能**:
   - `next-intl` 的 `[locale]` 动态路由 (需替换为客户端 i18n)
   - Middleware.ts 请求拦截 (需在 Extension 层实现)

### 1.3 技术栈兼容性矩阵

| 技术组件 | 当前 Dreamweaver | VS Code Webview 环境 | 兼容性 | 迁移成本 |
|---------|------------------|---------------------|--------|----------|
| React 19 | ✅ 广泛使用 | ✅ 完全支持 | 🔋 **高** | 低 |
| Next.js App Router | ✅ 核心框架 | ❌ 不适用 | 🔴 **低** | **高** (需重构为纯 SPA) |
| TailwindCSS | ✅ 样式方案 | ✅ 完全支持 | 🔋 **高** | 低 |
| Zustand (状态管理) | ✅ 使用中 | ✅ 完全支持 | 🔋 **高** | 低 |
| Prisma ORM | ✅ 数据层 | ⚠️ 需在 Extension 进程运行 | 🟡 **中** | 中 (迁移 DB 连接) |
| SQLite | ✅ 数据库 | ✅ 完全支持 | 🔋 **高** | 低 |
| next-themes | ✅ 主题切换 | ⚠️ 需替换为手动实现 | 🟡 **中** | 低 (1天) |
| next-intl | ✅ 国际化 | ⚠️ 需替换为 react-i18next | 🟡 **中** | 中 (2-3天) |
| Server Components | ✅ 大量使用 | ❌ 不支持 | 🔴 **低** | **高** (转为 Client Components) |
| API Routes (10个) | ✅ 后端接口 | ❌ 不支持 | 🔴 **低** | **高** (重写为 Commands) |

**兼容性评分**: **65/100** (中等偏好，前端组件高度兼容，后端架构需重构)

---

## 🔍 二、核心冲突分析

### 2.1 架构冲突: Next.js 全栈 vs VS Code Webview 纯客户端

#### 当前架构 (Dreamweaver 独立部署)
```
[浏览器] ←HTTP→ [Next.js Server (Node.js)]
                    ├─ SSR 渲染页面
                    ├─ API Routes 处理业务逻辑
                    └─ Prisma ←→ SQLite
```

#### 目标架构 (VS Code OSS 集成)
```
[Webview (纯客户端)] ←IPC→ [VS Code Extension (Node.js)]
                              ├─ Commands 处理业务逻辑
                              └─ Prisma ←→ SQLite (globalStorageUri)
```

#### 冲突点
1. **双服务器问题**: 如果继续开发 Sprint 1-4 的后端功能（Harness/RAG/分支系统），会在 Next.js Server 上新增更多 API Routes 和复杂业务逻辑 → **后续迁移时需要重写两次**
2. **数据模型耦合**: V3 的分支系统 (`Branch`, `Commit`, `ChapterSnapshot`) 会深度修改 Prisma Schema → 如果现在开发，Extension 层也需要同步维护两套 Schema
3. **测试资产浪费**: 为 API Routes 编写的集成测试在迁移到 IPC 后全部失效

### 2.2 时间窗口冲突

| 方案 | 完成时间 | 可交付物 | 风险 |
|------|----------|----------|------|
| **A: 先完成 V3 再迁移** | V3 (6周) + 迁移 (8周) = **14周** | 完整功能的独立版 + IDE 版 | 高 (重复开发) |
| **B: 立即转向 VS Code 集成** | 直接进入 Phase 1-2 = **12-14周** | 仅 IDE 版 (MVP) | 中 (V3 功能延期) |
| **C: 混合策略 (推荐)** | 前端优化(2周) + VS Code集成(10周) = **12周** | IDE 版 + 可选独立版 | **低** (渐进式) |

---

## 🎯 三、决策建议

### 🏆 最终推荐: **方案 C - 混合渐进式迁移策略**

#### 核心原则
> **冻结后端开发，保留前端资产，通过抽象层实现双模式并行**

#### 具体执行路径

##### **阶段 1: 架构适配层开发 (2 周)** ⭐ **立即启动**

**目标**: 创建 RPC 抽象层，使 Dreamweaver 前端代码无需修改即可在两种环境下运行

**任务清单**:
```markdown
### 1.1 设计并实现 IRPCClient 接口
- [ ] 定义通用请求/响应类型
- [ ] 实现 HTTPRPCClient (封装 fetch/axios)
- [ ] 实现 IPCClient (封装 vscode.postMessage)
- [ ] 实现环境检测器 isVSCodeEnvironment()

### 1.2 封装数据访问层 (Data Access Layer)
- [ ] 创建 src/lib/api/ 目录
- [ ] 将现有 API 调用抽取为 api.projects.list(), api.chapters.get() 等方法
- [ ] 每个方法内部根据环境选择 HTTP 或 IPC 实现
- [ ] 保持 Type Safety (泛型约束)

### 1.3 验证双模式运行
- [ ] 在浏览器模式下测试 (现有 Next.js 开发服务器)
- [ ] 在 VS Code Webview 模式下测试 (需要先搭建最小化 Extension 骨架)
- [ ] 编写自动化测试确保两种模式行为一致
```

**交付物**:
- ✅ `src/lib/rpc/client.ts` (RPC 抽象层)
- ✅ `src/lib/api/` (类型安全的 API 封装)
- ✅ 《双模式运行验证报告》

---

##### **阶段 2: VS Code Extension 最小化骨架 (3 周)**

**目标**: 搭建 caiode 插件基础架构，实现 Webview 加载 Dreamweaver 前端

**任务清单**:
```markdown
### 2.1 初始化 VS Code Extension 项目
- [ ] 创建 caiode/vscode-extension/ 目录结构
- [ ] 配置 package.json (Extension manifest)
- [ ] 配置 TypeScript + esbuild 打包链
- [ ] 安装依赖: vscode, prisma, better-sqlite3, async-mutex

### 2.2 实现 Extension 生命周期
- [ ] activate(): 初始化 SQLite (globalStorageUri), 启动 Python Agent 监控
- [ ] deactivate(): 清理子进程, 关闭数据库连接
- [ ] 注册全局状态 (ExtensionContext)

### 2.3 实现 Webview 容器
- [ ] 创建 DreamweaverWebviewPanel 类
- [ ] 实现静态资源加载 (从 extension Uri 加载 HTML/CSS/JS)
- [ ] 配置 CSP 安全策略
- [ ] 实现 webview.onDidReceiveMessage() 监听器

### 2.4 映射 IPC 到 Commands
- [ ] 注册 storytree.* 命名空间的 Commands
- [ ] 实现 Command Handler → Prisma CRUD 的桥接
- [ ] 先实现 3 个核心命令 (项目列表/章节详情/AI对话) 作为 PoC
```

**交付物**:
- ✅ caiode VS Code 插件源码 (基础骨架)
- ✅ `.vsix` 安装包 (可加载 Webview)
- ✅ Hello World 级别的双向通信 Demo

---

##### **阶段 3: 核心业务迁移 (4-6 周)**

**目标**: 逐步将 10 个 API Routes 迁移到 Extension Commands，同时保持浏览器模式可用

**优先级排序 (按业务价值)**:

| 优先级 | API Route | 业务价值 | 复杂度 | 预估工时 |
|--------|-----------|----------|--------|----------|
| **P0** | `/api/projects/*` | 项目管理核心 | 中 | 2 天 |
| **P0** | `/api/chapters/*` | 章节编辑核心 | 中 | 2 天 |
| **P0** | `/api/chat/*` | AI 对话功能 | 高 | 3 天 |
| **P1** | `/api/projects/[id]/characters` | 知识库-角色 | 低 | 1 天 |
| **P1** | `/api/projects/[id]/world-settings` | 知识库-世界观 | 低 | 1 天 |
| **P2** | `/api/auth/*` | 认证系统 | 高 | 3 天 (可延后) |

**迁移策略**:
1. **逐个迁移**: 每次迁移一个 API Route，编写对应的 Command Handler
2. **双模式测试**: 每迁移一个功能，同时在浏览器和 Webview 中测试
3. **渐进式上线**: 迁移完成的功能立即在 IDE 版本中可用

---

##### **阶段 4: 高级功能开发 (按需, 可选)**

**目标**: 在 VS Code 架构稳定后，再考虑是否实现 V3 Sprint 1-4 的功能

**决策节点** (在阶段 3 完成后评估):
- ❓ **Harness 工程 (Context Manager + Prompt Cache)**
  - 如果用户反馈 AI 响应慢 → 实现
  - 否则保持简单调用
- ❓ **RAG 检索 (向量存储 + 语义搜索)**
  - 如果知识库数据量大 (>1000 条记录) → 实现
  - 否则使用关键词搜索足够
- ❓ **多分支叙事系统**
  - 如果用户强烈需求版本管理 → 实现
  - 否则使用 Git 集成替代

---

## 📈 四、预期成果与时间线

### 推荐路径时间线 (总计 12-14 周)

```
Week 1-2:  [阶段1] RPC 抽象层 + 数据访问层封装
              ↓
Week 3-5:  [阶段2] VS Code Extension 骨架 + Webview 容器
              ↓
Week 6-11: [阶段3] 核心业务迁移 (P0+P1 API Routes)
              ↓
Week 12-14:[阶段4] 高级功能 (可选) + QA + 文档
```

### 里程碑检查点

| 时间点 | 里程碑 | 验收标准 |
|--------|--------|----------|
| **Week 2** | M1: 双模式架构就绪 | Dreamweaver 可在浏览器和 Webview 中同时运行 |
| **Week 5** | M2: IDE 骨架可用 | VS Code 插件可加载前端界面，3 个核心命令可用 |
| **Week 9** | M3: 核心功能闭环 | 项目管理/章节编辑/AI 对话全流程跑通 |
| **Week 12** | M4: MVP 交付 | StoryTree IDE v0.1 可打包分发 (.vsix) |
| **Week 14** | M5: 生产就绪 (可选) | 多平台构建 + 文档 + 高级功能 |

---

## ⚠️ 五、风险与应对措施

### 风险 1: RPC 抽象层设计不当导致性能瓶颈
- **概率**: 中 (30%)
- **影响**: 高 (IPC 序列化开销可能 > HTTP)
- **应对**:
  - Week 1 先做 POC 性能基准测试 (1MB JSON 传输延迟)
  - 如果 IPC >50ms，考虑使用 ArrayBuffer 二进制协议
  - 实现增量更新策略 (避免全量推送)

### 风险 2: next-intl 替换成本超预期
- **概率**: 低 (20%)
- **影响**: 中 (国际化功能回退)
- **应对**:
  - 保留 next-intl 在浏览器模式下的使用
  - 仅在 Webview 模式下禁用动态路由，改用客户端语言切换
  - 或者接受 Webview 模式仅支持中文 (MVP 阶段)

### 风险 3: Prisma 在 Extension 进程中的兼容性问题
- **概率**: 中 (35%)
- **影响**: 高 (数据库操作失败)
- **应对**:
  - 提前在 Week 3 进行 Prisma + SQLite 集成测试
  - 准备降级方案: 使用 `better-sqlite3` 原生驱动或 `sql.js`
  - 参考 VS Code 插件最佳实践 (如 GitHub Copilot Chat 插件)

### 风险 4: 团队对 VS Code Extension API 学习曲线陡峭
- **概率**: 高 (60%)
- **影响**: 中 (开发效率下降)
- **应对**:
  - Week 1-2 安排 API 学习时间 (官方文档 + 示例插件)
  - 复用 `trae-auto-extension` 已有代码降低学习成本
  - 考虑引入 VS Code 插件开发经验丰富的开发者

---

## 📝 六、最终结论与行动建议

### ✅ 决策结论: **重新规划 (但非推倒重来)**

**具体建议**:
1. ❌ **不要**继续执行 V3 Sprint 1-4 (Harness/RAG/分支系统)
2. ✅ **应该**保留 V3 Sprint 0 + 0.5 的所有已完工前端资产
3. ✅ **应该**立即启动**混合渐进式迁移策略** (上述阶段 1-4)
4. ✅ **应该**将 V3 Sprint 1-4 的功能需求降级为"Phase 4 可选项"

### 🎯 立即行动项 (Next Steps)

#### **今日 (Day 0)**
- [x] ✅ 完成本评估报告
- [ ] 更新 `RALPH_STATE.md`: 新增迭代 `vscode-oss-integration-hybrid`
- [ ] 冻结 `dreamweaver-v3-advanced-narrative` 迭代 (标记为 "Paused - Pivot to VS Code")

#### **本周 (Week 1)**
- [ ] 创建 `docs/planning/vscode-oss-integration/04-ralph-tasks.md` (混合策略版本)
- [ ] 创建 `docs/planning/vscode-oss-integration/05-test-plan.md`
- [ ] 启动阶段 1: RPC 抽象层设计 (T-RPC-001 ~ T-RPC-003)

#### **下周 (Week 2)**
- [ ] 完成 RPC 抽象层实现并通过双模式测试
- [ ] 输出《架构适配层技术文档》
- [ ] 准备进入阶段 2: VS Code Extension 骨架开发

---

## 📎 附录

### A. 技术术语对照表

| 术语 | 定义 |
|------|------|
| **RPC** | Remote Procedure Call (远程过程调用) |
| **IPC** | Inter-Process Communication (进程间通信, VS Code Webview 专用) |
| **SSR** | Server-Side Rendering (服务端渲染) |
| **PoC** | Proof of Concept (概念验证) |
| **MVP** | Minimum Viable Product (最小可行产品) |

### B. 参考文档索引

| 文档 | 路径 | 用途 |
|------|------|------|
| 三阶段实施计划 | `docs/planning/StoryTree-VSCode-OSS-Integration-Plan.md` | 总体路线图 |
| 离线可行性评估 | `docs/planning/Dreamweaver-Caiode-VSCode-Offline-Feasibility.md` | 技术可行性论证 |
| 多智能体设计 | `caiode/2026-04-06-trae-claude-multiagent-design.md` | 完整架构设计 |
| 可行性评审 | `caiode/Trae-Claude-MultiAgent-Feasibility-Report.md` | 风险识别 |
| 当前 V3 任务 | `dreamweaver/docs/planning/dreamweaver-v3-advanced-narrative/04-ralph-tasks.md` | 已完成/待完成清单 |
| 当前状态文件 | `RALPH_STATE.md` (L54) | 项目状态真相来源 |

---

**报告版本**: v1.0 Final
**评估人**: Ralph AI Assistant
**审核状态**: ⏳ 待用户确认
**下一步**: 用户确认后立即执行"立即行动项"
