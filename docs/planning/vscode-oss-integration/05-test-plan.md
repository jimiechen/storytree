# StoryTree VS Code OSS 集成测试计划 (Test Plan)

> **生成时间**: 2026-04-07
> **基于文档**: 04-ralph-tasks.md (混合渐进式迁移策略)
> **测试框架**: Vitest (Unit) + Playwright (E2E) + @vscode/test-electron (Extension Integration)

> **⚠️ 执行铁律**: 必须严格按照列表顺序（从上到下）执行测试用例。严禁跳跃或乱序执行。

---

## 测试策略总览

### 测试金字塔

```
        /\
       /  \     E2E Tests (Playwright) - 核心用户路径
      /────~~\   (~15 个测试用例, 覆盖关键业务流程)
     /   UI    \
    /──────────\  Integration Tests (IPC/DB) - 模块间交互
   /  Integration\ (~25 个测试用例, 验证通信链路和数据流)
  /──────────────\
 /    Unit Tests   \ Unit Tests (Vitest) - 核心逻辑
/__________________\ (~40 个测试用例, 覆盖率目标 >80%)
```

### 覆盖率目标

| 层级 | 框架 | 覆盖率目标 | 重点模块 |
|------|------|-----------|----------|
| 单元测试 | Vitest | **≥ 85%** (核心 ≥ 95%) | IPC Protocol, RPC Adapter, Message Router |
| 集成测试 | Vitest + Mock | **100%** 关键路径 | Extension ↔ Webview 通信, SQLite CRUD |
| E2E 测试 | Playwright | **100%** P0 路径 | 项目管理, 章节编辑, AI 对话 |
| 安全测试 | 手动 + 自动化 | **0** Critical 漏洞 | SecretStorage, File Sandbox |

---

## Phase 1.1: IPC Protocol Design 测试 (TC-IPC-*)

### 1.1.1 JSON-RPC 协议格式验证 (Unit Tests)

**Happy Path (HP):**
- [ ] `[TC-IPC-HP-001]` 标准请求序列化: `{id, action, payload}` 正确转为 JSON 字符串 (P0)
- [ ] `[TC-IPC-HP-002]` 标准响应反序列化: `{id, status, data}` 正确解析为对象 (P0)
- [ ] `[TC-IPC-HP-003]` 批量请求支持: 数组格式的多请求正确处理 (P1)
- [ ] `[TC-IPC-HP-004]` 错误响应格式: `{id, status: "error", error: {code, message}}` 结构验证 (P0)

**Sad Path (SP):**
- [ ] `[TC-IPC-SP-001]` 无效 JSON 字符串抛出解析错误 (P0)
- [ ] `[TC-IPC-SP-002]` 缺少必要字段 (id/action) 返回 400 错误 (P0)
- [ ] `[TC-IPC-SP-003]` payload 为 null 时默认为空对象 {} (P1)
- [ ] `[TC-IPC-SP-004]` 超大 payload (>10MB) 触发分片机制 (P2)

**Edge Cases (EC):**
- [ ] `[TC-IPC-EC-001]` 特殊字符转义 (中文/emoji/HTML标签) (P1)
- [ ] `[TC-IPC-EC-002]` 嵌套对象深度 > 5 层的序列化性能 (<50ms) (P2)
- [ ] `[TC-IPC-EC-003]` 循环引用检测并抛出错误 (P1)
- [ ] `[TC-IPC-EC-004]` Date/Buffer/Map 等 ES6+ 类型序列化兼容性 (P2)

### 1.1.2 RPC Adapter 环境切换逻辑 (Unit Tests)

**Happy Path (HP):**
- [ ] `[TC-ADAPTER-HP-001]` 浏览器环境检测: `isVSCode() === false` 时使用 HTTPRPCClient (P0)
- [ ] `[TC-ADAPTER-HP-002]` Webview 环境检测: `isVSCode() === true` 时使用 IPCClient (P0)
- [ ] `[TC-ADAPTER-HP-003]` 统一接口调用: `request<T>(action, params)` 返回 Promise<T> (P0)
- [ ] `[TC-ADAPTER-HP-004]` 请求拦截器: 自动注入 requestId 和 timestamp (P1)

