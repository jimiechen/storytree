# StoryTree 项目 GitHub 工作流规范

> 项目：StoryTree 一体化定制开发环境 (VS Code OSS)
> 版本：v1.0
> 日期：2026-04-09
> 关联文档：phase1-task-breakdown.md / engineer-roles-and-prompts.md

---

## 一、分支管理规范

### **分支模型总览**

```
main                          # 主干分支，始终保持可发布状态
├── develop                   # 集成分支，所有功能分支合并至此
├── trae/solo-agent-*         # AI Agent 自动开发分支
├── feat/DEV-x.x.x-*         # 功能开发分支
├── fix/BUG-x.x.x-*          # 缺陷修复分支
├── test/TEST-x.x.x-*        # 测试专项分支
├── docs/DOC-*                # 文档更新分支
└── release/vX.X.X            # 发布准备分支
```

### **分支命名规则**

所有分支名称必须遵循以下格式，不接受无意义命名（如 `fix-bug`、`test1`）：

| 分支类型 | 命名格式 | 示例 |
|---------|---------|------|
| 功能开发 | `feat/DEV-{任务编号}-{简短描述}` | `feat/DEV-1.2.1-llm-request-queue` |
| 缺陷修复 | `fix/BUG-{编号}-{简短描述}` | `fix/BUG-042-stale-lock-cleanup` |
| 测试专项 | `test/TEST-{任务编号}-{简短描述}` | `test/TEST-1.3.2c-race-condition` |
| 文档更新 | `docs/DOC-{简短描述}` | `docs/DOC-phase1-breakdown` |
| 发布准备 | `release/v{版本号}` | `release/v1.0.0` |
| AI Agent | `trae/solo-agent-{标识符}` | `trae/solo-agent-jY1pa4` |

### **分支保护规则**

**`main` 分支（最高保护级别）：**
- 禁止直接 push，所有变更必须通过 PR
- 要求至少 **2 名 Reviewer** 批准
- 必须通过全部 CI 检查（lint + build + test）
- 禁止 force push
- 合并方式：仅允许 **Squash and merge**（保持 commit 历史整洁）

**`develop` 分支（中等保护级别）：**
- 禁止直接 push，所有变更必须通过 PR
- 要求至少 **1 名 Reviewer** 批准
- 必须通过全部 CI 检查
- 合并方式：允许 **Merge commit** 或 **Squash and merge**

**功能/修复分支：**
- 从 `develop` 切出，合并回 `develop`
- 生命周期：创建 → 开发 → PR → 合并 → **立即删除**
- 超过 **14 天**未合并的分支需说明原因，超过 **30 天**自动关闭

### **分支操作规范**

```bash
# 从 develop 创建功能分支
git checkout develop
git pull origin develop
git checkout -b feat/DEV-1.2.1-llm-request-queue

# 开发完成后推送并创建 PR
git push -u origin feat/DEV-1.2.1-llm-request-queue

# 合并后删除本地和远程分支
git branch -d feat/DEV-1.2.1-llm-request-queue
git push origin --delete feat/DEV-1.2.1-llm-request-queue
```

---

## 二、Commit 提交规范

### **Commit Message 格式**

所有 Commit 必须遵循 `https://www.conventionalcommits.org/` 规范：

```
<type>(<scope>): <subject>

[可选 body]

[可选 footer]
```

**type 类型：**

| type | 含义 |
|------|------|
| `feat` | 新功能（对应 DEV 任务） |
| `fix` | 缺陷修复 |
| `test` | 测试相关（对应 TEST 任务） |
| `docs` | 文档更新 |
| `refactor` | 重构（不新增功能，不修复 bug） |
| `perf` | 性能优化 |
| `chore` | 构建配置、CI 等工程性变更 |
| `revert` | 回滚 commit |

**scope 规范（必须包含任务编号）：**

```bash
# 正确示例
feat(DEV-1.2.1): 实现 GlobalModelRequestQueue 串行化调度器
test(TEST-1.2.1a): 添加队列串行性保证单元测试
fix(DEV-1.3.2): 修复 FileMutex 重入检测逻辑
docs(DOC): 更新 phase1-task-breakdown.md 任务进度

# 错误示例（不接受）
feat: add queue                    # 缺少任务编号
fix: bug fix                       # 描述不清
update files                       # 无 type 前缀
```

**禁止行为：**
- 一个 Commit 包含多个不相关任务的变更
- Commit message 使用中文以外的语言混用（保持统一）
- 空 Commit message 或无意义描述（如 "wip"、"temp"、"test"）

---

## 三、Issue 管理规范

### **Issue 类型与模板**

项目使用以下四种 Issue 类型，每种类型有对应的模板：

**1. 功能需求 (Feature Request)**
```markdown
## 需求描述
<!-- 清晰描述需要实现的功能 -->

## 关联任务
<!-- 关联 phase1-task-breakdown.md 中的 DEV 任务编号 -->
任务编号：DEV-x.x.x

## 验收标准
<!-- 列出可验证的完成条件 -->
- [ ] 条件 1
- [ ] 条件 2

## 优先级
<!-- P0（阻塞）/ P1（高）/ P2（中）/ P3（低） -->
优先级：P1

## 预计工期
<!-- 工作日 -->
预计：X 天
```

