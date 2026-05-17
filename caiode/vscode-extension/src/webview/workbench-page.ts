export function getWorkbenchHtml(nonce: string): string {
  return /* html */ `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>StoryTree - Workbench</title>
  <style>
    :root {
      --bg: var(--vscode-editor-background);
      --fg: var(--vscode-editor-foreground);
      --border: var(--vscode-panel-border);
      --accent: var(--vscode-button-background);
      --accent-fg: var(--vscode-button-foreground);
      --sidebar-bg: var(--vscode-sideBar-background);
      --input-bg: var(--vscode-input-background);
      --input-border: var(--vscode-input-border);
      --text-link: var(--vscode-textLink-foreground);
      --toolbar-bg: var(--vscode-toolbar-hoverBackground);
      --selection-bg: var(--vscode-editor-selectionBackground);
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--bg); color: var(--fg); height: 100vh; overflow: hidden;
      display: flex; flex-direction: column;
    }

    .workbench-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 6px 12px;
      border-bottom: 1px solid var(--border);
      background: var(--toolbar-bg);
      min-height: 38px;
    }
    .workbench-header-left { display: flex; align-items: center; gap: 10px; }
    .workbench-header-right { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--fg); opacity: 0.7; }
    .chapter-title-input {
      background: transparent; border: none; color: var(--fg);
      font-size: 15px; font-weight: 600; outline: none; width: 300px;
    }
    .chapter-title-input:focus { border-bottom: 1px solid var(--accent); }

    .toolbar-btn {
      background: transparent; border: 1px solid var(--border);
      color: var(--fg); cursor: pointer; padding: 3px 8px;
      border-radius: 3px; font-size: 13px; transition: all 0.15s;
    }
    .toolbar-btn:hover { background: var(--accent); color: var(--accent-fg); }
    .toolbar-btn.active { background: var(--accent); color: var(--accent-fg); }
    .toolbar-separator { width: 1px; height: 20px; background: var(--border); margin: 0 4px; }

    .workbench-body {
      display: flex; flex: 1; overflow: hidden;
    }

    .sidebar-left {
      width: 220px; min-width: 180px; max-width: 320px;
      border-right: 1px solid var(--border);
      background: var(--sidebar-bg);
      display: flex; flex-direction: column;
      overflow-y: auto;
    }
    .sidebar-section-title {
      padding: 10px 12px 6px; font-size: 11px; text-transform: uppercase;
      letter-spacing: 0.5px; opacity: 0.6; font-weight: 600;
    }
    .chapter-list { list-style: none; padding: 0 4px; }
    .chapter-item {
      padding: 7px 10px; cursor: pointer; border-radius: 4px;
      font-size: 13px; display: flex; justify-content: space-between;
      align-items: center; transition: background 0.1s;
    }
    .chapter-item:hover { background: var(--toolbar-bg); }
    .chapter-item.active { background: var(--accent); color: var(--accent-fg); }
    .chapter-item-num { font-size: 11px; opacity: 0.5; }
    .add-chapter-btn {
      margin: 8px 12px; padding: 6px; border: 1px dashed var(--border);
      border-radius: 4px; background: transparent; color: var(--fg);
      cursor: pointer; font-size: 12px; text-align: center; opacity: 0.6;
    }
    .add-chapter-btn:hover { opacity: 1; border-color: var(--accent); }

    .editor-area {
      flex: 1; display: flex; flex-direction: column;
      overflow: hidden;
    }
    .editor-container {
      flex: 1; overflow-y: auto; padding: 24px 32px;
    }
    .editor-content {
      outline: none; min-height: calc(100% - 40px);
      font-size: 15px; line-height: 1.8;
      caret-color: var(--accent);
    }
    .editor-content:empty::before {
      content: "Start writing your story...";
      color: var(--fg); opacity: 0.3; pointer-events: none;
    }
    .editor-footer {
      display: flex; justify-content: space-between; align-items: center;
      padding: 8px 32px; border-top: 1px solid var(--border);
      font-size: 12px; opacity: 0.6;
    }
    .save-indicator { display: flex; align-items: center; gap: 4px; }
    .save-dot { width: 6px; height: 6px; border-radius: 50%; background: #73d216; }
    .save-dot.saving { background: #f0c000; animation: pulse 1s infinite; }
    @keyframes pulse { 50% { opacity: 0.4; } }

    .sidebar-right {
      width: 300px; min-width: 240px; max-width: 400px;
      border-left: 1px solid var(--border);
      background: var(--sidebar-bg);
      display: flex; flex-direction: column;
    }
    .ai-panel-header {
      padding: 10px 14px; border-bottom: 1px solid var(--border);
      font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 6px;
    }
    .ai-status-dot { width: 7px; height: 7px; border-radius: 50%; background: #73d216; }
    .ai-status-dot.offline { background: #ef2929; }
    .chat-messages {
      flex: 1; overflow-y: auto; padding: 12px;
      display: flex; flex-direction: column; gap: 10px;
    }
    .chat-msg {
      padding: 10px 12px; border-radius: 8px; font-size: 13px; line-height: 1.5;
      max-width: 100%;
    }
    .chat-msg.user { background: var(--accent); color: var(--accent-fg); margin-left: 16px; }
    .chat-msg.assistant { background: var(--toolbar-bg); border: 1px solid var(--border); margin-right: 16px; }
    .chat-input-area {
      padding: 10px 12px; border-top: 1px solid var(--border);
      display: flex; gap: 6px;
    }
    .chat-input {
      flex: 1; padding: 8px 10px; border-radius: 6px;
      border: 1px solid var(--input-border); background: var(--input-bg);
      color: var(--fg); font-size: 13px; resize: none; outline: none;
      min-height: 36px; max-height: 100px; font-family: inherit;
    }
    .chat-input:focus { border-color: var(--accent); }
    .send-btn {
      padding: 8px 14px; border-radius: 6px; border: none;
      background: var(--accent); color: var(--accent-fg);
      cursor: pointer; font-size: 13px; font-weight: 500;
    }
    .send-btn:hover { opacity: 0.9; }
    .send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .quick-actions { display: flex; gap: 4px; padding: 6px 12px; flex-wrap: wrap; }
    .quick-action-btn {
      padding: 4px 8px; border-radius: 10px; border: 1px solid var(--border);
      background: transparent; color: var(--fg); font-size: 11px; cursor: pointer;
    }
    .quick-action-btn:hover { background: var(--toolbar-bg); }

    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
  </style>
</head>
<body>

<div class="workbench-header">
  <div class="workbench-header-left">
    <span style="font-size: 18px;">📝</span>
    <input class="chapter-title-input" id="chapterTitle" value="Untitled Chapter" placeholder="Chapter Title">
  </div>
  <div class="workbench-header-right">
    <span id="wordCountDisplay">0 words | 0 chars</span>
    <span id="saveStatus"><span class="save-dot"></span> Saved</span>
  </div>
</div>

<div class="workbench-body">
  <aside class="sidebar-left">
    <div class="sidebar-section-title">Chapters</div>
    <ul class="chapter-list" id="chapterList">
      <li class="chapter-item active" data-chapter-id="">
        <span>Untitled</span><span class="chapter-item-num">—</span>
      </li>
    </ul>
    <button class="add-chapter-btn" id="addChapterBtn">+ New Chapter</button>
  </aside>

  <main class="editor-area">
    <div style="display:flex;gap:4px;padding:6px 32px;border-bottom:1px solid var(--border);">
      <button class="toolbar-btn" data-cmd="bold" title="Bold (Ctrl+B)"><b>B</b></button>
      <button class="toolbar-btn" data-cmd="italic" title="Italic (Ctrl+I)"><i>I</i></button>
      <button class="toolbar-btn" data-cmd="underline" title="Underline (Ctrl+U)"><u>U</u></button>
      <span class="toolbar-separator"></span>
      <button class="toolbar-btn" data-cmd="h1" title="Heading 1">H1</button>
      <button class="toolbar-btn" data-cmd="h2" title="Heading 2">H2</button>
      <button class="toolbar-btn" data-cmd="h3" title="Heading 3">H3</button>
      <span class="toolbar-separator"></span>
      <button class="toolbar-btn" data-cmd="quote" title="Blockquote">❝</button>
      <button class="toolbar-btn" data-cmd="ul" title="Bullet List">• List</button>
      <button class="toolbar-btn" data-cmd="ol" title="Numbered List">1. List</button>
    </div>
    <div class="editor-container">
      <div class="editor-content" id="editorContent" contenteditable="true" spellcheck="true"></div>
    </div>
    <div class="editor-footer">
      <div class="save-indicator">
        <span class="save-dot" id="saveDot"></span>
        <span id="saveText">All changes saved</span>
      </div>
      <span>Last saved: —</span>
    </div>
  </main>

  <aside class="sidebar-right">
    <div class="ai-panel-header">
      <span class="ai-status-dot" id="aiStatusDot"></span>
      AI Assistant
    </div>
    <div class="quick-actions" id="quickActions">
      <button class="quick-action-btn" data-action="continue">▶ Continue</button>
      <button class="quick-action-btn" data-action="polish">✨ Polish</button>
      <button class="quick-action-btn" data-action="expand">📋 Expand</button>
      <button class="quick-action-btn" data-action="summarize">📝 Summarize</button>
    </div>
    <div class="chat-messages" id="chatMessages"></div>
    <div class="chat-input-area">
      <textarea class="chat-input" id="chatInput" placeholder="Ask AI about this chapter..." rows="1"></textarea>
      <button class="send-btn" id="chatSendBtn">Send</button>
    </div>
  </aside>
</div>

<script nonce="${nonce}">
const vscode = acquireVsCodeApi();

let currentProjectId = "";
let currentChapterId = "";
let saveTimeout = null;

function sendMessage(action, payload) {
  vscode.postMessage({ id: Date.now().toString(), action, payload });
}

function updateWordCount() {
  const el = document.getElementById("editorContent");
  const text = el.innerText || "";
  const words = text.trim() ? text.trim().split(/\\s+/).length : 0;
  const chars = text.length;
  document.getElementById("wordCountDisplay").textContent = words + " words | " + chars + " chars";
}

function triggerAutoSave() {
  const dot = document.getElementById("saveDot");
  const text = document.getElementById("saveText");
  dot.classList.add("saving");
  text.textContent = "Saving...";

  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    const content = document.getElementById("editorContent").innerHTML;
    const plainText = document.getElementById("editorContent").innerText;
    sendMessage("chapter.updateContent", {
      projectId: currentProjectId,
      chapterId: currentChapterId,
      content: content,
      plainText: plainText,
      wordCount: plainText.trim() ? plainText.trim().split(/\\s+/).length : 0,
    });
    dot.classList.remove("saving");
    text.textContent = "All changes saved";
  }, 500);
}

document.getElementById("editorContent").addEventListener("input", () => {
  updateWordCount();
  triggerAutoSave();
});

document.querySelectorAll(".toolbar-btn[data-cmd]").forEach(btn => {
  btn.addEventListener("click", () => {
    const cmd = btn.dataset.cmd;
    document.execCommand(cmd === "h1" ? "formatBlock" :
                       cmd === "h2" ? "formatBlock" :
                       cmd === "h3" ? "formatBlock' :
                       cmd === "quote" ? "formatBlock" :
                       cmd === "ul" ? "insertUnorderedList" :
                       cmd === "ol" ? "insertOrderedList" : cmd,
                      false,
                      cmd === "h1" ? "<h1>" :
                       cmd === "h2" ? "<h2>" :
                       cmd === "h3" ? "<h3>" :
                       cmd === "quote" ? "<blockquote>" : null);
    document.getElementById("editorContent").focus();
  });
});

document.getElementById("addChapterBtn")?.addEventListener("click", () => {
  sendMessage("project.createChapter", { projectId: currentProjectId });
});

document.querySelectorAll(".chapter-item").forEach(item => {
  item.addEventListener("click", () => {
    document.querySelectorAll(".chapter-item").forEach(i => i.classList.remove("active"));
    item.classList.add("active");
    currentChapterId = item.dataset.chapterId || "";
    document.getElementById("chapterTitle").value = item.querySelector("span:first-child")?.textContent || "";
    sendMessage("chapter.select", { chapterId: currentChapterId });
  });
});

document.getElementById("chapterTitle")?.addEventListener("change", (e) => {
  sendMessage("chapter.rename", { chapterId: currentChapterId, title: e.target.value });
});

const chatInput = document.getElementById("chatInput");
const chatSendBtn = document.getElementById("chatSendBtn");

function sendChatMessage() {
  const text = chatInput.value.trim();
  if (!text) return;
  appendChatMessage("user", text);
  chatInput.value = "";
  chatSendBtn.disabled = true;
  sendMessage("ai.chat", { message: text, context: document.getElementById("editorContent").innerText });
}

function appendChatMessage(role, content) {
  const container = document.getElementById("chatMessages");
  const div = document.createElement("div");
  div.className = "chat-msg " + role;
  div.innerHTML = content.replace(/\\n/g, "<br>");
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

chatSendBtn?.addEventListener("click", sendChatMessage);
chatInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChatMessage(); }
});

document.querySelectorAll(".quick-action-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const action = btn.dataset.action;
    const text = document.getElementById("editorContent").innerText;
    sendMessage("ai.quickAction", { action, selectedText: text, fullContext: text });
  });
});

window.addEventListener("message", (event) => {
  const msg = event.data;
  if (!msg) return;

  switch (msg.type) {
    case "data-push":
      if (msg.payload?.type === "chapters") {
        renderChapterList(msg.payload.data || []);
      } else if (msg.payload?.type === "chapter_content") {
        document.getElementById("editorContent").innerHTML = msg.payload.content || "";
        updateWordCount();
      } else if (msg.payload?.type === "ai_response") {
        appendChatMessage("assistant", msg.payload.content || "");
        chatSendBtn.disabled = false;
      } else if (msg.payload?.type === "ai_stream_chunk") {
        const lastMsg = document.querySelector("#chatMessages .chat-msg.assistant:last-child");
        if (lastMsg && lastMsg.dataset.streaming === "true") {
          lastMsg.innerHTML += msg.payload.content || "";
          document.getElementById("chatMessages").scrollTop = document.getElementById("chatMessages").scrollHeight;
        } else {
          const div = document.createElement("div");
          div.className = "chat-msg assistant";
          div.dataset.streaming = "true";
          div.innerHTML = msg.payload.content || "";
          document.getElementById("chatMessages").appendChild(div);
        }
      } else if (msg.payload?.type === "ai_stream_done") {
        const lastMsg = document.querySelector("#chatMessages .chat-msg.assistant:last-child");
        if (lastMsg) delete lastMsg.dataset.streaming;
        chatSendBtn.disabled = false;
      }
      break;
  }
});

function renderChapterList(chapters) {
  const list = document.getElementById("chapterList");
  list.innerHTML = chapters.map((ch, i) =>
    '<li class="chapter-item' data-chapter-id="' + (ch.id || "") + '">' +
    '<span>' + (ch.title || "Chapter " + (i + 1)) + '</span>' +
    '<span class="chapter-item-num">' + (ch.wordCount || 0) + 'w</span></li>'
  ).join("");

  list.querySelectorAll(".chapter-item").forEach(item => {
    item.addEventListener("click", () => {
      list.querySelectorAll(".chapter-item").forEach(i => i.classList.remove("active"));
      item.classList.add("active");
      currentChapterId = item.dataset.chapterId || "";
      sendMessage("chapter.select", { chapterId: currentChapterId });
    });
  });
}

sendMessage("system.ready", {});
updateWordCount();
</script>
</body>
</html>`;
}