**Sad Path (SP):**
- [ ] `[TC-ADAPTER-SP-001]` 环境检测失败时降级到 HTTP 模式 (P1)
- [ ] `[TC-ADAPTER-SP-002]` RPC Client 未初始化时调用抛出 "NotInitialized" 错误 (P0)
- [ ] `[TC-ADAPTER-SP-003]` 网络超时触发重试机制 (Exponential Backoff) (P1)

**Integration Tests:**
- [ ] `[TC-ADAPTER-INT-001]` 同一代码在 Browser 和 Webview 中行为一致 (P0)

---

## Phase 1.2: Next.js Static Export 测试 (TC-EXPORT-*)

### 1.2.1 构建产物完整性验证 (Unit + Script Tests)

**Happy Path (HP):**
- [ ] `[TC-EXPORT-HP-001]` `next build` 成功完成且退出码为 0 (P0)
- [ ] `[TC-EXPORT-HP-002]` 生成 `out/` 目录包含所有路由页面的 HTML 文件 (P0)
- [ ] `[TC-EXPORT-HP-003]` CSS/JS 资源文件完整且路径正确 (P0)
- [ ] `[TC-EXPORT-HP-004]` 图片资源使用 `<img>` 标签而非 Next.js `<Image>` (P1)

**Sad Path (SP):**
- [ ] `[TC-EXPORT-SP-001]` SSR-only 页面报错时构建失败并提示具体文件 (P0)
- [ ] `[TC-EXPORT-SP-002]` API Routes 目录被自动忽略 (不生成对应 HTML) (P1)
- [ ] `[TC-EXPORT-SP-003]` `next-intl` 动态路由导致构建中断 (P0)

**Edge Cases (EC):**
- [ ] `[TC-EXPORT-EC-001]` 大型项目 (>100 路由) 构建时间 <5 分钟 (P2)
- [ ] `[TC-EXPORT-EC-002]` 中文路径和特殊字符在静态导出后正常访问 (P1)

### 1.2.2 静态页面功能回归测试 (E2E Tests)

| 页面路由 | ID | 核心交互验证 | 状态 |
|----------|-----|-------------|------|
| `/login` | `[TC-EXPORT-E2E-001]` | 表单提交、字段验证 | [ ] |
| `/projects` | `[TC-EXPORT-E2E-002]` | 项目列表渲染、点击跳转 | [ ] |
| `/workbench/[id]` | `[TC-EXPORT-E2E-003]` | 编辑器加载、AI面板显示 | [ ] |
| `/outline/[id]` | `[TC-EXPORT-E2E-004]` | 大纲树展开/折叠、拖拽排序 | [ ] |

---

## Phase 1.3: Extension Skeleton & Mock Migration 测试 (TC-EXT-*)

### 1.3.1 VS Code Extension 生命周期测试 (Integration Tests)

**Happy Path (HP):**
- [ ] `[TC-EXT-HP-001]` `activate()` 成功初始化 Extension Context (P0)
- [ ] `[TC-EXT-HP-002]` Webview Panel 创建成功并加载 HTML 内容 (P0)
- [ ] `[TC-EXT-HP-003]` `deactivate()` 正确清理资源 (关闭 DB 连接、杀子进程) (P0)
- [ ] `[TC-EXT-HP-004]` Extension 重新激活后状态恢复 (热重载场景) (P1)

**Sad Path (SP):**
- [ ] `[TC-EXT-SP-001]` 缺少必要依赖 (Prisma/SQLite) 时 activate 报错并提示用户 (P0)
- [ ] `[TC-EXT-SP-002]` Webview 资源文件缺失时显示友好错误页面 (P1)

### 1.3.2 IPC 双端通信链路测试 (Integration Tests - Critical Path)

**Happy Path (HP):**
- [ ] `[TC-EXT-HP-005]` Webview 发送 IPC 请求 → Extension 接收并解析 (P0)
- [ ] `[TC-EXT-HP-006]` Extension 处理请求 → 返回 Mock 数据 → Webview 正确接收 (P0)
- [ ] `[TC-EXT-HP-007]` 小说大纲数据完整渲染 (从 IPC 到 DOM 更新) (P0)
- [ ] `[TC-EXT-HP-008]` 并发 5 个 IPC 请求无阻塞或乱序 (P1)

