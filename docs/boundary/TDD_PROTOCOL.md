# TDD_PROTOCOL.md - 红绿重构三色合同

> **版本**: v0.1  
> **日期**: 2026-05-31  
> **状态**: 生效中  
> **技术栈**: Bun + Vitest + Playwright

---

## 一、核心原则

### 1.1 三色合同定义

| 阶段 | Commit 前缀 | 允许操作 | CI 状态 |
|------|------------|---------|---------|
| **Red** | `red:` | 仅修改 `*.spec.ts` | ❌ 必须红 |
| **Green** | `green:` | 仅修改实现代码 | ✅ 必须绿 |
| **Refactor** | `refactor:` | 结构优化，不改功能 | ✅ 必须绿 |

### 1.2 强制顺序

```
Red → Green → Refactor → (下一个 Red)
         ↑__________|
```

- ❌ 禁止跳过 Red 直接 Green
- ❌ 禁止在 Red 中修改实现代码
- ❌ 禁止在 Green 中修改测试
- ❌ 禁止在 Refactor 中改变功能行为

---

## 二、Red 阶段规范

### 2.1 允许的操作

- 创建新的 `*.spec.ts` 文件
- 修改现有测试文件的测试用例
- 添加新的测试用例
- **禁止**: 修改实现代码

### 2.2 测试文件命名

| 类型 | 命名格式 | 示例 |
|------|---------|------|
| 单元测试 | `*.test.ts` | `outline.test.ts` |
| 集成测试 | `*.integration.test.ts` | `outline.integration.test.ts` |
| E2E 测试 | `*.e2e.test.ts` | `outline.e2e.test.ts` |

### 2.3 测试文件位置

```
packages/
├── app/src/
│   ├── components/           # 组件测试
│   │   └── novel-editor.test.tsx
│   ├── hooks/               # Hook 测试
│   │   └── use-novel-project.test.ts
│   └── utils/               # 工具函数测试
│       └── format.test.ts
├── plugin-novel-ai/
│   └── src/
│       └── tools/           # Tool 测试
│           ├── outline.test.ts
│           └── content.test.ts
└── shared-schema/
    └── src/                 # 类型测试
        └── project.test.ts
```

### 2.4 CI 验证

```bash
# Red 阶段，CI 必须红
bun test
# 期望: 退出码非零，测试失败
```

---

## 三、Green 阶段规范

### 3.1 允许的操作

- 修改实现代码（*.ts, *.tsx）
- 创建新的实现文件
- 修改现有实现文件
- **禁止**: 修改任何 `*.spec.ts` 文件
- **禁止**: 新增测试用例

### 3.2 实现原则

- **最短路径**: 用最少的代码让测试通过
- **不追求完美**: 代码可以"丑"，功能必须对
- **可后续重构**: 等 Green 后再优化

### 3.3 CI 验证

```bash
# Green 阶段，CI 必须绿
bun test
# 期望: 退出码 0，测试全部通过
```

---

## 四、Refactor 阶段规范

### 4.1 允许的操作

- 提取函数/类
- 重命名变量/函数
- 优化代码结构
- 改善性能
- **禁止**: 改变功能行为
- **禁止**: 修改测试
- **禁止**: 新增功能

### 4.2 覆盖率要求

```bash
# Refactor 后，覆盖率不得下降
bun test --coverage
# 期望: 覆盖率 >= 上一次 Green 阶段
```

### 4.3 CI 验证

```bash
# Refactor 阶段
bun test                    # 必须绿
bun test --coverage         # 覆盖率不下降
```

---

## 五、Mock Provider 规范

### 5.1 为什么必须 Mock

| 原因 | 说明 |
|------|------|
| 避免网络依赖 | 测试不应依赖外部 API |
| 避免费用 | 真实 LLM 调用有成本 |
| 避免测试漂移 | LLM 输出不确定 |
| 加快测试速度 | 本地 Mock 比网络快 |

### 5.2 Mock Provider 实现

