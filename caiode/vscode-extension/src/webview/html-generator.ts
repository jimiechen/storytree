/**
 * Webview HTML Generator
 *
 * Generates HTML content for VS Code Webview panels.
 * Each "page" is a self-contained view that communicates
 * with the extension host via IPC (postMessage/acquireVsCodeApi).
 */

export function getDashboardHtml(nonce: string): string {
  return /* html */ `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>StoryTree IDE</title>
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
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--bg); color: var(--fg); line-height: 1.5;
    }
    .app-container { max-width: 1200px; margin: 0 auto; padding: 20px; }

    .nav-bar {
      display: flex; align-items: center; gap: 4px;
      padding: 12px 16px; background: var(--sidebar-bg);
      border-bottom: 1px solid var(--border); margin-bottom: 20px;
    }
    .nav-tab {
      padding: 6px 14px; border-radius: 6px; font-size: 13px;
      cursor: pointer; border: none; background: transparent; color: var(--fg); opacity: 0.6;
      transition: all 0.15s;
    }
    .nav-tab:hover { opacity: 1; background: var(--badge-bg); }
    .nav-tab.active { opacity: 1; background: var(--accent); color: var(--accent-fg); font-weight: 600; }

    .header-row {
      display: flex; align-items: center; justify-content: space-between;
      padding-bottom: 16px; border-bottom: 1px solid var(--border); margin-bottom: 20px;
    }
    .header-title { font-size: 22px; font-weight: 700; }
    .status-badge {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 3px 10px; border-radius: 12px; font-size: 11px;
      background: var(--badge-bg); color: var(--badge-fg);
    }
    .status-dot { width: 7px; height: 7px; border-radius: 50%; background: #89d185; }

    .stats-grid {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px;
    }
    .stat-card {
      text-align: center; padding: 16px 12px;
      background: var(--bg); border: 1px solid var(--border); border-radius: 8px;
    }
    .stat-icon { font-size: 22px; margin-bottom: 4px; }
    .stat-value { font-size: 24px; font-weight: 700; }
    .stat-label { font-size: 11px; opacity: 0.55; margin-top: 2px; }

    .card-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px;
    }
    .card {
      background: var(--bg); border: 1px solid var(--border);
      border-radius: 8px; padding: 16px; transition: border-color 0.15s;
    }
    .card:hover { border-color: var(--accent); }
    .card-header {
      display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;
    }
    .card-title { font-size: 15px; font-weight: 600; }
    .status-tag {
      font-size: 10px; padding: 2px 8px; border-radius: 10px;
      white-space: nowrap;
    }
    .card-desc { font-size: 13px; opacity: 0.75; margin-bottom: 8px; }
    .card-meta {
      font-size: 11px; opacity: 0.45; padding-top: 8px;
      border-top: 1px solid var(--border);
    }
    .genre-tag {
      display: inline-block; font-size: 10px; padding: 2px 6px;
      background: var(--badge-bg); color: var(--badge-fg); border-radius: 3px; margin-top: 4px;
    }

    .empty-state { text-align: center; padding: 48px 20px; opacity: 0.5; }
    .error-state { color: var(--error-fg); padding: 12px; border-radius: 6px; margin-bottom: 12px; }
    .loading-state { text-align: center; padding: 40px; opacity: 0.65; }

    .btn-primary {
      padding: 8px 18px; background: var(--accent); color: var(--accent-fg);
      border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500;
    }
    .btn-primary:hover { opacity: 0.9; }

    .section-title { font-size: 16px; font-weight: 600; margin: 0 0 16px; }

    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { text-align: left; padding: 8px 12px; border-bottom: 2px solid var(--border); font-weight: 600; font-size: 11px; text-transform: uppercase; opacity: 0.6; }
    td { padding: 10px 12px; border-bottom: 1px solid var(--border); }
    tr:hover td { background: var(--badge-bg); }

    .role-badge { font-size: 10px; padding: 2px 8px; border-radius: 10px; }
    .role-protagonist { background: #3b82f622; color: #60a5fa; }
    .role-antagonist { background: #ef444422; color: #f87171; }
    .role-supporting { background: #22c55e22; color: #4ade80; }
    .role-minor { background: #88888822; color: #aaa; }

    .category-badge { font-size: 10px; padding: 2px 8px; border-radius: 4px; }
    .cat-location { background: #8b5cf622; color: #a78bfa; }
    .cat-organization { background: #f59e0b22; color: #fbbf24; }
    .cat-magic_system { background: #06b6d422; color: #22d3ee; }
    .cat-other { background: #88888822; color: #aaa; }

    .outline-item { padding: 10px 14px; border-left: 3px solid transparent; cursor: pointer; transition: all 0.15s; }
    .outline-item:hover { background: var(--badge-bg); border-left-color: var(--accent); }
    .outline-item.active { background: var(--badge-bg); border-left-color: var(--accent); font-weight: 600; }
    .outline-order { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 50%; background: var(--badge-bg); font-size: 11px; font-weight: 700; margin-right: 10px; }

    .search-bar {
      display: flex; align-items: center; gap: 8px; margin-bottom: 16px;
    }
    .search-input {
      flex: 1; padding: 8px 12px; border: 1px solid var(--input-border);
      border-radius: 6px; background: var(--input-bg); color: var(--fg); font-size: 13px;
    }
    .search-input:focus { outline: none; border-color: var(--accent); }
  </style>
</head>
<body>
  <div id="app"></div>

  <script nonce="${nonce}">
    (function() {
      const vscode = acquireVsCodeApi();
      let currentPage = 'dashboard';

      function sendMessage(action, payload) {
        return new Promise((resolve, reject) => {
          const id = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
          const handler = (event) => {
            const data = event.data;
            if (data.id === id || (data.jsonrpc === '2.0' && data.id === id)) {
              window.removeEventListener('message', handler);
              if (data.status === 'success') { resolve(data.data); }
              else { reject(new Error(data.error?.message || 'Request failed')); }
            }
          };
          window.addEventListener('message', handler);
          vscode.postMessage({ jsonrpc: '2.0', id, action, payload, timestamp: new Date().toISOString() });
          setTimeout(() => { window.removeEventListener('message', handler); reject(new Error('Timeout')); }, 30000);
        });
      }

      function esc(str) {
        if (!str) return '';
        var d = document.createElement('div'); d.textContent = str; return d.innerHTML;
      }

      function navigate(page) {
        currentPage = page;
        renderNav();
        switch(page) {
          case 'dashboard': loadDashboard(); break;
          case 'characters': loadCharacters(); break;
          case 'outline': loadOutline(); break;
          case 'world-settings': loadWorldSettings(); break;
        }
      }

      function renderNav() {
        var nav = document.getElementById('nav');
        if (!nav) return;
        var tabs = [
          { id: 'dashboard', icon: '📊', label: '工作台' },
          { id: 'characters', icon: '👥', label: '角色' },
          { id: 'outline', icon: '📖', label: '大纲' },
          { id: 'world-settings', icon: '🌍', label: '世界观' },
        ];
        nav.innerHTML = '<div class="nav-bar">' +
          tabs.map(function(t) {
            return '<button class="nav-tab' + (currentPage === t.id ? ' active' : '') + '" onclick="navigate(\\'' + t.id + '\\')">' +
              t.icon + ' ' + t.label + '</button>';
          }).join('') +
          '</div>';
      }

      async function loadDashboard() {
        var app = document.getElementById('app');
        try {
          var health = await sendMessage('system.healthCheck', {});
          var projects = await sendMessage('project.list', {});
          var stats = health?.mockStats || {};
          app.innerHTML =
            renderNavHtml() +
            '<div class="app-container">' +
              '<div class="header-row"><h1 class="header-title">📚 StoryTree IDE</h1><div class="status-badge"><span class="status-dot"></span>已连接</div></div>' +
              '<div class="stats-grid">' +
                renderStatCard('小说项目', stats.projects || 0, '📚') +
                renderStatCard('章节数量', stats.chapters || 0, '📖') +
                renderStatCard('角色数量', stats.characters || 0, '👤') +
                renderStatCard('世界观设定', stats.worldSettings || 0, '🌍') +
              '</div>' +
              '<h2 class="section-title">我的项目</h2>' +
              '<div class="card-grid">' + renderProjectCards(projects) + '</div>' +
              '<div style="margin-top:24px;text-align:center"><button class="btn-primary" onclick="alert(\'创建功能即将上线\')">+ 创建新项目</button></div>' +
            '</div>';
          renderNav();
        } catch(e) { app.innerHTML = renderNavHtml() + '<div class="error-state">加载失败: ' + e.message + '</div>'; }
      }

      async function loadCharacters() {
        var app = document.getElementById('app');
        try {
          var res = await sendMessage('character.list', {});
          var characters = res?.characters || [];
          app.innerHTML =
            renderNavHtml() +
            '<div class="app-container">' +
              '<div class="header-row"><h1 class="header-title">👥 角色管理</h1></div>' +
              '<div class="search-bar"><input class="search-input" type="text" placeholder="搜索角色名称..." id="char-search" oninput="filterCharacters()"></div>' +
              '<table><thead><tr><th>名称</th><th>类型</th><th>描述</th><th>特征</th></tr></thead>' +
              '<tbody id="char-tbody">' + characters.map(renderCharacterRow).join('') + '</tbody></table>' +
              (characters.length === 0 ? '<div class="empty-state">暂无角色数据</div>' : '') +
            '</div>';
          window._allCharacters = characters;
          renderNav();
        } catch(e) { app.innerHTML = renderNavHtml() + '<div class="error-state">加载失败: ' + e.message + '</div>'; }
      }

      function filterCharacters() {
        var q = (document.getElementById('char-search').value || '').toLowerCase();
        var rows = document.querySelectorAll('#char-tbody tr');
        window._allCharacters.forEach(function(c, i) {
          if (rows[i]) rows[i].style.display = (c.name.toLowerCase().indexOf(q) !== -1 || (c.description||'').toLowerCase().indexOf(q) !== -1) ? '' : 'none';
        });
      }

      async function loadOutline() {
        var app = document.getElementById('app');
        try {
          var res = await sendMessage('chapter.list', {});
          var chapters = res?.chapters || [];
          app.innerHTML =
            renderNavHtml() +
            '<div class="app-container">' +
              '<div class="header-row"><h1 class="header-title">📖 大纲编辑</h1></div>' +
              '<div style="display:flex;gap:20px">' +
                '<div style="flex:1;min-width:0"><h3 style="font-size:14px;margin-bottom:12px">章节列表 (' + chapters.length + ')</h3>' +
                  '<div id="outline-list">' + chapters.map(function(ch, i) {
                    return '<div class="outline-item" data-index="' + i + '" onclick="selectChapter(' + i + ')">' +
                      '<span class="outline-order">' + ch.order + '</span>' +
                      '<span>' + esc(ch.title) + '</span>' +
                      '<span style="float:right;font-size:11px;opacity:0.45">' + (ch.wordCount || 0) + '字</span>' +
                    '</div>';
                  }).join('') + '</div>' +
                '</div>' +
                '<div style="width:320px;border-left:1px solid var(--border);padding-left:16px" id="outline-detail">' +
                  '<div class="empty-state">选择章节查看详情</div>' +
                '</div>' +
              '</div>' +
            '</div>';
          window._allChapters = chapters;
          renderNav();
        } catch(e) { app.innerHTML = renderNavHtml() + '<div class="error-state">加载失败: ' + e.message + '</div>'; }
      }

      function selectChapter(idx) {
        var ch = window._allChapters[idx];
        if (!ch) return;
        document.querySelectorAll('.outline-item').forEach(function(el, i) {
          el.classList.toggle('active', i === idx);
        });
        var statusMap = { outline: '草稿', draft: '写作中', review: '审阅中', final: '已定稿' };
        document.getElementById('outline-detail').innerHTML =
          '<h3 style="font-size:15px;margin-bottom:8px">' + esc(ch.title) + '</h3>' +
          '<div style="display:flex;gap:12px;margin-bottom:12px;font-size:11px">' +
            '<span class="status-tag" style="background:#89d18522;color:#89d185">' + (statusMap[ch.status] || ch.status) + '</span>' +
            '<span>' + (ch.wordCount || 0) + ' 字</span>' +
            '<span>顺序: ' + ch.order + '</span>' +
          '</div>' +
          (ch.content ? '<p style="font-size:13px;opacity:0.75;line-height:1.7">' + esc(ch.content.substring(0, 500)) + (ch.content.length > 500 ? '...' : '') + '</p>' : '');
      }

      async function loadWorldSettings() {
        var app = document.getElementById('app');
        try {
          var res = await sendMessage('worldsetting.list', {});
          var settings = res?.worldSettings || [];
          app.innerHTML =
            renderNavHtml() +
            '<div class="app-container">' +
              '<div class="header-row"><h1 class="header-title">🌍 世界观设定</h1></div>' +
              '<div class="search-bar"><input class="search-input" type="text" placeholder="搜索设定..." id="ws-search" oninput="filterWorldSettings()"></div>' +
              '<div class="card-grid">' + settings.map(renderWorldSettingCard).join('') + '</div>' +
              (settings.length === 0 ? '<div class="empty-state">暂无世界观设定</div>' : '') +
            '</div>';
          window._allWorldSettings = settings;
          renderNav();
        } catch(e) { app.innerHTML = renderNavHtml() + '<div class="error-state">加载失败: ' + e.message + '</div>'; }
      }

      function filterWorldSettings() {
        var q = (document.getElementById('ws-search').value || '').toLowerCase();
        var cards = document.querySelectorAll('.ws-card');
        window._allWorldSettings.forEach(function(s, i) {
          if (cards[i]) cards[i].style.display = (s.name.toLowerCase().indexOf(q) !== -1 || (s.description||'').toLowerCase().indexOf(q) !== -1) ? '' : 'none';
        });
      }

      function renderNavHtml() { return '<div id="nav"></div>'; }

      function renderStatCard(label, value, icon) {
        return '<div class="stat-card"><div class="stat-icon">' + icon + '</div><div class="stat-value">' + value + '</div><div class="stat-label">' + label + '</div></div>';
      }

      function renderProjectCards(data) {
        var projects = data?.projects || [];
        if (projects.length === 0) return '<div class="card"><h3>暂无项目</h3><p>点击下方按钮创建您的第一个小说项目</p></div>';
        return projects.map(function(p) {
          var sm = { draft:'草稿',in_progress:'写作中',completed:'已完成',archived:'已归档' };
          var sc = { draft:'#888',in_progress:'#89d185',completed:'#3794ff',archived:'#666' };
          var si = sm[p.status] || '草稿';
          var c = sc[p.status] || '#888';
          return '<div class="card"><div class="card-header"><h3 class="card-title">' + esc(p.name) + '</h3>' +
            '<span class="status-tag" style="background:'+c+'22;color:'+c+'">'+si+'</span></div>' +
            (p.description ? '<p class="card-desc">'+esc(p.description)+'</p>' : '') +
            (p.genre ? '<span class="genre-tag">'+esc(p.genre)+'</span>' : '') +
            '<div class="card-meta">创建于 '+(p.createdAt?new Date(p.createdAt).toLocaleString('zh-CN'):'-')+'</div></div>';
        }).join('');
      }

      function renderCharacterRow(ch) {
        var rm = { protagonist:'主角',antagonist:'反派',supporting:'配角',minor:'次要角色' };
        var rc = { protagonist:'role-protagonist',antagonist:'role-antagonist',supporting:'role-supporting',minor:'role-minor' };
        var role = rm[ch.role] || ch.role || '其他';
        var cls = rc[ch.role] || 'role-minor';
        var traits = (ch.traits||[]).map(function(t){return '<span style="font-size:10px;padding:1px 6px;background:var(--badge-bg);border-radius:3px;margin-right:4px">'+esc(t)+'</span>';}).join('');
        return '<tr><td><strong>'+esc(ch.name)+'</strong></td><td><span class="role-badge '+cls+'">'+role+'</span></td>'+
          '<td style="max-width:250px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(ch.description||'-')+'</td>'+
          '<td>'+traits+'</td></tr>';
      }

      function renderWorldSettingCard(ws) {
        var cm = { location:'地点',organization:'组织',magic_system:'魔法体系',technology:'科技',culture:'文化',other:'其他' };
        var cc = { location:'cat-location',organization:'cat-organization',magic_system:'cat-magic_system',technology:'cat-other',culture:'cat-other',other:'cat-other' };
        var cat = cm[ws.category] || ws.category || '其他';
        var cls = cc[ws.category] || 'cat-other';
        return '<div class="card ws-card"><div class="card-header"><h3 class="card-title">'+esc(ws.name)+'</h3>'+
          '<span class="category-badge '+cls+'">'+cat+'</span></div>'+
          (ws.description?'<p class="card-desc">'+esc(ws.description)+'</p>':'')+
          '</div>';
      }

      window.navigate = navigate;
      window.addEventListener('load', function() { navigate('dashboard'); });
    })();
  </script>
</body>
</html>`;
}