**Sad Path (SP):**
- [ ] `[TC-EXT-SP-005]` Extension 未注册对应 action 时返回 "UnknownAction" 错误 (P0)
- [ ] `[TC-EXT-SP-006]` IPC 消息体损坏时 Extension 不崩溃 (防御性编程) (P1)
- [ ] `[TC-EXT-SP-007]` Webview 关闭后 Extension 清理相关监听器 (防止内存泄漏) (P1)

**Performance Tests:**
- [ ] `[TC-EXT-PERF-001]` 1MB JSON 数据 IPC 传输延迟 < 50ms (P1)

---

## Phase 1.4: Stitch UI Dev & Test 测试 (TC-FE-*)

### 1.4.1 核心页面 E2E 回归测试 (Playwright)

**知识库页面 (`/knowledge`)**
- [ ] `[TC-FE-HP-001]` 角色列表展示 (通过 IPC 获取 Mock 数据) (P0)
- [ ] `[TC-FE-HP-002]` 新增角色表单提交 → IPC → Mock 返回成功 → 列表刷新 (P0)
- [ ] `[TC-FE-SP-001]` 必填字段未填时表单校验提示 (P1)

**设置页面 (`/settings`)**
- [ ] `[TC-FE-HP-003]` 主题切换 (Light/Dark) 通过 IPC 持久化到 Extension (P1)
- [ ] `[TC-FE-HP-004]` API Key 配置保存到 SecretStorage (P1)

**AI 对话面板**
- [ ] `[TC-FE-HP-005]` 发送消息 → IPC → Extension 返回 AI 流式响应 → 渲染 Markdown (P0)
- [ ] `[TC-FE-SP-002]` 网络断开时显示"无法连接到 AI 服务"提示 (P1)

### 1.4.2 VRT (Visual Regression Testing) 矩阵

| 组合配置 | ID | 验证页面 | 像素差异阈值 | 状态 |
|----------|-----|---------|-------------|------|
| Light + zh-CN | `[TC-FE-VRT-001]` | 项目主页、工作台、知识库 | < 1% | [ ] |
| Dark + zh-CN | `[TC-FE-VRT-002]` | 项目主页、工作台、知识库 | < 1% | [ ] |
| Light + en-US | `[TC-FE-VRT-003]` | 项目主页、工作台、知识库 | < 1% | [ ] |

---

## Phase 1.5: Security & Isolation 测试 (TC-SEC-*)

### 1.5.1 SecretStorage 密钥管理测试 (Unit + Integration)

**Happy Path (HP):**
- [ ] `[TC-SEC-HP-001]` 存储 API Key 到 SecretStorage 成功 (P0)
- [ ] `[TC-SEC-HP-002]` 从 SecretStorage 读取 API Key 并用于 AI 请求 (P0)
- [ ] `[TC-SEC-HP-003]` 删除 SecretStorage 中的密钥后无法再使用 (P0)

**Sad Path (SP):**
- [ ] `[TC-SEC-SP-001]` SecretStorage 不可用时降级到内存缓存 (警告日志) (P1)
- [ ] `[TC-SEC-SP-002]` 明文配置文件 (.env) 中的密钥被拒绝读取 (强制走 SecretStorage) (P0)

### 1.5.2 File Sandbox 文件隔离测试 (Security Tests)

**Positive Tests (允许的操作):**
- [ ] `[TC-SEC-HP-004]` Python Agent 可读写 Workspace 内 `.storytree/` 目录 (P0)
- [ ] `[TC-SEC-HP-005]` Node.js 进程可访问 globalStorageUri 路径 (P0)

**Negative Tests (禁止的操作):**
- [ ] `[TC-SEC-SP-003]` Python Agent 尝试读写 `/etc/passwd` 被拦截并记录审计日志 (P0)
- [ ] `[TC-SEC-SP-004]` Python Agent 尝试访问用户 Home 目录被拦截 (P0)
- [ ] `[TC-SEC-SP-005]` 路径遍历攻击 (`../../../etc/shadow`) 被防御 (P0)

### 1.5.3 反编译防护验证 (Manual + Automated)