**2. 缺陷报告 (Bug Report)**
```markdown
## 问题描述
<!-- 现象是什么，预期行为是什么 -->

## 复现步骤
1. 步骤一
2. 步骤二
3. 步骤三

## 环境信息
- OS：macOS 14.x / Windows 11 / Ubuntu 22.04
- VS Code 版本：
- Node.js 版本：
- caiode 插件版本：

## 严重程度
<!-- Critical / High / Medium / Low -->
严重程度：High

## 相关日志
<!-- 粘贴 Output Channel 或终端日志 -->
```

**3. 技术债务 (Tech Debt)**
```markdown
## 债务描述
<!-- 当前实现存在什么问题 -->

## 影响范围
<!-- 影响哪些模块或功能 -->

## 建议方案
<!-- 推荐的改进方向 -->

## 偿还优先级
<!-- 必须在 Phase X 前解决 / 可延后 -->
```

**4. 文档缺失 (Documentation)**
```markdown
## 缺失内容
<!-- 哪个文档缺失或需要更新 -->

## 关联文档路径
docs/xxx/xxx.md

## 更新原因
```

### **Issue 标签体系**

| 标签 | 颜色 | 含义 |
|------|------|------|
| `phase-1` / `phase-2` / `phase-3` | 蓝色系 | 所属阶段 |
| `priority-p0` | 红色 | 阻塞级，必须立即处理 |
| `priority-p1` | 橙色 | 高优先级 |
| `priority-p2` | 黄色 | 中优先级 |
| `priority-p3` | 灰色 | 低优先级 |
| `type-feat` | 绿色 | 功能需求 |
| `type-bug` | 红色 | 缺陷 |
| `type-tech-debt` | 紫色 | 技术债务 |
| `type-docs` | 蓝色 | 文档 |
| `status-in-progress` | 黄色 | 进行中 |
| `status-blocked` | 红色 | 被阻塞 |
| `status-review` | 蓝色 | 待评审 |
| `needs-test` | 橙色 | 需要测试验证 |

### **Issue 生命周期**

```
Open → In Progress → In Review → Closed
         ↓
       Blocked（标注阻塞原因和阻塞方）
```

- 所有 Issue 必须在 **48 小时内**被分配负责人，否则升级处理
- P0 级 Issue 必须在 **24 小时内**开始处理
- Issue 关闭时必须关联对应的 PR 链接

---

## 四、Pull Request 规范

### **PR 创建要求**

**PR 标题格式：**
```
<type>(<scope>): <subject>

# 示例
feat(DEV-1.2.1): 实现 GlobalModelRequestQueue 串行化 LLM 请求队列
fix(DEV-1.3.2): 修复跨进程文件锁 stale lock 超时清理逻辑
```

**PR 描述模板：**
```markdown
## 变更概述
<!-- 用 1-3 句话描述本 PR 做了什么 -->

## 关联任务 / Issue
<!-- 使用 Closes #xxx 自动关闭 Issue -->
Closes #xxx
关联任务：DEV-x.x.x

## 变更内容
### 新增
- 

### 修改
- 

### 删除
- 

## 测试验证
<!-- 说明已执行的测试，并提供证据 -->
- [ ] 单元测试通过（`npm run test`）
- [ ] 覆盖率 > 85%（`npm run coverage`）
- [ ] 集成测试通过
- [ ] 手动验证通过

## 截图 / 日志（如适用）
<!-- 粘贴关键截图或命令输出 -->

## 注意事项
<!-- Reviewer 需要特别关注的地方 -->

## Checklist
- [ ] Commit message 符合规范（包含任务编号）
- [ ] `dist/` 和 `node_modules/` 未入库
- [ ] 相关文档已同步更新
- [ ] `phase1-task-breakdown.md` 进度已更新
```

### **PR 大小限制**

| 类型 | 建议变更行数 | 超出处理方式 |
|------|------------|------------|
| 功能 PR | ≤ 400 行 | 拆分为多个子 PR |
| 重构 PR | ≤ 600 行 | 拆分为多个步骤 |
| 文档 PR | 不限 | — |
| 配置 PR | ≤ 100 行 | — |

**禁止在单个 PR 中混入 `node_modules/` 或 `dist/` 文件**，一经发现直接 Request Changes。

### **Code Review 规范**

**Reviewer 职责：**
- 在 **48 小时内**完成 Review（P0 PR 为 **4 小时**）
- Review 评论分级使用前缀标注：
  - `[MUST]`：必须修改，否则不通过
  - `[SUGGEST]`：建议修改，可讨论
  - `[QUESTION]`：有疑问，需要解释
  - `[NIT]`：细节问题，可忽略

**PR 合并条件（缺一不可）：**
- CI 全绿（lint + build + test 三阶段均通过）
- 无未解决的 `[MUST]` 评论
- `main` 分支 PR：至少 2 个 Approve
- `develop` 分支 PR：至少 1 个 Approve
- 无合并冲突（需 PR 作者自行解决）

