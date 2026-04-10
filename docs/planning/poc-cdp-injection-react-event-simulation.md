# PoC 验证任务分解：CDP 注入 Trae IDE React 组件

---

## Step 1：建立 CDP 连接并枚举 WebView Target

**目标：** 确认能通过 CDP 协议连接到 Trae IDE 的 WebView 渲染进程，并找到正确的 target。

具体操作是以 `--remote-debugging-port=9222` 参数启动 Trae IDE，然后用 Node.js 调用 `http://localhost:9222/json` 列出所有 target，从中筛选出 URL 包含 Trae IDE WebView 特征的条目，记录其 `webSocketDebuggerUrl`。

**验证方式：** 能从 `/json` 接口返回的列表中稳定识别出唯一的目标 WebView target，且 WebSocket 握手成功，`Target.getTargetInfo` 返回正确的 title 和 url。如果出现多个候选 target，说明 target 识别逻辑需要加过滤条件，这本身就是一个需要记录的发现。

---

## Step 2：通过 CDP 获取输入框的 DOM 结构快照

**目标：** 确认能读取到 Trae IDE 聊天输入框的 DOM 结构，并识别其 React 组件边界。

操作方式是通过 `DOM.getDocument` 获取完整 DOM 树，再用 `Runtime.evaluate` 执行以下脚本，探查输入框的真实 selector：

```javascript
// 探查输入框的 fiber key（React 内部属性）
const el = document.querySelector('textarea, [contenteditable="true"], [role="textbox"]');
const fiberKey = Object.keys(el).find(k => k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance'));
return { tagName: el.tagName, fiberKey, id: el.id, className: el.className };
```

**验证方式：** 脚本返回非空结果，且 `fiberKey` 字段存在（证明该元素是 React 管理的组件节点）。如果 `fiberKey` 为空，说明该输入框不是 React 直接渲染的节点，需要向上遍历父节点重新查找，这是 Step 2 的失败判定条件，必须在此步骤解决后才能进入 Step 3。

---

## Step 3：验证原生 DOM value 赋值是否对 React 状态生效

**目标：** 这是评审意见中点名的核心风险点——直接操作 `element.value` 在 React 受控组件中通常无效，必须通过 React 合成事件系统触发状态更新。

先执行"错误方式"作为对照基准：

```javascript
const el = document.querySelector('textarea');
el.value = 'PoC test input';
el.dispatchEvent(new Event('input', { bubbles: true }));
```

然后执行"正确方式"，通过 React 内部的 nativeInputValueSetter 绕过受控组件拦截：

```javascript
const el = document.querySelector('textarea');
const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
nativeInputValueSetter.call(el, 'PoC test input');
el.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true }));
```

**验证方式：** 在 Trae IDE 界面上肉眼观察输入框是否出现文字；同时用 `Runtime.evaluate` 读取输入框当前 value 与 React fiber 上的 `memoizedState` 是否一致。两者一致才算通过。如果界面显示但 fiber state 不更新，说明 React 状态未同步，提交操作将发送空内容——这是 **必须修复的阻塞项**。

---

## Step 4：验证提交动作的触发方式

**目标：** 确认触发"发送消息"的正确事件序列，区分 `Enter` 键触发与按钮点击触发两种路径。

分两个子步骤：先尝试模拟键盘事件：

```javascript
el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true }));
```

再尝试直接点击发送按钮：

```javascript
const sendBtn = document.querySelector('[data-testid="send-button"], button[type="submit"]');
sendBtn?.click();
```

**验证方式：** 观察 Trae IDE 界面是否出现"消息发送中"的 loading 状态，或消息列表中是否新增了一条用户消息气泡。同时通过 `DOM.setEventListenerBreakpoint` 在 CDP 侧设置断点，确认事件被正确的 handler 捕获。两种触发方式都需要记录结果，以便后续选择更稳定的方案。

---

## Step 5：验证响应内容的轮询提取

**目标：** 确认能通过 CDP 稳定地读取到大模型的回复内容，并判断响应是否已完成。

实现一个轮询脚本，每 500ms 执行一次：

```javascript
const messages = document.querySelectorAll('[data-role="assistant"], .assistant-message, [class*="assistant"]');
const last = messages[messages.length - 1];
return {
  content: last?.innerText,
  isStreaming: !!document.querySelector('[class*="loading"], [class*="streaming"], [class*="typing"]')
};
```

**验证方式：** 在手动发送一条消息后，脚本能在响应完成后返回完整的 `content`，且 `isStreaming` 从 `true` 变为 `false` 的时序是稳定可预期的（允许误差在 1s 内）。如果 `isStreaming` 判断不准确，说明 loading 状态的 selector 识别有误，需要在此步骤修正选择器后再继续。

---

## Step 6：端到端流程串联验证

**目标：** 将 Step 1\~5 串联为一个完整的自动化脚本，验证全链路的稳定性。

脚本流程为：建立连接 → 定位输入框 → 注入文本 → 触发提交 → 等待响应完成 → 提取响应文本 → 打印结果。连续执行 3 次，每次使用不同的输入内容。

**验证方式：** 3 次执行全部成功，且提取到的响应文本与 Trae IDE 界面显示一致（通过截图对比）。记录每次执行的耗时，如果耗时方差超过 50%，说明轮询策略不稳定，需要改为基于 DOM MutationObserver 的事件驱动方案而非定时轮询。

---

## Step 7：元素 ID 绑定稳定性压测

**目标：** 针对评审意见中"元素 ID 在版本迭代中不稳定"的核心风险，验证当前选择器策略的鲁棒性。

操作方式是在 Trae IDE 中切换不同的功能面板（如从 Chat 切换到 Code 再切回），以及模拟刷新 WebView，每次切换后重新执行 Step 2 的选择器查询。

**验证方式：** 记录每次查询返回的 selector 路径是否一致。如果出现不一致，需要统计变化的维度（ID 变化、className 变化还是 DOM 层级变化），并以此作为信心度评估机制中"稳定性历史"维度的原始数据。这一步的产出不是"通过/失败"，而是一份 **选择器稳定性报告**，直接输入到后续正式方案的信心度阈值校准中。

---

以上 7 个步骤构成完整的 PoC 验证链路，每步的验证结果都有明确的通过/失败判定，且失败时有对应的调查方向。建议将 Step 3 和 Step 5 作为优先级最高的验证项，因为这两步的结论直接决定整个方案的技术路径是否成立。