- [ ] `[TC-SEC-MANUAL-001]` esbuild 混淆后的产物无法直接阅读源码 (P1)
- [ ] `[TC-SEC-MANUAL-002]` PyArmor 编译后的 Python 文件为二进制格式 (P2)

---

## Phase 1.6: SQLite 本地数据库测试 (TC-DB-*)

### 1.6.1 CRUD 操作单元测试 (Vitest + better-sqlite3)

**Create 操作:**
- [ ] `[TC-DB-HP-001]` 插入新项目记录，自增 ID 正确生成 (P0)
- [ ] `[TC-DB-HP-002]` 插入含中文字段的数据无乱码 (P0)

**Read 操作:**
- [ ] `[TC-DB-HP-003]` 按 ID 查询返回完整记录 (P0)
- [ ] `[TC-DB-HP-004]` 分页查询 (LIMIT/OFFSET) 结果正确 (P1)
- [ ] `[TC-DB-HP-005]` 模糊搜索 (LIKE) 支持中文匹配 (P1)

**Update/Delete 操作:**
- [ ] `[TC-DB-HP-006]` 更新字段值后查询结果一致 (P0)
- [ ] `[TC-DB-HP-007]` 软删除 (标记 deleted_at) 后默认查询不可见 (P1)
- [ ] `[TC-DB-HP-008]` 硬删除后物理释放存储空间 (P2)

**Sad Path (SP):**
- [ ] `[TC-DB-SP-001]` 插入重复唯一键 (如项目名称) 抛出约束违反错误 (P0)
- [ ] `[TC-DB-SP-002]` 查询不存在的 ID 返回 null/undefined (P1)
- [ ] `[TC-DB-SP-003]` 事务回滚后数据状态不变 (P0)

### 1.6.2 Prisma ORM 集成测试 (Integration)

- [ ] `[TC-DB-INT-001]` Prisma Client 连接 SQLite 成功 (P0)
- [ ] `[TC-DB-INT-002]` 复杂关联查询 (Project → Chapters → Sections) 数据完整 (P0)
- [ ] `[TC-DB-INT-003]` 并发 10 个写入操作无死锁或数据损坏 (P1)

---

## Phase 1.7: Cloud Gateway 集成测试 (TC-GW-*)

### 1.7.1 用户认证流程测试 (E2E + Mock Server)

**Happy Path (HP):**
- [ ] `[TC-GW-HP-001]` 启动插件时自动验证 Token 有效性 (P0)
- [ ] `[TC-GW-HP-002]` Token 过期时自动跳转登录页 (P0)
- [ ] `[TC-GW-HP-003]` 登录成功后获取 License 权限列表 (P1)

**Sad Path (SP):**
- [ ] `[TC-GW-SP-001]` 网络断开时进入"离线模式" (本地功能可用) (P0)
- [ ] `[TC-GW-SP-002]` 服务器 500 错误时显示友好提示并允许重试 (P1)

### 1.7.2 OTA 更新与反馈系统测试 (Integration)

- [ ] `[TC-GW-HP-004]` 检测到新版本时弹出更新提示 (P2)
- [ ] `[TC-GW-HP-005]` 用户提交反馈后收到确认消息 (P2)

---

## 性能基准测试 (Performance Benchmarks)

| 场景 | ID | 指标 | 目标值 | 状态 |
|------|-----|------|--------|------|
| IPC 通信延迟 | `[TC-PERF-001]` | 1KB JSON 往返时间 | < 10ms | [ ] |
| 大数据传输 | `[TC-PERF-002]` | 1MB JSON 传输时间 | < 50ms | [ ] |
| SQLite 写入 | `[TC-PERF-003]` | 单条 INSERT 耗时 | < 5ms | [ ] |
| 批量查询 | `[TC-PERF-004]` | 1000 条记录 SELECT 耗时 | < 100ms | [ ] |
| Webview FCP | `[TC-PERF-005]` | 首次内容绘制时间 | < 1.5s | [ ] |
| Extension 内存 | `[TC-PERF-006]` | 闲置时内存占用 | < 150MB | [ ] |

---

## 安全扫描清单 (Security Audit)

