export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  metadata?: {
    model?: string;
    tokens?: { prompt: number; completion: number };
    latency?: number;
  };
}

export interface AIChatPanelConfig {
  nonce: string;
  title?: string;
  placeholder?: string;
  showQuickActions?: boolean;
  showTokenCount?: boolean;
  maxHeight?: string;
}

export function getAIChatPanelHtml(config: AIChatPanelConfig): string {
  const {
    nonce,
    title = "AI Assistant",
    placeholder = "Ask AI about this chapter...",
    showQuickActions = true,
    showTokenCount = true,
    maxHeight = "100%",
  } = config;

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
${getStyles(showQuickActions, showTokenCount, maxHeight)}
  </style>
</head>
<body>
${getBodyContent(title, placeholder)}
  <script nonce="${nonce}">
${getClientScript()}
  </script>
</body>
</html>`;
}

function getStyles(
  showQuickActions: boolean,
  showTokenCount: boolean,
  maxHeight: string
): string {
  return `:root {
  --bg: var(--vscode-editor-background, #1e1e1e);
  --fg: var(--vscode-editor-foreground, #d4d4d4);
  --border: var(--vscode-panel-border, #3c3c3c);
  --accent: var(--vscode-button-background, #0e639c);
  --accent-fg: var(--vscode-button-foreground, #ffffff);
  --sidebar-bg: var(--vscode-sideBar-background, #252526);
  --input-bg: var(--vscode-input-background, #3c3c3c);
  --input-border: var(--vscode-input-border, #3c3c3c);
  --text-link: var(--vscode-textLink-foreground, #3794ff);
  --toolbar-bg: var(--vscode-toolbar-hoverBackground, #2a2d2e);
  --selection-bg: var(--vscode-editor-selectionBackground, #264f78);
  --error-bg: var(--vscode-inputValidation-errorBackground, #5a1d1d);
  --error-border: var(--vscode-inputValidation-errorBorder, #be1100);
  --success-bg: #1e3a1e;
  --warning-bg: #3a3a1e;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
  background: var(--bg); color: var(--fg); height: ${maxHeight};
  display: flex; flex-direction: column; overflow: hidden;
}
.ai-panel-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 14px; border-bottom: 1px solid var(--border);
  background: var(--sidebar-bg); flex-shrink: 0;
}
.ai-panel-title { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; }
.ai-status-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: #73d216; transition: background 0.3s;
}
.ai-status-dot.connecting { background: #f0c000; animation: pulse 1s infinite; }
.ai-status-dot.offline { background: #ef2929; }
.ai-status-dot.error { background: #ef2929; animation: pulse 0.5s infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
.ai-panel-actions { display: flex; gap: 6px; }
.icon-btn {
  width: 24px; height: 24px; border: none; border-radius: 4px;
  background: transparent; color: var(--fg); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; opacity: 0.7; transition: all 0.15s;
}
.icon-btn:hover { opacity: 1; background: var(--toolbar-bg); }
.icon-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.quick-actions {
  display: ${showQuickActions ? "flex" : "none"};
  gap: 6px; padding: 8px 12px;
  border-bottom: 1px solid var(--border);
  background: var(--bg); flex-wrap: wrap; flex-shrink: 0;
}
.quick-action-btn {
  padding: 4px 10px; border-radius: 12px;
  border: 1px solid var(--border); background: var(--sidebar-bg);
  color: var(--fg); font-size: 11px; cursor: pointer;
  display: flex; align-items: center; gap: 4px;
  transition: all 0.15s;
}
.quick-action-btn:hover { border-color: var(--accent); background: var(--toolbar-bg); }
.quick-action-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.chat-messages {
  flex: 1; overflow-y: auto; padding: 12px;
  display: flex; flex-direction: column; gap: 12px;
}
.chat-message {
  display: flex; gap: 10px; animation: fadeIn 0.2s ease;
}
@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
.chat-message.user { flex-direction: row-reverse; }
.chat-message-avatar {
  width: 28px; height: 28px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; flex-shrink: 0;
}
.chat-message.user .chat-message-avatar { background: var(--accent); }
.chat-message.assistant .chat-message-avatar { background: var(--toolbar-bg); border: 1px solid var(--border); }
.chat-message.system .chat-message-avatar { background: var(--warning-bg); }
.chat-message-content {
  max-width: calc(100% - 50px);
  padding: 10px 14px; border-radius: 12px;
  font-size: 13px; line-height: 1.6;
  word-wrap: break-word; overflow-wrap: break-word;
}
.chat-message.user .chat-message-content {
  background: var(--accent); color: var(--accent-fg);
  border-bottom-right-radius: 4px;
}
.chat-message.assistant .chat-message-content {
  background: var(--sidebar-bg); border: 1px solid var(--border);
  border-bottom-left-radius: 4px;
}
.chat-message.system .chat-message-content {
  background: var(--warning-bg); border: 1px solid var(--border);
  font-size: 12px; color: var(--fg); opacity: 0.8;
}
.chat-message.streaming .chat-message-content::after {
  content: "\\258b"; animation: blink 1s infinite; margin-left: 2px;
}
@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
.chat-message-content h1, .chat-message-content h2,
.chat-message-content h3, .chat-message-content h4 {
  margin: 12px 0 8px; font-weight: 600;
}
.chat-message-content h1 { font-size: 16px; }
.chat-message-content h2 { font-size: 15px; }
.chat-message-content h3 { font-size: 14px; }
.chat-message-content p { margin: 6px 0; }
.chat-message-content p:first-child { margin-top: 0; }
.chat-message-content p:last-child { margin-bottom: 0; }
.chat-message-content ul, .chat-message-content ol { margin: 6px 0; padding-left: 20px; }
.chat-message-content li { margin: 2px 0; }
.chat-message-content code {
  background: var(--toolbar-bg); padding: 2px 5px;
  border-radius: 3px; font-family: "SF Mono", Monaco, monospace;
  font-size: 12px;
}
.chat-message-content pre {
  background: var(--toolbar-bg); border: 1px solid var(--border);
  border-radius: 6px; padding: 12px; margin: 8px 0;
  overflow-x: auto;
}
.chat-message-content pre code { background: transparent; padding: 0; display: block; line-height: 1.5; }
.chat-message-content blockquote {
  border-left: 3px solid var(--accent); margin: 8px 0;
  padding-left: 12px; opacity: 0.8;
}
.chat-message-content a { color: var(--text-link); text-decoration: none; }
.chat-message-content a:hover { text-decoration: underline; }
.chat-message-content table { border-collapse: collapse; margin: 8px 0; font-size: 12px; }
.chat-message-content th, .chat-message-content td {
  border: 1px solid var(--border); padding: 6px 10px;
}
.chat-message-content th { background: var(--toolbar-bg); }
.code-block-wrapper { position: relative; margin: 8px 0; }
.code-block-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 6px 10px; background: var(--toolbar-bg);
  border: 1px solid var(--border); border-bottom: none;
  border-radius: 6px 6px 0 0; font-size: 11px;
}
.code-language { opacity: 0.6; text-transform: uppercase; }
.code-copy-btn {
  padding: 2px 8px; border: 1px solid var(--border);
  border-radius: 3px; background: var(--sidebar-bg);
  color: var(--fg); font-size: 11px; cursor: pointer;
  opacity: 0.7; transition: opacity 0.15s;
}
.code-copy-btn:hover { opacity: 1; }
.code-copy-btn.copied { background: var(--success-bg); opacity: 1; }
.code-block-wrapper pre { margin: 0; border-radius: 0 0 6px 6px; border-top: none; }
.message-actions {
  display: flex; gap: 8px; margin-top: 6px;
  opacity: 0; transition: opacity 0.15s;
}
.chat-message:hover .message-actions { opacity: 1; }
.message-action-btn {
  padding: 2px 8px; border: 1px solid var(--border);
  border-radius: 4px; background: var(--bg);
  color: var(--fg); font-size: 11px; cursor: pointer;
  display: flex; align-items: center; gap: 4px;
  opacity: 0.7; transition: all 0.15s;
}
.message-action-btn:hover { opacity: 1; background: var(--toolbar-bg); }
.token-count {
  display: ${showTokenCount ? "block" : "none"};
  font-size: 11px; opacity: 0.5; text-align: right;
  padding: 4px 12px; border-top: 1px solid var(--border);
}
.chat-input-area {
  padding: 10px 12px; border-top: 1px solid var(--border);
  background: var(--sidebar-bg); flex-shrink: 0;
}
.chat-input-wrapper {
  display: flex; gap: 8px; align-items: flex-end;
  background: var(--input-bg); border: 1px solid var(--input-border);
  border-radius: 8px; padding: 8px 10px;
}
.chat-input-wrapper:focus-within { border-color: var(--accent); }
.chat-input {
  flex: 1; background: transparent; border: none;
  color: var(--fg); font-size: 13px; resize: none;
  outline: none; font-family: inherit; line-height: 1.5;
  min-height: 20px; max-height: 120px;
}
.chat-input::placeholder { opacity: 0.5; }
.input-actions { display: flex; gap: 6px; align-items: center; }
.send-btn, .stop-btn {
  padding: 6px 14px; border-radius: 6px; border: none;
  font-size: 13px; font-weight: 500; cursor: pointer;
  transition: opacity 0.15s;
}
.send-btn { background: var(--accent); color: var(--accent-fg); }
.stop-btn { background: var(--error-bg); color: var(--accent-fg); display: none; }
.send-btn:hover, .stop-btn:hover { opacity: 0.9; }
.send-btn:disabled, .stop-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.empty-state {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding: 40px 20px; opacity: 0.5;
  text-align: center;
}
.empty-state-icon { font-size: 48px; margin-bottom: 12px; }
.empty-state-text { font-size: 13px; }
.error-message {
  background: var(--error-bg); border: 1px solid var(--error-border);
  border-radius: 6px; padding: 10px 12px; margin: 8px 12px;
  font-size: 12px; display: none;
}
.error-message.visible { display: block; }
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--fg); opacity: 0.3; }`;
}

function getBodyContent(title: string, placeholder: string): string {
  return `<div class="ai-panel-header">
  <div class="ai-panel-title">
    <span class="ai-status-dot" id="aiStatusDot"></span>
    ${escapeHtml(title)}
  </div>
  <div class="ai-panel-actions">
    <button class="icon-btn" id="clearBtn" title="Clear conversation">🗑️</button>
    <button class="icon-btn" id="settingsBtn" title="AI Settings">⚙️</button>
  </div>
</div>
<div class="quick-actions" id="quickActions">
  <button class="quick-action-btn" data-action="continue" data-prompt="Continue writing from where I left off">▶ Continue</button>
  <button class="quick-action-btn" data-action="polish" data-prompt="Polish and improve the writing style">✨ Polish</button>
  <button class="quick-action-btn" data-action="expand" data-prompt="Expand this section with more details">📋 Expand</button>
  <button class="quick-action-btn" data-action="summarize" data-prompt="Summarize the key points">📝 Summarize</button>
  <button class="quick-action-btn" data-action="rewrite" data-prompt="Rewrite this in a different style">🔄 Rewrite</button>
</div>
<div class="error-message" id="errorMessage"></div>
<div class="chat-messages" id="chatMessages">
  <div class="empty-state" id="emptyState">
    <div class="empty-state-icon">🤖</div>
    <div class="empty-state-text">Start a conversation with AI<br>or use quick actions above</div>
  </div>
</div>
<div class="token-count" id="tokenCount"></div>
<div class="chat-input-area">
  <div class="chat-input-wrapper">
    <textarea class="chat-input" id="chatInput" placeholder="${escapeHtml(placeholder)}" rows="1"></textarea>
    <div class="input-actions">
      <button class="send-btn" id="sendBtn">Send</button>
      <button class="stop-btn" id="stopBtn">Stop</button>
    </div>
  </div>
</div>`;
}

function getClientScript(): string {
  // Return the JavaScript code as a string
  // Note: This is client-side JavaScript that runs in the webview
  return `(function() {
const Markdown = {
  escape: (text) => text.replace(/[&<>"']/g, (m) => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m])),
  parse: (text) => {
    let html = Markdown.escape(text);
    html = html.replace(/\`\`\`(\\w+)?\\n([\\s\\S]*?)\`\`\`/g, (match, lang, code) => {
      const language = lang || 'text';
      const escapedCode = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return '<div class="code-block-wrapper"><div class="code-block-header"><span class="code-language">' + language + '</span><button class="code-copy-btn" data-code="' + encodeURIComponent(code.trim()) + '">Copy</button></div><pre><code class="language-' + language + '">' + escapedCode + '</code></pre></div>';
    });
    html = html.replace(/\`([^\`]+)\`/g, '<code>$1</code>');
    html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    html = html.replace(/\\*\\*\\*(.+?)\\*\\*\\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\\*\\*(.+?)\\*\\*/g, '<strong>$1</strong>');
    html = html.replace(/\\*(.+?)\\*/g, '<em>$1</em>');
    html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
    html = html.replace(/_(.+?)_/g, '<em>$1</em>');
    html = html.replace(/\\[([^\\]]+)\\]\\(([^)]+)\\)/g, '<a href="$2" target="_blank">$1</a>');
    html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');
    html = html.replace(/^\\* (.+)$/gm, '<li>$1</li>');
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/^\\d+\\. (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\\/li>\\n?)+/g, '<ul>$&</ul>');
    html = html.replace(/\\n/g, '<br>');
    return html;
  }
};
let messages = [];
let isStreaming = false;
let currentStreamMessageId = null;
let vscode = null;
try { vscode = acquireVsCodeApi(); } catch (e) { console.error("Failed to acquire VS Code API:", e); }
function generateId() { return "msg_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9); }
function addMessage(role, content, metadata) {
  const id = generateId();
  const message = { id, role, content, timestamp: Date.now(), metadata };
  messages.push(message);
  renderMessage(message);
  updateEmptyState();
  return id;
}
function renderMessage(message) {
  const container = document.getElementById("chatMessages");
  const emptyState = document.getElementById("emptyState");
  if (emptyState) emptyState.style.display = "none";
  const messageEl = document.createElement("div");
  messageEl.className = "chat-message " + message.role;
  messageEl.id = message.id;
  const avatarText = message.role === "user" ? "👤" : message.role === "assistant" ? "🤖" : "ℹ️";
  const contentHtml = Markdown.parse(message.content);
  messageEl.innerHTML = '<div class="chat-message-avatar">' + avatarText + '</div><div class="chat-message-content">' + contentHtml + '</div>';
  if (message.role === "assistant") {
    const actionsEl = document.createElement("div");
    actionsEl.className = "message-actions";
    actionsEl.innerHTML = '<button class="message-action-btn" data-action="copy" data-id="' + message.id + '">📋 Copy</button><button class="message-action-btn" data-action="insert" data-id="' + message.id + '">⬇️ Insert</button><button class="message-action-btn" data-action="retry" data-id="' + message.id + '">🔄 Retry</button>';
    messageEl.querySelector(".chat-message-content").appendChild(actionsEl);
  }
  container.appendChild(messageEl);
  container.scrollTop = container.scrollHeight;
}
function updateMessage(id, content) {
  const messageEl = document.getElementById(id);
  if (messageEl) {
    const contentEl = messageEl.querySelector(".chat-message-content");
    contentEl.innerHTML = Markdown.parse(content);
  }
  const msg = messages.find(m => m.id === id);
  if (msg) msg.content = content;
}
function updateEmptyState() {
  const emptyState = document.getElementById("emptyState");
  if (emptyState) { emptyState.style.display = messages.length === 0 ? "flex" : "none"; }
}
function showError(message) {
  const errorEl = document.getElementById("errorMessage");
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.add("visible");
    setTimeout(() => errorEl.classList.remove("visible"), 5000);
  }
}
function updateTokenCount(prompt, completion) {
  const tokenEl = document.getElementById("tokenCount");
  if (tokenEl && prompt && completion) { tokenEl.textContent = "Tokens: " + prompt + " prompt / " + completion + " completion"; }
}
function updateAIStatus(status) {
  const dot = document.getElementById("aiStatusDot");
  if (dot) { dot.className = "ai-status-dot " + status; }
}
function setStreaming(streaming) {
  isStreaming = streaming;
  const sendBtn = document.getElementById("sendBtn");
  const stopBtn = document.getElementById("stopBtn");
  const input = document.getElementById("chatInput");
  const quickActions = document.querySelectorAll(".quick-action-btn");
  if (sendBtn) sendBtn.style.display = streaming ? "none" : "block";
  if (stopBtn) stopBtn.style.display = streaming ? "block" : "none";
  if (input) input.disabled = streaming;
  quickActions.forEach(btn => btn.disabled = streaming);
  if (currentStreamMessageId) {
    const msgEl = document.getElementById(currentStreamMessageId);
    if (msgEl) msgEl.classList.toggle("streaming", streaming);
  }
}
function sendMessage(content, action) {
  if (!content.trim() || isStreaming) return;
  addMessage("user", content);
  document.getElementById("chatInput").value = "";
  currentStreamMessageId = generateId();
  addMessage("assistant", "", {});
  setStreaming(true);
  updateAIStatus("connecting");
  if (vscode) { vscode.postMessage({ type: "ai.chat", payload: { message: content, action: action || "chat", messageId: currentStreamMessageId } }); }
}
function handleQuickAction(action, prompt) { sendMessage(prompt, action); }
function clearConversation() {
  messages = [];
  document.getElementById("chatMessages").innerHTML = '<div class="empty-state" id="emptyState"><div class="empty-state-icon">🤖</div><div class="empty-state-text">Start a conversation with AI<br>or use quick actions above</div></div>';
  updateEmptyState();
  if (vscode) { vscode.postMessage({ type: "ai.clear", payload: {} }); }
}
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.querySelector(".code-copy-btn.copied, .message-action-btn[data-action='copy'].copied");
    if (btn) {
      const original = btn.textContent;
      btn.textContent = "✓ Copied";
      setTimeout(() => btn.textContent = original, 2000);
    }
  });
}
function insertIntoEditor(text) { if (vscode) { vscode.postMessage({ type: "ai.insert", payload: { text: text } }); } }
function stopGeneration() {
  if (vscode) { vscode.postMessage({ type: "ai.stop", payload: {} }); }
  setStreaming(false);
  updateAIStatus("online");
}
function openSettings() { if (vscode) { vscode.postMessage({ type: "navigation.navigate", payload: { page: "settings" } }); } }

function initChatPanel() {
  const chatInput = document.getElementById("chatInput");
  const sendBtn = document.getElementById("sendBtn");
  const stopBtn = document.getElementById("stopBtn");
  const clearBtn = document.getElementById("clearBtn");
  const settingsBtn = document.getElementById("settingsBtn");
  const quickActions = document.getElementById("quickActions");
  if (chatInput) {
    chatInput.addEventListener("keydown", function(e) {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(chatInput.value); }
    });
    chatInput.addEventListener("input", function() {
      this.style.height = "auto";
      this.style.height = Math.min(this.scrollHeight, 120) + "px";
    });
  }
  if (sendBtn) { sendBtn.addEventListener("click", function() { sendMessage(chatInput.value); }); }
  if (stopBtn) { stopBtn.addEventListener("click", stopGeneration); }
  if (clearBtn) { clearBtn.addEventListener("click", clearConversation); }
  if (settingsBtn) { settingsBtn.addEventListener("click", openSettings); }
  if (quickActions) {
    quickActions.addEventListener("click", function(e) {
      const btn = e.target.closest(".quick-action-btn");
      if (btn && !btn.disabled) { handleQuickAction(btn.dataset.action, btn.dataset.prompt); }
    });
  }
  document.getElementById("chatMessages").addEventListener("click", function(e) {
    const copyBtn = e.target.closest(".code-copy-btn");
    if (copyBtn) {
      const code = decodeURIComponent(copyBtn.dataset.code);
      copyToClipboard(code);
      copyBtn.classList.add("copied");
      copyBtn.textContent = "✓ Copied";
      setTimeout(() => { copyBtn.classList.remove("copied"); copyBtn.textContent = "Copy"; }, 2000);
      return;
    }
    const actionBtn = e.target.closest(".message-action-btn");
    if (actionBtn) {
      const action = actionBtn.dataset.action;
      const msgId = actionBtn.dataset.id;
      const msg = messages.find(m => m.id === msgId);
      if (!msg) return;
      if (action === "copy") { copyToClipboard(msg.content); }
      else if (action === "insert") { insertIntoEditor(msg.content); }
      else if (action === "retry") {
        const userMsg = messages[messages.indexOf(msg) - 1];
        if (userMsg && userMsg.role === "user") { sendMessage(userMsg.content); }
      }
    }
  });
  window.addEventListener("message", function(event) {
    const message = event.data;
    if (!message || !message.type) return;
    switch (message.type) {
      case "ai.stream.chunk":
        if (currentStreamMessageId && message.payload && message.payload.chunk) {
          const msg = messages.find(m => m.id === currentStreamMessageId);
          if (msg) { msg.content += message.payload.chunk; updateMessage(currentStreamMessageId, msg.content); }
        }
        break;
      case "ai.stream.done":
        setStreaming(false);
        updateAIStatus("online");
        if (message.payload && message.payload.tokens) { updateTokenCount(message.payload.tokens.prompt, message.payload.tokens.completion); }
        currentStreamMessageId = null;
        break;
      case "ai.stream.error":
        setStreaming(false);
        updateAIStatus("error");
        showError(message.payload && message.payload.error ? message.payload.error : "An error occurred");
        currentStreamMessageId = null;
        break;
      case "ai.status":
        updateAIStatus(message.payload && message.payload.status ? message.payload.status : "offline");
        break;
    }
  });
  updateEmptyState();
  updateAIStatus("online");
  if (vscode) { vscode.postMessage({ type: "ai.ready", payload: {} }); }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initChatPanel);
} else {
  initChatPanel();
}
})();`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