```typescript
// packages/shared-schema/src/mocks/provider.ts
import type { Provider } from '../types';

export class MockLLMProvider implements Provider {
  async complete(input: string): Promise<string> {
    // 返回固定的测试响应
    return `Mock response for: ${input.slice(0, 20)}...`;
  }

  async stream(input: string): AsyncGenerator<string> {
    const response = await this.complete(input);
    for (const char of response) {
      yield char;
    }
  }
}

export const mockProvider = new MockLLMProvider();
```

### 5.3 Mock 在测试中的使用

```typescript
// red: 某个 Tool 的测试
import { mockProvider } from '@opencode-novel/shared-schema/mocks';

describe('Outline Tool', () => {
  it('should generate outline', async () => {
    // 使用 Mock Provider
    const result = await generateOutline({
      projectId: 'test-project',
      chapters: 10,
      provider: mockProvider
    });

    expect(result.ok).toBe(true);
    expect(result.data.chapters).toHaveLength(10);
  });
});
```

---

## 六、测试分类规范

### 6.1 单元测试 (Unit)

- **范围**: 最小可测试单元（函数、类、组件）
- **位置**: `*.test.ts` / `*.test.tsx`
- **依赖**: 无外部依赖（全部 Mock）
- **速度**: < 100ms 每个测试

### 6.2 集成测试 (Integration)

- **范围**: 模块间的交互
- **位置**: `*.integration.test.ts`
- **依赖**: SQLite in-memory、Mock Provider
- **速度**: < 1s 每个测试

### 6.3 E2E 测试 (End-to-End)

- **范围**: 完整用户流程
- **位置**: `*.e2e.test.ts`
- **依赖**: Playwright、真实或 Mock 服务器
- **速度**: < 10s 每个测试

---

## 七、覆盖率要求

### 7.1 覆盖率基线

| 模块 | 最低覆盖率 |
|------|-----------|
| `shared-schema` | 100% |
| `plugin-novel-ai` | 90% |
| `plugin-novel-assets` | 85% |
| `server-billing` | 95% |
| `app/src/novel` | 80% |

### 7.2 覆盖率检查

```bash
# 运行覆盖率
bun test --coverage

# 检查覆盖率
bun coverage:check

# 期望: 所有模块都达到最低覆盖率
```

---

## 八、TDD 循环示例

### 8.1 完整循环

```bash
# Step 1: Red - 写测试
git commit -m "red: outline tool should validate project id"

# Step 2: Green - 实现
git commit -m "green: add project id validation to outline tool"

# Step 3: Refactor - 优化
git commit -m "refactor: extract validation to helper function"
```

### 8.2 禁止的 Commit 序列

```bash
# ❌ 错误：跳过 Red
git commit -m "feat: add outline tool"

# ❌ 错误：Red 中改实现
git commit -m "red: fix test AND update implementation"  # 不允许！

# ❌ 错误：Green 中改测试
git commit -m "green: implement AND fix test"  # 不允许！
```

---

## 九、CI 集成

### 9.1 GitHub Actions 配置

```yaml
# .github/workflows/tdd.yml
name: TDD Contract

on:
  push:
    branches: [main, develop]

jobs:
  red-phase:
    if: startsWith(github.event.head_commit.message, 'red:')
    steps:
      - name: Run tests (must FAIL)
        run: bun test
        # 期望: 失败

  green-phase:
    if: startsWith(github.event.head_commit.message, 'green:')
    steps:
      - name: Run tests (must PASS)
        run: bun test
        # 期望: 成功

  refactor-phase:
    if: startsWith(github.event.head_commit.message, 'refactor:')
    steps:
      - name: Run tests
        run: bun test
      - name: Check coverage
        run: bun coverage:check
        # 期望: 覆盖率不下降
```

---

## 十、违规处理

| 违规类型 | 检测方式 | 处理方式 |
|---------|---------|---------|
| 跳过 Red | Commit message 检查 | PR 关闭 |
| Red 中改实现 | CI 额外检查 | PR Request Changes |
| Green 中改测试 | CI 额外检查 | PR Request Changes |
| 覆盖率下降 | `coverage:check` | PR Request Changes |

---

*本文档是 StoryTree2 TDD 流程的强制规范，所有 Agent 必须无条件遵守。*