| 类别 | ID | 检查项 | 工具 | 状态 |
|------|-----|--------|------|------|
| 依赖漏洞 | `[TC-SEC-AUDIT-001]` | npm audit / Snyk 扫描 0 Critical | npm audit | [ ] |
| CSP 配置 | `[TC-SEC-AUDIT-002]` | Webview 禁止外部脚本加载 | Manual | [ ] |
| 密钥存储 | `[TC-SEC-AUDIT-003]` | 无明文 API Key 在代码库中 | Grep + truffleHog | [ ] |
| SQL 注入 | `[TC-SEC-AUDIT-004]` | Prisma 参数化查询无拼接风险 | Code Review | [ ] |
| XSS 防护 | `[TC-SEC-AUDIT-005]` | IPC 数据渲染前经过 sanitize | DOMPurify check | [ ] |

---

## 测试执行顺序与依赖关系

```
Phase 1.1 (IPC Protocol) ─┬─→ Phase 1.2 (Static Export) ─┬─→ Phase 1.3 (Ext Skeleton)
                           │                                │
                           ├─→ [并行] Phase 1.4 (UI Dev) ←──┘
                           │
                           ├─→ [并行] Phase 1.5 (Security)
                           │
                           └─→ [最后] Phase 1.6 (SQLite) ──→ Phase 1.7 (Gateway)
```

**强制规则**:
1. ✅ Phase 1.1 必须最先完成 (后续所有阶段依赖 IPC 协议)
2. ✅ Phase 1.3 必须在 1.2 之后 (需要静态产物才能加载 Webview)
3. ⚠️ Phase 1.4/1.5 可与 1.3 并行 (前端开发和安全测试相对独立)
4. ❌ Phase 1.6/1.7 必须在 1.3 之后 (需要 Extension 骨架就绪)

---

## 测试覆盖率门禁 (Quality Gates)

### 通过标准 (Must Pass Before Release)

- [ ] **单元测试**: 核心模块 (IPC/Adapter/Router) 覆盖率 ≥ **95%**
- [ ] **集成测试**: 所有 IPC 通信链路 100% Pass
- [ ] **E2E 测试**: P0 用例 100% Pass (0 失败)
- [ ] **安全扫描**: 0 个 Critical/High 漏洞
- [ ] **性能基准**: 所有指标达到目标值 (见上表)

### 统计仪表板

| 类别 | 总数 | 通过 | 失败 | 跳过 | 通过率 |
|------|------|------|------|------|--------|
| IPC Protocol (Unit) | 16 | 0 | 0 | 16 | 0% |
| Static Export (Unit+E2E) | 11 | 0 | 0 | 11 | 0% |
| Extension Skeleton (Integration) | 12 | 0 | 0 | 12 | 0% |
| Frontend UI (E2E+VRT) | 9 | 0 | 0 | 9 | 0% |
| Security (Unit+Manual) | 11 | 0 | 0 | 11 | 0% |
| SQLite Database (Unit+Integration) | 14 | 0 | 0 | 14 | 0% |
| Cloud Gateway (Integration) | 7 | 0 | 0 | 7 | 0% |
| Performance Benchmark | 6 | 0 | 0 | 6 | 0% |
| Security Audit | 5 | 0 | 0 | 5 | 0% |
| **总计** | **~91** | **0** | **0** | **91** | **0%** |

---

## 测试环境配置

### 环境矩阵

| 环境 | OS | Node.js | VS Code 版本 | 用途 |
|------|----|---------|--------------|------|
| Local Dev | macOS (Apple Silicon) | v20 LTS | Stable | 日常开发测试 |
| CI Test | Ubuntu 22.04 (GitHub Actions) | v20 LTS | Stable | 自动化回归 |
| Manual QA | Windows 11 | v20 LTS | Stable | 人工验收测试 |

### Mock 数据策略

- **Phase 1.3 前**: 使用 MSW (Mock Service Worker) 或硬编码 JSON
- **Phase 1.3 后**: Mock 数据下沉到 Extension 层 (Node.js)
- **Phase 1.6 后**: 使用 SQLite 测试数据库 (`:memory:` 模式)

---

**计划版本**: v1.0
**创建时间**: 2026-04-07
**总测试用例**: ~91 个 (含单元/集成/E2E/安全/性能)
**预估执行时间**: 完整套件 ~2 小时 (CI 并行执行可缩短至 ~30 分钟)