**禁止行为：**
- 自己 Approve 自己的 PR
- 在 CI 未通过时强制合并
- 合并后不删除源分支

---

## 五、CI/CD 流水线规范

### **流水线总览**

```
代码推送 / PR 创建
      │
      ▼
┌─────────────────────────────────────────┐
│           CI Pipeline (ci.yml)           │
│                                          │
│  Stage 1: Lint                           │
│  ├── ESLint (TypeScript)                 │
│  ├── Prettier 格式检查                    │
│  └── dist/ node_modules/ 入库检查        │
│                                          │
│  Stage 2: Build                          │
│  ├── TypeScript 编译 (tsc --noEmit)      │
│  ├── esbuild 打包                        │
│  └── 产物大小检查 (< 5MB)                │
│                                          │
│  Stage 3: Test                           │
│  ├── 单元测试 (vitest)                   │
│  ├── 覆盖率检查 (> 85%)                  │
│  └── @vscode/test-electron E2E 测试      │
└─────────────────────────────────────────┘
      │ 全绿
      ▼
  PR 可合并 / 代码合并至 develop
      │
      ▼（合并至 main 时额外触发）
┌─────────────────────────────────────────┐
│         Release Pipeline (release.yml)   │
│                                          │
│  ├── 版本号自动递增 (semver)              │
│  ├── Changelog 自动生成                  │
│  ├── vsce package (.vsix 打包)           │
│  ├── GitHub Release 创建                 │
│  └── .vsix 上传至 Release Assets         │
└─────────────────────────────────────────┘
```

### **ci.yml 关键配置要求**

```yaml
# 触发条件
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

# 必须包含的检查步骤
jobs:
  lint:
    steps:
      - name: Check dist/ and node_modules/ not committed
        run: |
          if git diff --name-only HEAD | grep -E "^(dist/|node_modules/)"; then
            echo "ERROR: dist/ or node_modules/ should not be committed"
            exit 1
          fi
      - name: Run ESLint
      - name: Check Prettier formatting

  build:
    needs: lint
    steps:
      - name: TypeScript type check
      - name: Build extension
      - name: Check bundle size

  test:
    needs: build
    steps:
      - name: Run unit tests with coverage
      - name: Assert coverage > 85%
      - name: Run E2E tests
```

### **CI 失败处理规范**

| 失败类型 | 处理要求 | 超时时间 |
|---------|---------|---------|
| Lint 失败 | PR 作者立即修复 | 2 小时 |
| Build 失败 | PR 作者立即修复 | 4 小时 |
| UT 失败 | PR 作者立即修复 | 4 小时 |
| 覆盖率不达标 | PR 作者补充测试 | 8 小时 |
| E2E 失败 | 评估是否为 flaky test | 24 小时 |

**CI 耗时目标：**
- Lint Stage：< 2 分钟
- Build Stage：< 3 分钟
- Test Stage：< 5 分钟
- **总耗时：< 10 分钟**

超出耗时目标需提 Tech Debt Issue 进行优化。

### **环境变量与密钥管理**

- 所有密钥（API Key、Token）必须存储在 **GitHub Repository Secrets**
- 严禁在代码、配置文件、Commit message 中出现明文密钥
- `.env` 文件只允许包含占位符，真实值通过 Secrets 注入
- CI 中使用 `${{ secrets.XXX }}` 引用，不允许 `echo` 打印 Secret 值

---

## 六、发布管理规范

### **版本号规则（Semantic Versioning）**

```
MAJOR.MINOR.PATCH

MAJOR：不兼容的 API 变更（如 IPC 协议重大变更）
MINOR：向后兼容的新功能（如新增配置项）
PATCH：向后兼容的缺陷修复
```

### **发布流程**

```
1. 从 develop 创建 release/vX.X.X 分支
2. 在 release 分支上：
   - 更新 package.json 版本号
   - 更新 CHANGELOG.md
   - 最终回归测试
3. PR 合并至 main（需 2 个 Approve）
4. CI 自动触发 release.yml：
   - 打 Git Tag（vX.X.X）
   - 生成 .vsix 安装包
   - 创建 GitHub Release
5. 同步合并 main → develop（保持同步）
6. 删除 release 分支
```

### **Hotfix 流程**

```
main 发现 Critical Bug
      │
      ▼
从 main 创建 fix/BUG-xxx-hotfix 分支
      │
      ▼
修复 + 测试验证
      │
      ▼
PR 合并至 main（需 2 个 Approve + CI 全绿）
      │
      ▼
自动触发 Patch 版本发布
      │
      ▼
同步合并 main → develop
```

---

## 七、违规处理规则

以下行为视为**严重违规**，PR 将被立即关闭，需重新提交：

1. `dist/` 或 `node_modules/` 出现在 PR diff 中
2. Commit message 不含任务编号
3. 在 CI 未通过时请求强制合并
4. 明文密钥出现在任何文件中
5. 单个 PR 混入多个无关任务的变更
6. 绕过 Code Review 直接合并（即使有权限）

---

*文档路径建议：`docs/planning/github-workflow-rules.md`*
