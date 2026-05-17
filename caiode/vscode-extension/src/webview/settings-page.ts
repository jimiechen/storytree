export function getSettingsHtml(nonce: string): string {
  return /* html */ `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>StoryTree - Settings</title>
  <style>
    :root {
      --bg: var(--vscode-editor-background);
      --fg: var(--vscode-editor-foreground);
      --border: var(--vscode-panel-border);
      --accent: var(--vscode-button-background);
      --accent-fg: var(--vscode-button-foreground);
      --input-bg: var(--vscode-input-background);
      --input-border: var(--vscode-input-border);
      --text-link: var(--vscode-textLink-foreground);
      --error-fg: var(--vscode-errorForeground);
      --success-fg: #73d216;
      --section-bg: var(--vscode-toolbar-hoverBackground);
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--bg); color: var(--fg); line-height: 1.5; padding: 24px;
    }
    h1 { font-size: 22px; margin-bottom: 20px; display: flex; align-items: center; gap: 8px; }

    .settings-section {
      border: 1px solid var(--border); border-radius: 6px;
      padding: 16px 20px; margin-bottom: 16px;
    }
    .settings-section-title {
      font-size: 14px; font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.5px; opacity: 0.7; margin-bottom: 14px;
      padding-bottom: 8px; border-bottom: 1px solid var(--border);
    }

    .form-row { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
    .form-row:last-child { margin-bottom: 0; }
    .form-label { min-width: 140px; font-size: 13px; color: var(--fg); opacity: 0.85; }
    .form-input, .form-select, .form-textarea {
      flex: 1; padding: 7px 10px; border-radius: 4px;
      border: 1px solid var(--input-border); background: var(--input-bg);
      color: var(--fg); font-size: 13px; outline: none; font-family: inherit;
    }
    .form-input:focus, .form-select:focus, .form-textarea:focus { border-color: var(--accent); }
    .form-select { cursor: pointer; min-width: 180px; max-width: 280px; }
    .form-textarea { resize: vertical; min-height: 80px; width: 100%; }
    .form-hint { font-size: 11px; opacity: 0.5; margin-top: 3px; }

    .btn-primary {
      padding: 7px 18px; border-radius: 4px; border: none;
      background: var(--accent); color: var(--accent-fg);
      cursor: pointer; font-size: 13px; font-weight: 500;
    }
    .btn-primary:hover { opacity: 0.9; }
    .btn-secondary {
      padding: 7px 16px; border-radius: 4px; border: 1px solid var(--border);
      background: transparent; color: var(--fg); cursor: pointer; font-size: 13px;
    }
    .btn-secondary:hover { background: var(--section-bg); }

    .status-badge {
      display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px;
      border-radius: 10px; font-size: 11px; font-weight: 500;
    }
    .status-badge.connected { background: rgba(115,210,22,0.15); color: var(--success-fg); }
    .status-badge.disconnected { background: rgba(239,41,41,0.15); color: var(--error-fg); }
    .status-dot { width: 6px; height: 6px; border-radius: 50%; }
    .status-dot.on { background: var(--success-fg); }
    .status-dot.off { background: var(--error-fg); }

    .danger-zone { border-color: var(--error-fg); opacity: 0.9; }
    .danger-zone .settings-section-title { color: var(--error-fg); border-color: var(--error-fg); }
    .btn-danger { background: var(--error-fg); color: white; border: none; }
    .btn-danger:hover { opacity: 0.85; }

    .toast {
      position: fixed; bottom: 20px; right: 20px; padding: 10px 16px;
      border-radius: 6px; font-size: 13px; z-index: 999;
      animation: slideIn 0.2s ease-out;
    }
    .toast.success { background: rgba(115,210,22,0.15); color: var(--success-fg); border: 1px solid var(--success-fg); }
    .toast.error { background: rgba(239,41,41,0.15); color: var(--error-fg); border: 1px solid var(--error-fg); }
    @keyframes slideIn { from { transform: translateX(40px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

    .grid-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  </style>
</head>
<body>

<h1>⚙️ Settings</h1>

<div class="settings-section" id="aiSection">
  <div class="settings-section-title">AI Provider Configuration</div>
  <div class="form-row">
    <label class="form-label">Provider</label>
    <select class="form-select" id="providerSelect">
      <option value="">-- Select Provider --</option>
      <option value="openai">OpenAI (GPT-4o / GPT-4o-mini)</option>
      <option value="anthropic">Anthropic (Claude Sonnet / Haiku)</option>
      <option value="ollama">Ollama (Local LLM)</option>
      <option value="custom">Custom OpenAI-Compatible</option>
    </select>
  </div>
  <div class="form-row" id="apiKeyRow" style="display:none;">
    <label class="form-label">API Key</label>
    <input type="password" class="form-input" id="apiKeyInput" placeholder="sk-... or sk-ant-...">
    <button class="btn-secondary" id="testApiKeyBtn" type="button">Test Connection</button>
  </div>
  <div class="form-row" id="baseUrlRow" style="display:none;">
    <label class="form-label">Base URL</label>
    <input type="text" class="form-input" id="baseUrlInput" placeholder="https://api.openai.com/v1 or http://localhost:11434">
  </div>
  <div class="form-row" id="modelRow" style="display:none;">
    <label class="form-label">Default Model</label>
    <select class="form-select" id="modelSelect"></select>
  </div>
  <div class="form-row" id="connectionStatusRow" style="display:none;">
    <label class="form-label">Connection Status</label>
    <span class="status-badge disconnected" id="connectionStatus">
      <span class="status-dot off" id="statusDot"></span>
      <span id="statusText">Not configured</span>
    </span>
  </div>
</div>

<div class="settings-section" id="editorSection">
  <div class="settings-section-title">Editor Preferences</div>
  <div class="form-row">
    <label class="form-label">Theme</label>
    <select class="form-select" id="themeSelect">
      <option value="system">System (Follow VS Code)</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  </div>
  <div class="form-row">
    <label class="form-label">Language</label>
    <select class="form-select" id="languageSelect">
      <option value="zh-CN">简体中文</option>
      <option value="en-US">English</option>
    </select>
  </div>
  <div class="form-row">
    <label class="form-label">Auto-save Interval</label>
    <select class="form-select" id="autoSaveSelect">
      <option value="300">5 seconds</option>
      <option value="500" selected>500ms (default)</option>
      <option value="1000">1 second</option>
      <option value="3000">3 seconds</option>
      <option value="0">Off (manual only)</option>
    </select>
  </div>
  <div class="form-row">
    <label class="form-label">Default Word Target</label>
    <input type="number" class="form-input" id="wordTargetInput" style="max-width:120px;" placeholder="2000" min="0">
    <span class="form-hint">words per chapter</span>
  </div>
</div>

<div class="settings-section" id="dataSection">
  <div class="settings-section-title">Data Management</div>
  <div class="grid-2col">
    <button class="btn-secondary" id="exportDataBtn">📤 Export All Data</button>
    <button class="btn-secondary" id="importDataBtn">📥 Import Data</button>
  </div>
  <p class="form-hint" style="margin-top:8px;">Export creates a JSON backup of all projects, chapters, and settings.</p>
</div>

<div class="settings-section danger-zone" id="dangerZone">
  <div class="settings-section-title">⚠️ Danger Zone</div>
  <div class="form-row">
    <label class="form-label">Reset All Settings</label>
    <button class="btn-danger" id="resetSettingsBtn" type="button">Reset to Defaults</button>
  </div>
  <div class="form-row">
    <label class="form-label">Clear All Data</label>
    <button class="btn-danger" id="clearAllDataBtn" type="button">Delete All Projects & Data</button>
  </div>
</div>

<div style="margin-top:20px;display:flex;gap:10px;">
  <button class="btn-primary" id="saveSettingsBtn">💾 Save Settings</button>
</div>

<script nonce="${nonce}">
const vscode = acquireVsCodeApi();

function sendMessage(action, payload) {
  vscode.postMessage({ id: Date.now().toString(), action, payload });
}

function showToast(message, type) {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();
  const el = document.createElement("div");
  el.className = "toast " + (type || "success");
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

function updateConnectionStatus(connected, text) {
  const badge = document.getElementById("connectionStatus");
  const dot = document.getElementById("statusDot");
  const txt = document.getElementById("statusText");
  badge.className = "status-badge " + (connected ? "connected" : "disconnected");
  dot.className = "status-dot " + (connected ? "on" : "off");
  txt.textContent = text || (connected ? "Connected" : "Disconnected");
}

const providerModels = {
  openai: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
  anthropic: ["claude-sonnet-4-20250514", "claude-haiku-4-20250514", "claude-opus-4-20250514"],
  ollama: ["qwen2.5:7b", "llama3.1:8b", "mistral:7b"],
  custom: ["custom-model"],
};

document.getElementById("providerSelect").addEventListener("change", function() {
  const val = this.value;
  const showApi = val === "openai" || val === "anthropic" || val === "custom";
  const showBase = val === "ollama" || val === "custom";

  document.getElementById("apiKeyRow").style.display = showApi ? "flex" : "none";
  document.getElementById("baseUrlRow").style.display = showBase ? "flex" : "none";
  document.getElementById("modelRow").style.display = val ? "flex" : "none";
  document.getElementById("connectionStatusRow").style.display = val ? "flex" : "none";

  const modelSel = document.getElementById("modelSelect");
  modelSel.innerHTML = (providerModels[val] || []).map(m =>
    '<option value="' + m + '">' + m + '</option>'
  ).join("");

  updateConnectionStatus(false, val ? "Not tested" : "Not configured");
});

document.getElementById("testApiKeyBtn").addEventListener("click", () => {
  const provider = document.getElementById("providerSelect").value;
  const apiKey = document.getElementById("apiKeyInput").value;
  const baseUrl = document.getElementById("baseUrlInput").value;
  btn.disabled = true;
  btn.textContent = "Testing...";
  sendMessage("settings.testAiConnection", { provider, apiKey, baseUrl });
});

document.getElementById("saveSettingsBtn").addEventListener("click", () => {
  const settings = {
    ai: {
      provider: document.getElementById("providerSelect").value,
      apiKey: document.getElementById("apiKeyInput").value,
      baseUrl: document.getElementById("baseUrlInput").value,
      model: document.getElementById("modelSelect").value,
    },
    editor: {
      theme: document.getElementById("themeSelect").value,
      language: document.getElementById("languageSelect).value,
      autoSaveMs: parseInt(document.getElementById("autoSaveSelect").value) || 500,
      wordTarget: parseInt(document.getElementById("wordTargetInput").value) || 2000,
    },
  };
  sendMessage("settings.update", settings);
  showToast("Settings saved successfully!");
});

document.getElementById("resetSettingsBtn").addEventListener("click", () => {
  if (confirm("Reset all settings to defaults? This cannot be undone.")) {
    sendMessage("settings.reset", {});
    showToast("Settings reset to defaults");
  }
});

document.getElementById("clearAllDataBtn").addEventListener("click", () => {
  if (confirm("WARNING: This will permanently delete ALL project data. Are you absolutely sure?")) {
    if (confirm("This is your last chance to cancel. Type YES to confirm.")) {
      sendMessage("data.clearAll", {});
      showToast("All data cleared", "error");
    }
  }
});

document.getElementById("exportDataBtn").addEventListener("click", () => {
  sendMessage("data.export", {});
});

document.getElementById("importDataBtn").addEventListener("click", () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { sendMessage("data.import", { data: reader.result }); };
    reader.readAsText(file);
  });
  input.click();
});

window.addEventListener("message", (event) => {
  const msg = event.data;
  if (!msg) return;

  switch (msg.type) {
    case "data-push":
      if (msg.payload?.type === "settings_loaded") {
        const s = msg.payload.data || {};
        if (s.ai?.provider) document.getElementById("providerSelect").value = s.ai.provider;
        if (s.ai?.apiKey) document.getElementById("apiKeyInput").value = s.ai.apiKey;
        if (s.ai?.baseUrl) document.getElementById("baseUrlInput").value = s.ai.baseUrl;
        if (s.ai?.model) document.getElementById("modelSelect").value = s.ai.model;
        if (s.editor?.theme) document.getElementById("themeSelect").value = s.editor.theme;
        if (s.editor?.language) document.getElementById("languageSelect").value = s.editor.language;
        if (s.editor?.autoSaveMs) document.getElementById("autoSaveSelect").value = String(s.editor.autoSaveMs);
        if (s.editor?.wordTarget) document.getElementById("wordTargetInput").value = String(s.editor.wordTarget);

        if (s.ai?.provider) document.getElementById("providerSelect").dispatchEvent(new Event("change"));
      } else if (msg.payload?.type === "ai_connection_result") {
        const ok = msg.payload.success;
        updateConnectionStatus(ok, ok ? "Connection successful" : msg.payload.error || "Connection failed");
        const btn = document.getElementById("testApiKeyBtn");
        btn.disabled = false;
        btn.textContent = "Test Connection";
      } else if (msg.payload?.type === "export_done") {
        showToast("Data exported successfully!");
      } else if (msg.payload?.type === "import_done") {
        showToast("Data imported! Reloading settings...");
        setTimeout(() => location.reload(), 1500);
      }
      break;
  }
});

sendMessage("settings.load", {});
</script>
</body>
</html>`;
}
