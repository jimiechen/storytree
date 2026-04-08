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

  // Build script content using string concatenation to avoid template literal issues
  const scriptContent = buildScriptContent();

  return (
    '<!DOCTYPE html>\n' +
    '<html lang="zh-CN">\n' +
    '<head>\n' +
    '  <meta charset="UTF-8">\n' +
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
    '  <title>' + escapeHtml(title) + '</title>\n' +
    '  <style>\n' +
    getStyles(showQuickActions, showTokenCount, maxHeight) +
    '  </style>\n' +
    '</head>\n' +
    '<body>\n' +
    getBodyContent(title, placeholder) +
    '  <script nonce="' + nonce + '">\n' +
    scriptContent +
    '  </script>\n' +
    '</body>\n' +
    '</html>'
  );
}

function getStyles(
  showQuickActions: boolean,
  showTokenCount: boolean,
  maxHeight: string
): string {
  return (
    ':root {\n' +
    '  --bg: var(--vscode-editor-background, #1e1e1e);\n' +
    '  --fg: var(--vscode-editor-foreground, #d4d4d4);\n' +
    '  --border: var(--vscode-panel-border, #3c3c3c);\n' +
    '  --accent: var(--vscode-button-background, #0e639c);\n' +
    '  --accent-fg: var(--vscode-button-foreground, #ffffff);\n' +
    '  --sidebar-bg: var(--vscode-sideBar-background, #252526);\n' +
    '  --input-bg: var(--vscode-input-background, #3c3c3c);\n' +
    '  --input-border: var(--vscode-input-border, #3c3c3c);\n' +
    '  --text-link: var(--vscode-textLink-foreground, #3794ff);\n' +
    '  --toolbar-bg: var(--vscode-toolbar-hoverBackground, #2a2d2e);\n' +
    '  --selection-bg: var(--vscode-editor-selectionBackground, #264f78);\n' +
    '  --error-bg: var(--vscode-inputValidation-errorBackground, #5a1d1d);\n' +
    '  --error-border: var(--vscode-inputValidation-errorBorder, #be1100);\n' +
    '  --success-bg: #1e3a1e;\n' +
    '  --warning-bg: #3a3a1e;\n' +
    '}\n' +
    '* { margin: 0; padding: 0; box-sizing: border-box; }\n' +
    'body {\n' +
    '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;\n' +
    '  background: var(--bg); color: var(--fg); height: ' + maxHeight + ';\n' +
    '  display: flex; flex-direction: column; overflow: hidden;\n' +
    '}\n' +
    '.ai-panel-header {\n' +
    '  display: flex; align-items: center; justify-content: space-between;\n' +
    '  padding: 10px 14px; border-bottom: 1px solid var(--border);\n' +
    '  background: var(--sidebar-bg); flex-shrink: 0;\n' +
    '}\n' +
    '.ai-panel-title { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; }\n' +
    '.ai-status-dot {\n' +
    '  width: 8px; height: 8px; border-radius: 50%;\n' +
    '  background: #73d216; transition: background 0.3s;\n' +
    '}\n' +
    '.ai-status-dot.connecting { background: #f0c000; animation: pulse 1s infinite; }\n' +
    '.ai-status-dot.offline { background: #ef2929; }\n' +
    '.ai-status-dot.error { background: #ef2929; animation: pulse 0.5s infinite; }\n' +
    '@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }\n' +
    '.ai-panel-actions { display: flex; gap: 6px; }\n' +
    '.icon-btn {\n' +
    '  width: 24px; height: 24px; border: none; border-radius: 4px;\n' +
    '  background: transparent; color: var(--fg); cursor: pointer;\n' +
    '  display: flex; align-items: center; justify-content: center;\n' +
    '  font-size: 14px; opacity: 0.7; transition: all 0.15s;\n' +
    '}\n' +
    '.icon-btn:hover { opacity: 1; background: var(--toolbar-bg); }\n' +
    '.icon-btn:disabled { opacity: 0.3; cursor: not-allowed; }\n' +
    '.quick-actions {\n' +
    '  display: ' + (showQuickActions ? "flex" : "none") + ';\n' +
    '  gap: 6px; padding: 8px 12px;\n' +
    '  border-bottom: 1px solid var(--border);\n' +
    '  background: var(--bg); flex-wrap: wrap; flex-shrink: 0;\n' +
    '}\n' +
    '.quick-action-btn {\n' +
    '  padding: 4px 10px; border-radius: 12px;\n' +
    '  border: 1px solid var(--border); background: var(--sidebar-bg);\n' +
    '  color: var(--fg); font-size: 11px; cursor: pointer;\n' +
    '  display: flex; align-items: center; gap: 4px;\n' +
    '  transition: all 0.15s;\n' +
    '}\n' +
    '.quick-action-btn:hover { border-color: var(--accent); background: var(--toolbar-bg); }\n' +
    '.quick-action-btn:disabled { opacity: 0.4; cursor: not-allowed; }\n' +
    '.chat-messages {\n' +
    '  flex: 1; overflow-y: auto; padding: 12px;\n' +
    '  display: flex; flex-direction: column; gap: 12px;\n' +
    '}\n' +
    '.chat-message {\n' +
    '  display: flex; gap: 10px; animation: fadeIn 0.2s ease;\n' +
    '}\n' +
    '@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }\n' +
    '.chat-message.user { flex-direction: row-reverse; }\n' +
    '.chat-message-avatar {\n' +
    '  width: 28px; height: 28px; border-radius: 50%;\n' +
    '  display: flex; align-items: center; justify-content: center;\n' +
    '  font-size: 14px; flex-shrink: 0;\n' +
    '}\n' +
    '.chat-message.user .chat-message-avatar { background: var(--accent); }\n' +
    '.chat-message.assistant .chat-message-avatar { background: var(--toolbar-bg); border: 1px solid var(--border); }\n' +
    '.chat-message.system .chat-message-avatar { background: var(--warning-bg); }\n' +
    '.chat-message-content {\n' +
    '  max-width: calc(100% - 50px);\n' +
    '  padding: 10px 14px; border-radius: 12px;\n' +
    '  font-size: 13px; line-height: 1.6;\n' +
    '  word-wrap: break-word; overflow-wrap: break-word;\n' +
    '}\n' +
    '.chat-message.user .chat-message-content {\n' +
    '  background: var(--accent); color: var(--accent-fg);\n' +
    '  border-bottom-right-radius: 4px;\n' +
    '}\n' +
    '.chat-message.assistant .chat-message-content {\n' +
    '  background: var(--sidebar-bg); border: 1px solid var(--border);\n' +
    '  border-bottom-left-radius: 4px;\n' +
    '}\n' +
    '.chat-message.system .chat-message-content {\n' +
    '  background: var(--warning-bg); border: 1px solid var(--border);\n' +
    '  font-size: 12px; color: var(--fg); opacity: 0.8;\n' +
    '}\n' +
    '.chat-message.streaming .chat-message-content::after {\n' +
    '  content: "\\258b"; animation: blink 1s infinite; margin-left: 2px;\n' +
    '}\n' +
    '@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }\n' +
    '.chat-message-content h1, .chat-message-content h2,\n' +
    '.chat-message-content h3, .chat-message-content h4 {\n' +
    '  margin: 12px 0 8px; font-weight: 600;\n' +
    '}\n' +
    '.chat-message-content h1 { font-size: 16px; }\n' +
    '.chat-message-content h2 { font-size: 15px; }\n' +
    '.chat-message-content h3 { font-size: 14px; }\n' +
    '.chat-message-content p { margin: 6px 0; }\n' +
    '.chat-message-content p:first-child { margin-top: 0; }\n' +
    '.chat-message-content p:last-child { margin-bottom: 0; }\n' +
    '.chat-message-content ul, .chat-message-content ol { margin: 6px 0; padding-left: 20px; }\n' +
    '.chat-message-content li { margin: 2px 0; }\n' +
    '.chat-message-content code {\n' +
    '  background: var(--toolbar-bg); padding: 2px 5px;\n' +
    '  border-radius: 3px; font-family: "SF Mono", Monaco, monospace;\n' +
    '  font-size: 12px;\n' +
    '}\n' +
    '.chat-message-content pre {\n' +
    '  background: var(--toolbar-bg); border: 1px solid var(--border);\n' +
    '  border-radius: 6px; padding: 12px; margin: 8px 0;\n' +
    '  overflow-x: auto;\n' +
    '}\n' +
    '.chat-message-content pre code { background: transparent; padding: 0; display: block; line-height: 1.5; }\n' +
    '.chat-message-content blockquote {\n' +
    '  border-left: 3px solid var(--accent); margin: 8px 0;\n' +
    '  padding-left: 12px; opacity: 0.8;\n' +
    '}\n' +
    '.chat-message-content a { color: var(--text-link); text-decoration: none; }\n' +
    '.chat-message-content a:hover { text-decoration: underline; }\n' +
    '.chat-message-content table { border-collapse: collapse; margin: 8px 0; font-size: 12px; }\n' +
    '.chat-message-content th, .chat-message-content td {\n' +
    '  border: 1px solid var(--border); padding: 6px 10px;\n' +
    '}\n' +
    '.chat-message-content th { background: var(--toolbar-bg); }\n' +
    '.code-block-wrapper { position: relative; margin: 8px 0; }\n' +
    '.code-block-header {\n' +
    '  display: flex; justify-content: space-between; align-items: center;\n' +
    '  padding: 6px 10px; background: var(--toolbar-bg);\n' +
    '  border: 1px solid var(--border); border-bottom: none;\n' +
    '  border-radius: 6px 6px 0 0; font-size: 11px;\n' +
    '}\n' +
    '.code-language { opacity: 0.6; text-transform: uppercase; }\n' +
    '.code-copy-btn {\n' +
    '  padding: 2px 8px; border: 1px solid var(--border);\n' +
    '  border-radius: 3px; background: var(--sidebar-bg);\n' +
    '  color: var(--fg); font-size: 11px; cursor: pointer;\n' +
    '  opacity: 0.7; transition: opacity 0.15s;\n' +
    '}\n' +
    '.code-copy-btn:hover { opacity: 1; }\n' +
    '.code-copy-btn.copied { background: var(--success-bg); opacity: 1; }\n' +
    '.code-block-wrapper pre { margin: 0; border-radius: 0 0 6px 6px; border-top: none; }\n' +
    '.message-actions {\n' +
    '  display: flex; gap: 8px; margin-top: 6px;\n' +
    '  opacity: 0; transition: opacity 0.15s;\n' +
    '}\n' +
    '.chat-message:hover .message-actions { opacity: 1; }\n' +
    '.message-action-btn {\n' +
    '  padding: 2px 8px; border: 1px solid var(--border);\n' +
    '  border-radius: 4px; background: var(--bg);\n' +
    '  color: var(--fg); font-size: 11px; cursor: pointer;\n' +
    '  display: flex; align-items: center; gap: 4px;\n' +
    '  opacity: 0.7; transition: all 0.15s;\n' +
    '}\n' +
    '.message-action-btn:hover { opacity: 1; background: var(--toolbar-bg); }\n' +
    '.token-count {\n' +
    '  display: ' + (showTokenCount ? "block" : "none") + ';\n' +
    '  font-size: 11px; opacity: 0.5; text-align: right;\n' +
    '  padding: 4px 12px; border-top: 1px solid var(--border);\n' +
    '}\n' +
    '.chat-input-area {\n' +
    '  padding: 10px 12px; border-top: 1px solid var(--border);\n' +
    '  background: var(--sidebar-bg); flex-shrink: 0;\n' +
    '}\n' +
    '.chat-input-wrapper {\n' +
    '  display: flex; gap: 8px; align-items: flex-end;\n' +
    '  background: var(--input-bg); border: 1px solid var(--input-border);\n' +
    '  border-radius: 8px; padding: 8px 10px;\n' +
    '}\n' +
    '.chat-input-wrapper:focus-within { border-color: var(--accent); }\n' +
    '.chat-input {\n' +
    '  flex: 1; background: transparent; border: none;\n' +
    '  color: var(--fg); font-size: 13px; resize: none;\n' +
    '  outline: none; font-family: inherit; line-height: 1.5;\n' +
    '  min-height: 20px; max-height: 120px;\n' +
    '}\n' +
    '.chat-input::placeholder { opacity: 0.5; }\n' +
    '.input-actions { display: flex; gap: 6px; align-items: center; }\n' +
    '.send-btn, .stop-btn {\n' +
    '  padding: 6px 14px; border-radius: 6px; border: none;\n' +
    '  font-size: 13px; font-weight: 500; cursor: pointer;\n' +
    '  transition: opacity 0.15s;\n' +
    '}\n' +
    '.send-btn { background: var(--accent); color: var(--accent-fg); }\n' +
    '.stop-btn { background: var(--error-bg); color: var(--accent-fg); display: none; }\n' +
    '.send-btn:hover, .stop-btn:hover { opacity: 0.9; }\n' +
    '.send-btn:disabled, .stop-btn:disabled { opacity: 0.4; cursor: not-allowed; }\n' +
    '.empty-state {\n' +
    '  display: flex; flex-direction: column; align-items: center;\n' +
    '  justify-content: center; padding: 40px 20px; opacity: 0.5;\n' +
    '  text-align: center;\n' +
    '}\n' +
    '.empty-state-icon { font-size: 48px; margin-bottom: 12px; }\n' +
    '.empty-state-text { font-size: 13px; }\n' +
    '.error-message {\n' +
    '  background: var(--error-bg); border: 1px solid var(--error-border);\n' +
    '  border-radius: 6px; padding: 10px 12px; margin: 8px 12px;\n' +
    '  font-size: 12px; display: none;\n' +
    '}\n' +
    '.error-message.visible { display: block; }\n' +
    '::-webkit-scrollbar { width: 6px; height: 6px; }\n' +
    '::-webkit-scrollbar-track { background: transparent; }\n' +
    '::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }\n' +
    '::-webkit-scrollbar-thumb:hover { background: var(--fg); opacity: 0.3; }\n'
  );
}

