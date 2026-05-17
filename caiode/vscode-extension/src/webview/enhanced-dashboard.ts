export function getEnhancedDashboardHtml(nonce: string): string {
  return /* html */ `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>StoryTree IDE - Dashboard</title>
  <style>
    :root {
      --bg: var(--vscode-editor-background);
      --fg: var(--vscode-editor-foreground);
      --border: var(--vscode-panel-border);
      --accent: var(--vscode-button-background);
      --accent-fg: var(--vscode-button-foreground);
      --badge-bg: var(--vscode-badge-background);
      --badge-fg: var(--vscode-badge-foreground);
      --error-fg: var(--vscode-errorForeground);
      --input-bg: var(--vscode-input-background);
      --input-border: var(--vscode-input-border);
      --text-link: var(--vscode-textLink-foreground);
      --sidebar-bg: var(--vscode-sideBar-background);
      --toolbar-bg: var(--vscode-toolbar-hoverBackground);
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--bg); color: var(--fg); line-height: 1.5; padding: 20px;
    }

    .dashboard-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 20px; flex-wrap: wrap; gap: 12px;
    }
    .header-left h1 { font-size: 22px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
    .header-right { display: flex; align-items: center; gap: 10px; }

    .search-bar {
      position: relative; width: 260px;
    }
    .search-input {
      width: 100%; padding: 7px 30px 7px 10px; border-radius: 6px;
      border: 1px solid var(--input-border); background: var(--input-bg);
      color: var(--fg); font-size: 13px; outline: none;
    }
    .search-input:focus { border-color: var(--accent); }
    .search-icon {
      position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
      opacity: 0.5; pointer-events: none; font-size: 13px;
    }

    .toolbar-actions {
      display: flex; gap: 8px; align-items: center;
    }
    .btn {
      padding: 7px 14px; border-radius: 5px; border: 1px solid var(--border);
      background: transparent; color: var(--fg); cursor: pointer;
      font-size: 13px; transition: all 0.15s; white-space: nowrap;
    }
    .btn:hover { background: var(--toolbar-bg); }
    .btn-primary { background: var(--accent); color: var(--accent-fg); border-color: var(--accent); }
    .btn-primary:hover { opacity: 0.9; }
    .btn-sm { padding: 4px 10px; font-size: 12px; }

    .sort-dropdown {
      padding: 5px 24px 5px 8px; border-radius: 5px;
      border: 1px solid var(--input-border); background: var(--input-bg);
      color: var(--fg); font-size: 12px; cursor: pointer;
      appearance: none; -webkit-appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23888' fill='none'/%3E%3C/svg%3E");
      background-repeat: no-repeat; background-position: right 8px center;
    }

    .stats-row {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;
      margin-bottom: 20px;
    }
    .stat-card {
      background: var(--section-bg, var(--toolbar-bg)); border: 1px solid var(--border);
      border-radius: 8px; padding: 14px 16px;
    }
    .stat-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.55; margin-bottom: 4px; }
    .stat-value { font-size: 22px; font-weight: 700; }
    .stat-sub { font-size: 11px; opacity: 0.5; margin-top: 2px; }

    .projects-section-title {
      font-size: 15px; font-weight: 600; margin-bottom: 12px;
      display: flex; justify-content: space-between; align-items: center;
    }
    .project-count { font-size: 12px; font-weight: 400; opacity: 0.6; }

    .projects-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 14px;
    }

    .project-card {
      background: var(--bg); border: 1px solid var(--border); border-radius: 8px;
      padding: 16px; cursor: pointer; transition: all 0.15s; position: relative;
    }
    .project-card:hover { border-color: var(--accent); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    .project-card-header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px; }
    .project-name { font-size: 15px; font-weight: 600; }
    .project-type-badge {
      font-size: 10px; padding: 2px 7px; border-radius: 10px;
      background: var(--badge-bg); color: var(--badge-fg); text-transform: uppercase; letter-spacing: 0.3px;
    }
    .project-desc { font-size: 12px; opacity: 0.65; margin-bottom: 10px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .project-meta { display: flex; gap: 14px; font-size: 11px; opacity: 0.5; }
    .project-meta-item { display: flex; align-items: center; gap: 3px; }
    .project-status-dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; }
    .status-active { background: #73d216; }
    .status-draft { background: #f0c000; }
    .status-archived { background: var(--fg); opacity: 0.3; }

    .empty-state {
      text-align: center; padding: 60px 20px; opacity: 0.45;
    }
    .empty-state-icon { font-size: 48px; margin-bottom: 12px; }
    .empty-state-text { font-size: 15px; margin-bottom: 8px; }
    .empty-state-hint { font-size: 12px; }

    /* Context Menu */
    .context-menu {
      position: fixed; z-index: 1000; min-width: 160px;
      background: var(--bg); border: 1px solid var(--border);
      border-radius: 6px; box-shadow: 0 6px 24px rgba(0,0,0,0.2);
      padding: 4px 0; display: none;
    }
    .context-menu.visible { display: block; }
    .context-menu-item {
      padding: 7px 14px; font-size: 13px; cursor: pointer; display: flex;
      align-items: center; gap: 8px; transition: background 0.1s;
    }
    .context-menu-item:hover { background: var(--toolbar-bg); }
    .context-menu-separator { height: 1px; background: var(--border); margin: 3px 0; }
    .context-danger { color: var(--error-fg); }

    /* New Project Modal */
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.4);
      z-index: 900; display: none; align-items: center; justify-content: center;
    }
    .modal-overlay.visible { display: flex; }
    .modal {
      background: var(--bg); border: 1px solid var(--border);
      border-radius: 10px; padding: 24px; width: 420px; max-width: 90vw;
      box-shadow: 0 16px 48px rgba(0,0,0,0.25);
    }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; }
    .modal-title { font-size: 17px; font-weight: 600; }
    .modal-close { background: none; border: none; color: var(--fg); font-size: 18px; cursor: pointer; opacity: 0.5; padding: 4px; }
    .modal-close:hover { opacity: 1; }
    .form-group { margin-bottom: 14px; }
    .form-label { display: block; font-size: 13px; font-weight: 500; margin-bottom: 5px; }
    .form-input {
      width: 100%; padding: 9px 10px; border-radius: 5px;
      border: 1px solid var(--input-border); background: var(--input-bg);
      color: var(--fg); font-size: 13px; outline: none;
    }
    .form-input:focus { border-color: var(--accent); }
    .form-textarea { resize: vertical; min-height: 70px; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; }
  </style>
</head>
<body>

<div class="dashboard-header">
  <div class="header-left">
    <h1>📚 StoryTree IDE</h1>
  </div>
  <div class="header-right">
    <div class="search-bar">
      <input class="search-input" id="searchInput" type="text" placeholder="Search projects...">
      <span class="search-icon">🔍</span>
    </div>
    <select class="sort-dropdown" id="sortSelect">
      <option value="updated">Last Edited ↓</option>
      <option value="created">Created ↓</option>
      <option value="name">Name A-Z</option>
      <option value="chapters">Chapters ↓</option>
    </select>
    <div class="toolbar-actions">
      <button class="btn btn-primary" id="newProjectBtn">+ New Project</button>
      <button class="btn btn-sm" id="refreshBtn">↻ Refresh</button>
      <button class="btn btn-sm" id="settingsBtn">⚙️ Settings</button>
    </div>
  </div>
</div>

<div class="stats-row" id="statsRow">
  <div class="stat-card">
    <div class="stat-label">Total Projects</div>
    <div class="stat-value" id="statProjects">—</div>
    <div class="stat-sub" id="statProjectsSub"></div>
  </div>
  <div class="stat-card">
    <div class="stat-label">Total Chapters</div>
    <div class="stat-value" id="statChapters">—</div>
    <div class="stat-sub" id="statChaptersSub"></div>
  </div>
  <div class="stat-card">
    <div class="stat-label">Total Words</div>
    <div class="stat-value" id="statWords">—</div>
    <div class="stat-sub" id="statWordsSub"></div>
  </div>
  <div class="stat-card">
    <div class="stat-label">Active Sessions</div>
    <div class="stat-value" id="statActive">—</div>
    <div class="stat-sub">Currently editing</div>
  </div>
</div>

<div class="projects-section-title">
  <span>Projects</span>
  <span class="project-count" id="projectCount">0 projects</span>
</div>

<div class="projects-grid" id="projectsGrid">
  <div class="empty-state" id="emptyState">
    <div class="empty-state-icon">📖</div>
    <div class="empty-state-text">No projects yet</div>
    <div class="empty-state-hint">Create your first novel project to get started!</div>
  </div>
</div>

<!-- Context Menu -->
<div class="context-menu" id="contextMenu">
  <div class="context-menu-item" data-action="open">📂 Open in Workbench</div>
  <div class="context-menu-item" data-action="rename">✏️ Rename</div>
  <div class="context-menu-item" data-action="duplicate">📋 Duplicate</div>
  <div class="context-menu-separator"></div>
  <div class="context-menu-item" data-action="archive">📦 Archive</div>
  <div class="context-menu-item context-danger" data-action="delete">🗑️ Delete Project</div>
</div>

<!-- New Project Modal -->
<div class="modal-overlay" id="newProjectModal">
  <div class="modal" role="dialog">
    <div class="modal-header">
      <span class="modal-title">New Project</span>
      <button class="modal-close" id="closeModalBtn">&times;</button>
    </div>
    <div class="form-group">
      <label class="form-label" for="projNameInput">Project Name *</label>
      <input class="form-input" id="projNameInput" type="text" placeholder="e.g., Star Voyage" required>
    </div>
    <div class="form-group">
      <label class="form-label" for="projTypeSelect">Genre / Type</label>
      <select class="form-input" id="projTypeSelect">
        <option value="">-- Select Genre --</option>
        <option value="sci-fi">Science Fiction</option>
        <option value="fantasy">Fantasy</option>
        <option value="romance">Romance</option>
        <option value="mystery">Mystery / Thriller</option>
        <option value="literary">Literary Fiction</option>
        <option value="historical">Historical Fiction</option>
        <option value="other">Other</option>
      </select>
    </div>
    <div class="form-group">
      <label class="form-label" for="projDescInput">Description (optional)</label>
      <textarea class="form-input form-textarea" id="projDescInput" placeholder="Brief description of your story..."></textarea>
    </div>
    <div class="modal-actions">
      <button class="btn" id="cancelModalBtn">Cancel</button>
      <button class="btn btn-primary" id="createProjectBtn">Create Project</button>
    </div>
  </div>
</div>

<script nonce="${nonce}">
const vscode = acquireVsCodeApi();
let allProjects = [];
let contextTargetId = "";

function sendMessage(action, payload) {
  vscode.postMessage({ id: Date.now().toString(), action, payload });
}

function renderProjects(projects) {
  allProjects = projects || [];
  const grid = document.getElementById("projectsGrid");
  const emptyState = document.getElementById("emptyState");

  if (!allProjects.length) {
    grid.innerHTML = "";
    grid.appendChild(emptyState.cloneNode(true));
    document.getElementById("projectCount").textContent = "0 projects";
    return;
  }

  document.getElementById("projectCount").textContent = allProjects.length + " project" + (allProjects.length !== 1 ? "s" : "");

  const searchTerm = (document.getElementById("searchInput").value || "").toLowerCase();
  const sortBy = document.getElementById("sortSelect").value;

  let filtered = allProjects.filter(p =>
    (p.name || "").toLowerCase().includes(searchTerm) ||
    (p.description || "").toLowerCase().includes(searchTerm) ||
    (p.type || "").toLowerCase().includes(searchTerm)
  );

  filtered.sort((a, b) => {
    switch (sortBy) {
      case "name": return (a.name || "").localeCompare(b.name || "");
      case "created": return (b.createdAt || 0) - (a.createdAt || 0);
      case "chapters": return (b.chapterCount || 0) - (a.chapterCount || 0);
      default: return (b.updatedAt || 0) - (a.updatedAt || 0);
    }
  });

  grid.innerHTML = filtered.map(p => {
    const statusClass = p.status === "active" ? "status-active" : p.status === "archived" ? "status-archived" : "status-draft";
    const statusLabel = p.status === "active" ? "Active" : p.status === "archived" ? "Archived" : "Draft";
    return '<div class="project-card" data-id="' + (p.id || "") + '" data-context>' +
      '<div class="project-card-header">' +
      '<span class="project-name">' + escapeHtml(p.name || "Untitled") + '</span>' +
      '<span class="project-type-badge">' + escapeHtml(p.type || "Novel") + '</span></div>' +
      '<div class="project-desc">' + escapeHtml(p.description || "No description") + '</div>' +
      '<div class="project-meta">' +
      '<span class="project-meta-item"><span class="project-status-dot ' + statusClass + '"></span> ' + statusLabel + '</span>' +
      '<span class="project-meta-item">📄 ' + (p.chapterCount || 0) + ' chapters</span>' +
      '<span class="project-meta-item">📝 ' + formatWordCount(p.wordCount || 0) + '</span>' +
      '<span class="project-meta-item">🕐 ' + formatDate(p.updatedAt || p.createdAt || Date.now()) + '</span>' +
      "</div></div>";
  }).join("");

  grid.querySelectorAll(".project-card[data-context]").forEach(card => {
    card.addEventListener("click", (e) => {
      if (e.button !== 2) sendMessage("project.open", { projectId: card.dataset.id });
    });
    card.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      showContextMenu(e.clientX, e.clientY, card.dataset.id);
    });
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function formatDate(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return diffMin + "m ago";
  if (diffHr < 24) return diffHr + "h ago";
  if (diffDay < 7) return diffDay + "d ago";
  return d.toLocaleDateString();
}

function formatWordCount(wc) {
  if (!wc) return "0 words";
  if (wc >= 1000000) return (wc / 1000000).toFixed(1) + "M";
  if (wc >= 1000) return (wc / 1000).toFixed(1) + "K";
  return wc + " words";
}

function showContextMenu(x, y, targetId) {
  contextTargetId = targetId;
  const menu = document.getElementById("contextMenu");
  menu.style.left = x + "px";
  menu.style.top = y + "px";
  menu.classList.add("visible");
}

function hideContextMenu() {
  document.getElementById("contextMenu").classList.remove("visible");
  contextTargetId = "";
}

document.getElementById("contextMenu").addEventListener("click", (e) => {
  const item = e.target.closest(".context-menu-item");
  if (!item) return;
  const action = item.dataset.action;
  hideContextMenu();

  switch (action) {
    case "open": sendMessage("project.open", { projectId: contextTargetId }); break;
    case "rename":
      const name = prompt("Enter new project name:", "");
      if (name) sendMessage("project.rename", { projectId: contextTargetId, title: name });
      break;
    case "duplicate": sendMessage("project.duplicate", { projectId: contextTargetId }); break;
    case "archive": sendMessage("project.archive", { projectId: contextTargetId }); break;
    case "delete":
      if (confirm("Delete this project? This action cannot be undone.")) {
        sendMessage("project.delete", { projectId: contextTargetId });
      }
      break;
  }
});

document.addEventListener("click", () => hideContextMenu());

document.getElementById("searchInput").addEventListener("input", () => renderProjects(allProjects));
document.getElementById("sortSelect").addEventListener("change", () => renderProjects(allProjects));

document.getElementById("newProjectBtn").addEventListener("click", () => {
  document.getElementById("newProjectModal").classList.add("visible");
  document.getElementById("projNameInput").focus();
});

document.getElementById("closeModalBtn").addEventListener("click", () => {
  document.getElementById("newProjectModal").classList.remove("visible");
});
document.getElementById("cancelModalBtn").addEventListener("click", () => {
  document.getElementById("newProjectModal").classList.remove("visible");
});

document.getElementById("createProjectBtn").addEventListener("click", () => {
  const name = document.getElementById("projNameInput").value.trim();
  const type = document.getElementById("projTypeSelect").value;
  const desc = document.getElementById("projDescInput").value.trim();
  if (!name) { document.getElementById("projNameInput").focus(); return; }
  sendMessage("project.create", { name, type, description: desc });
  document.getElementById("newProjectModal").classList.remove("visible");
  document.getElementById("projNameInput").value = "";
  document.getElementById("projTypeSelect").value = "";
  document.getElementById("projDescInput").value = "";
});

document.getElementById("settingsBtn").addEventListener("click", () => {
  sendMessage("navigation.navigate", { page: "settings" });
});
document.getElementById("refreshBtn").addEventListener("click", () => {
  sendMessage("dashboard.refresh", {});
});

window.addEventListener("message", (event) => {
  const msg = event.data;
  if (!msg) return;

  switch (msg.type) {
    case "data-push":
      if (msg.payload?.type === "projects_list") {
        renderProjects(msg.payload.data || []);
        updateStats(msg.payload.data || []);
      } else if (msg.payload?.type === "stats") {
        updateStatsFromPayload(msg.payload.data || {});
      } else if (msg.payload?.type === "project_created") {
        sendMessage("dashboard.refresh", {});
      } else if (msg.payload?.type === "project_deleted") {
        renderProjects(allProjects.filter(p => p.id !== msg.payload.projectId));
      }
      break;
  }
});

function updateStats(projects) {
  const totalProj = projects.length;
  const totalChapters = projects.reduce((s, p) => s + (p.chapterCount || 0), 0);
  const totalWords = projects.reduce((s, p) => s + (p.wordCount || 0), 0);
  const activeCount = projects.filter(p => p.status === "active").length;

  document.getElementById("statProjects").textContent = totalProj;
  document.getElementById("statChapters").textContent = totalChapters;
  document.getElementById("statWords").textContent = formatWordCount(totalWords);
  document.getElementById("statActive").textContent = activeCount;

  document.getElementById("statProjectsSub").textContent = totalProj <= 1 ? "" : totalProj + " novels";
  document.getElementById("statChaptersSub").textContent = totalChapters <= 1 ? "" : "across all";
  document.getElementById("statWordsSub").textContent = totalWords <= 1 ? "" : "total written";
}

function updateStatsFromPayload(data) {
  if (data.totalProjects != null) document.getElementById("statProjects").textContent = data.totalProjects;
  if (data.totalChapters != null) document.getElementById("statChapters").textContent = data.totalChapters;
  if (data.totalWords != null) document.getElementById("statWords").textContent = formatWordCount(data.totalWords);
  if (data.activeSessions != null) document.getElementById("statActive").textContent = data.activeSessions;
}

sendMessage("dashboard.ready", {});
sendMessage("dashboard.refresh", {});
</script>
</body>
</html>`;
}
