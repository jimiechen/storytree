import { describe, it, expect } from "vitest";
import { getEnhancedDashboardHtml } from "../webview/enhanced-dashboard";

describe("Enhanced Dashboard HTML Generator", () => {
  let html: string;

  beforeEach(() => {
    html = getEnhancedDashboardHtml("dash-nonce-789");
  });

  describe("HTML Structure", () => {
    it("should be valid HTML with DOCTYPE", () => {
      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("</html>");
    });

    it("should have proper title", () => {
      expect(html).toContain("<title>StoryTree IDE - Dashboard</title>");
    });

    it("should include nonce for script security", () => {
      expect(html).toContain("dash-nonce-789");
    });
  });

  describe("Header & Toolbar", () => {
    it("should have dashboard header with title", () => {
      expect(html).toContain("dashboard-header");
      expect(html).toContain("📚 StoryTree IDE");
    });

    it("should have search bar with input and icon", () => {
      expect(html).toContain("search-bar");
      expect(html).toContain("searchInput");
      expect(html).toContain('placeholder="Search projects..."');
      expect(html).toContain("search-icon");
    });

    it("should have sort dropdown with multiple options", () => {
      expect(html).toContain("sortSelect");
      expect(html).toContain('value="updated"');
      expect(html).toContain('value="created"');
      expect(html).toContain('value="name"');
      expect(html).toContain('value="chapters"');
    });

    it("should have New Project, Refresh, Settings buttons in toolbar", () => {
      expect(html).toContain("newProjectBtn");
      expect(html).contains("+ New Project") || expect(html).toContain("New Project");
      expect(html).toContain("refreshBtn");
      expect(html).toContain("settingsBtn");
    });
  });

  describe("Statistics Row", () => {
    it("should display 4 stat cards (Projects/Chapters/Words/Active)", () => {
      expect(html).toContain("statsRow");
      expect(html).toContain("statProjects");
      expect(html).toContain("statChapters");
      expect(html).toContain("statWords");
      expect(html).toContain("statActive");
    });

    it("should have label and value elements for each stat", () => {
      expect(html).toContain("Total Projects");
      expect(html).toContain("Total Chapters");
      expect(html).toContain("Total Words");
      expect(html).toContain("Active Sessions");
    });
  });

  describe("Project Grid", () => {
    it("should have projects grid container with empty state", () => {
      expect(html).toContain("projectsGrid");
      expect(html).toContain("emptyState");
      expect(html).toContain("No projects yet");
    });

    it("should show project count indicator", () => {
      expect(html).toContain("projectCount");
    });
  });

  describe("New Project Modal", () => {
    it("should have modal overlay structure", () => {
      expect(html).toContain("modal-overlay");
      expect(html).toContain("newProjectModal");
      expect(html).toContain("modal");
    });

    it("should have project name input field (required)", () => {
      expect(html).toContain("projNameInput");
      expect(html).toContain('type="text"');
      expect(html).toContain("required");
    });

    it("should have genre/type selector with common options", () => {
      expect(html).toContain("projTypeSelect");
      expect(html).toContain('value="sci-fi"');
      expect(html).toContain('value="fantasy"');
      expect(html).toContain('value="mystery"');
      expect(html).toContain('value="literary"');
    });

    it("should have description textarea", () => {
      expect(html).toContain("projDescInput");
      expect(html).toContain("Brief description");
    });

    it("should have Create and Cancel buttons", () => {
      expect(html).toContain("createProjectBtn");
      expect(html).toContain("Create Project");
      expect(html).toContain("cancelModalBtn");
      expect(html).toContain("closeModalBtn");
    });
  });

  describe("Context Menu (Right-click)", () => {
    it("should have context menu element", () => {
      expect(html).toContain("contextMenu");
      expect(html).toContain("id=\"contextMenu\"");
    });

    it("should contain Open, Rename, Duplicate, Archive, Delete actions", () => {
      expect(html).toContain('data-action="open"');
      expect(html).toContain('data-action="rename"');
      expect(html).toContain('data-action="duplicate"');
      expect(html).toContain('data-action="archive"');
      expect(html).toContain('data-action="delete"');
    });

    it("should style delete action as dangerous", () => {
      expect(html).toContain("context-danger");
      expect(html).toContain("Delete Project");
    });

    it("should have separator between actions", () => {
      expect(html).toContain("context-menu-separator");
    });
  });

  describe("IPC Communication", () => {
    it("should call acquireVsCodeApi()", () => {
      expect(html).toContain("acquireVsCodeApi()");
    });

    it("should send dashboard.ready on initialization", () => {
      expect(html).toContain('"dashboard.ready"');
    });

    it("should send dashboard.refresh on load and refresh button click", () => {
      expect(html).toContain('"dashboard.refresh"');
    });

    it("should send project.create when creating new project from modal", () => {
      expect(html).toContain('"project.create"');
    });

    it("should send project.open when clicking a card", () => {
      expect(html).toContain('"project.open"');
    });

    it("should send project.rename/rename/duplicate/archive/delete from context menu", () => {
      expect(html).toContain('"project.rename"');
      expect(html).toContain('"project.duplicate"');
      expect(html).toContain('"project.archive"');
      expect(html).toContain('"project.delete"');
    });

    it("should handle data-push events for projects_list, stats, project_created, project_deleted", () => {
      expect(html).toContain('"data-push"');
      expect(html).toContain("projects_list");
      expect(html).toContain("stats");
      expect(html).toContain("project_created");
      expect(html).toContain("project_deleted");
    });

    it("should navigate to settings page via navigation.navigate", () => {
      expect(html).toContain('"navigation.navigate"');
      expect(html).toContain("settings");
    });
  });

  describe("Search & Filter Logic", () => {
    it("should filter by project name on search input change", () => {
      const searchFn = html.match(/toLowerCase\(\)/g);
      expect(searchFn).not.toBeNull();
      const includesCheck = html.match(/\.includes\(/);
      expect(includesCheck).toBeTruthy();
    });

    it("should sort projects based on selected criteria", () => {
      expect(html).toContain(".sort(");
      expect(html).toContain("localeCompare");
    });

    it("should support sorting by name, created date, updated date, chapter count", () => {
      expect(html).toContain('case "name"');
      expect(html).toContain('case "created"');
      expect(html).toContain('case "chapters"');
    });
  });

  describe("Date Formatting", () => {
    it("should define formatDate function with relative time labels", () => {
      expect(html).toContain("formatDate");
      expect(html).toContain("Just now");
      expect(html).toContain("m ago");
      expect(html).toContain("h ago");
      expect(html).toContain("d ago");
    });
  });

  describe("Word Count Formatting", () => {
    it("should format large numbers with K/M suffixes", () => {
      expect(html).toContain("formatWordCount");
      expect(html).toContain("1.0M");
      expect(html).toContain("1.0K");
      expect(html).toContain("words");
    });
  });

  describe("XSS Prevention", () => {
    it("should use escapeHtml function for user content", () => {
      expect(html).toContain("escapeHtml");
      expect(html).toContain("textContent");
      expect(html).toContain("innerHTML");
    });

    it("should use nonce-based script security", () => {
      expect(html).toContain('nonce="${nonce}"');
    });

    it("should not contain external resources", () => {
      expect(html).not.toContain("<script src=");
      expect(html).not.toContain("<link rel=");
    });
  });

  describe("CSS Architecture", () => {
    it("should use VS Code CSS variables for theming", () => {
      expect(html).toContain("--vscode-editor-background");
      expect(html).toContain("--vscode-input-background");
      expect(html).toContain("--vscode-panel-border");
      expect(html).toContain("--vscode-button-background");
    });

    it("should use responsive grid layout for project cards", () => {
      expect(html).toContain("grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))");
    });

    it("should use CSS transitions for hover effects", () => {
      expect(html).toContain("transition:");
      expect(html).toContain(":hover");
    });
  });
});