function getBodyContent(title: string, placeholder: string): string {
  return (
    '<div class="ai-panel-header">\n' +
    '  <div class="ai-panel-title">\n' +
    '    <span class="ai-status-dot" id="aiStatusDot"></span>\n' +
    '    ' + escapeHtml(title) + '\n' +
    '  </div>\n' +
    '  <div class="ai-panel-actions">\n' +
    '    <button class="icon-btn" id="clearBtn" title="Clear conversation">🗑️</button>\n' +
    '    <button class="icon-btn" id="settingsBtn" title="AI Settings">⚙️</button>\n' +
    '  </div>\n' +
    '</div>\n' +
    '<div class="quick-actions" id="quickActions">\n' +
    '  <button class="quick-action-btn" data-action="continue" data-prompt="Continue writing from where I left off">▶ Continue</button>\n' +
    '  <button class="quick-action-btn" data-action="polish" data-prompt="Polish and improve the writing style">✨ Polish</button>\n' +
    '  <button class="quick-action-btn" data-action="expand" data-prompt="Expand this section with more details">📋 Expand</button>\n' +
    '  <button class="quick-action-btn" data-action="summarize" data-prompt="Summarize the key points">📝 Summarize</button>\n' +
    '  <button class="quick-action-btn" data-action="rewrite" data-prompt="Rewrite this in a different style">🔄 Rewrite</button>\n' +
    '</div>\n' +
    '<div class="error-message" id="errorMessage"></div>\n' +
    '<div class="chat-messages" id="chatMessages">\n' +
    '  <div class="empty-state" id="emptyState">\n' +
    '    <div class="empty-state-icon">🤖</div>\n' +
    '    <div class="empty-state-text">Start a conversation with AI<br>or use quick actions above</div>\n' +
    '  </div>\n' +
    '</div>\n' +
    '<div class="token-count" id="tokenCount"></div>\n' +
    '<div class="chat-input-area">\n' +
    '  <div class="chat-input-wrapper">\n' +
    '    <textarea class="chat-input" id="chatInput" placeholder="' + escapeHtml(placeholder) + '" rows="1"></textarea>\n' +
    '    <div class="input-actions">\n' +
    '      <button class="send-btn" id="sendBtn">Send</button>\n' +
    '      <button class="stop-btn" id="stopBtn">Stop</button>\n' +
    '    </div>\n' +
    '  </div>\n' +
    '</div>\n'
  );
}

