# Phase P2 中文注释规范

> 角色：前端工程师 / Novel 模块开发 Agent
> 任务：Phase P2-E Commit Governance
> 日期：2026-06-21

---

## 1. 目标

P2 阶段新增复杂代码必须包含中文注释，确保：
- 设计决策可追溯。
- 阶段边界（P2 不做什么）清晰。
- 失败策略和错误码原因明确。
- 后续 Agent / 维护者能快速理解约束。

---

## 2. 必须写中文注释的位置

1. **Adapter 抽象与 Router**
   - 说明 Adapter 职责。
   - 说明 P2-E 只做 mock/stub，不接真实服务。
   - 说明默认路由规则与 disabled adapter 错误策略。

2. **Stub 实现（OpenCode / ClaudeCode）**
   - 说明当前只是 stub。
   - 说明真实接入放到后续阶段。
   - 说明禁止真实调用的原因。

3. **Tool 与 Workflow 集成**
   - 说明 Tool 与 AdapterRouter 的关系。
   - 说明 Tool 不直接知道模型，只通过 adapter 抽象执行。

4. **Hook / Precommit 脚本**
   - 说明哪些规则是 block，哪些是 warning。
   - 说明 BLACKBOX createStore 规则为什么先 warning 或 fail。

5. **复杂 ViewModel / 状态管理**
   - 说明为什么用 createStore 或为什么暂时保留多个 createSignal。

---

## 3. 禁止的注释

- 无意义注释：`// do something`、`// TODO implement`。
- 与代码明显重复的注释。
- 英文混用（保持统一中文）。
- 未解释"为什么"的注释。

---

## 4. 注释应回答的问题

```text
为什么这样设计？
当前阶段边界是什么？
为什么不接真实服务？
失败时为什么返回结构化错误？
```

---

## 5. 示例

```typescript
/**
 * 默认未指定 adapter → 返回 mock。
 * 显式请求 disabled adapter → 返回 ADAPTER_DISABLED，不 fallback，避免伪成功。
 */
```