function buildScriptContent(): string {
  // Return the JavaScript code as a string
  // Using hex escapes for backticks to avoid issues
  return (
    'const Markdown = {\n' +
    '  escape: (text) => text.replace(/[&<>"\'']/g, (m) => ({"&":"&amp;","<":"&lt;",">":"&gt;","\'":"&quot;","\'":"&#39;"}[m])),\n' +
    '  parse: (text) => {\n' +
    '    let html = Markdown.escape(text);\n' +
    '    html = html.replace(/' + String.fromCharCode(96) + String.fromCharCode(96) + String.fromCharCode(96) + '(\\w+)?\\n([\\s\\S]*?)' + String.fromCharCode(96) + String.fromCharCode(96) + String.fromCharCode(96) + '/g, (match, lang, code) => {\n' +
    '      const language = lang || \'text\';\n' +
    '      const escapedCode = code.replace(/&/g, \'&amp;\').replace(/</g, \'&lt;\').replace(/>/g, \'&gt;\');\n' +
    '      return \'<div class="code-block-wrapper"><div class="code-block-header"><span class="code-language">\' + language + \'</span><button class="code-copy-btn" data-code="\' + encodeURIComponent(code.trim()) + \'">Copy</button></div><pre><code class="language-\' + language + \'">\' + escapedCode + \'</code></pre></div>\';\n' +
    '    });\n' +
    '    html = html.replace(/' + String.fromCharCode(96) + '([^' + String.fromCharCode(96) + ']+)' + String.fromCharCode(96) + '/g, \'<code>$1</code>\');\n' +
    '    html = html.replace(/^#### (.+)$/gm, \'<h4>$1</h4>\');\n' +
    '    html = html.replace(/^### (.+)$/gm, \'<h3>$1</h3>\');\n' +
    '    html = html.replace(/^## (.+)$/gm, \'<h2>$1</h2>\');\n' +
    '    html = html.replace(/^# (.+)$/gm, \'<h1>$1</h1>\');\n' +
    '    html = html.replace(/\\*\\*\\*(.+?)\\*\\*\\*/g, \'<strong><em>$1</em></strong>\');\n' +
    '    html = html.replace(/\\*\\*(.+?)\\*\\*/g, \'<strong>$1</strong>\');\n' +
    '    html = html.replace(/\\*(.+?)\\*/g, \'<em>$1</em>\');\n' +
    '    html = html.replace(/__(.+?)__/g, \'<strong>$1</strong>\');\n' +
    '    html = html.replace(/_(.+?)_/g, \'<em>$1</em>\');\n' +
    '    html = html.replace(/\\[([^\\]]+)\\]\\(([^)]+)\\)/g, \'<a href="$2" target="_blank">$1</a>\');\n' +
    '    html = html.replace(/^&gt; (.+)$/gm, \'<blockquote>$1</blockquote>\');\n' +
    '    html = html.replace(/^\\* (.+)$/gm, \'<li>$1</li>\');\n' +
    '    html = html.replace(/^- (.+)$/gm, \'<li>$1</li>\');\n' +
    '    html = html.replace(/^\\d+\\. (.+)$/gm, \'<li>$1</li>\');\n' +
    '    html = html.replace(/(<li>.*<\\/li>\\n?)+/g, \'<ul>$&</ul>\');\n' +
    '    html = html.replace(/\\n/g, \'<br>\');\n' +
    '    return html;\n' +
    '  }\n' +
    '};\n' +
    'let messages = [];\n' +
    'let isStreaming = false;\n' +
    'let currentStreamMessageId = null;\n' +
    'let vscode = null;\n' +
    'try { vscode = acquireVsCode