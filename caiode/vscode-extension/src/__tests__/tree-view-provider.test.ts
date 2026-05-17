import { describe, it, expect, vi, beforeEach } from "vitest";
import { StoryTreeTreeViewProvider, type StoryTreeNode } from "../core/tree-view-provider";

function createMockRepository() {
  return {
    listProjects: vi.fn().mockResolvedValue([
      { id: "p1", name: "Star Journey", description: "A sci-fi epic" },
      { id: "p2", name: "Mystic Forest", description: "" },
    ]),
    listChaptersByProjectId: vi.fn().mockImplementation((projectId: string) => {
      if (projectId === "p1") {
        return Promise.resolve([
          { id: "c1", title: "The Beginning", orderIndex: 0, status: "draft", wordCount: 2500 },
          { id: "c2", title: "First Contact", orderIndex: 1, status: "completed", wordCount: 5200 },
          { id: "c3", title: "Departure", orderIndex: 2, status: "draft", wordCount: 0 },
        ]);
      }
      return Promise.resolve([]);
    }),
    listOutlineNodesByChapterId: vi.fn().mockImplementation((chapterId: string) => {
      if (chapterId === "c1") {
        return Promise.resolve([
          { id: "s1", title: "Opening Scene", type: "scene" },
          { id: "s2", title: "Character Introduction", type: "scene" },
          { id: "n1", title: "World-building note", type: "note" },
        ]);
      }
      if (chapterId === "c2") {
        return Promise.resolve([
          { id: "s3", title: "Alien Encounter", type: "scene" },
        ]);
      }
      return Promise.resolve([]);
    }),
  };
}

describe("StoryTreeTreeViewProvider", () => {
  let provider: StoryTreeTreeViewProvider;
  let mockRepo: ReturnType<typeof createMockRepository>;

  beforeEach(() => {
    vi.restoreAllMocks();
    mockRepo = createMockRepository();
    provider = new StoryTreeTreeViewProvider(mockRepo as any);
  });

  describe("getChildren - Root Level (Projects)", () => {
    it("should return project items at root level when no element provided", async () => {
      const items = await provider.getChildren();
      expect(items).toHaveLength(2);
    });

    it("should use book icon for project nodes", async () => {
      const items = await provider.getChildren();
      const projItem = items.find((i) => i.label === "Star Journey");
      expect(projItem).toBeDefined();
      expect(projItem!.iconPath).toBeDefined();
    });

    it("should set project label from repository name", async () => {
      const items = await provider.getChildren();
      const labels = items.map((i) => i.label);
      expect(labels).toContain("Star Journey");
      expect(labels).toContain("Mystic Forest");
    });

    it("should include tooltip with project name and description", async () => {
      const items = await provider.getChildren();
      const starJourney = items.find((i) => i.label === "Star Journey")!;
      expect(starJourney.tooltip).toContain("Star Journey");
      expect(starJourney.tooltip).toContain("sci-fi epic");
    });

    it("should handle empty project list gracefully", async () => {
      mockRepo.listProjects.mockResolvedValueOnce([]);
      const items = await provider.getChildren();
      expect(items).toEqual([]);
    });

    it("should handle repository errors gracefully", async () => {
      mockRepo.listProjects.mockRejectedValueOnce(new Error("DB error"));
      const items = await provider.getChildren();
      expect(items).toEqual([]);
    });
  });

  describe("getChildren - Chapter Level", () => {
    it("should return chapter items when element is a project node", async () => {
      const rootItems = await provider.getChildren();
      const starProject = rootItems.find((i) => i.label === "Star Journey")!;
      const chapters = await provider.getChildren(starProject);

      expect(chapters).toHaveLength(3);
      const labels = chapters.map((c) => c.label);
      expect(labels).toContain("The Beginning");
      expect(labels).toContain("First Contact");
      expect(labels).toContain("Departure");
    });

    it("should show word count in chapter item description", async () => {
      const rootItems = await provider.getChildren();
      const starProject = rootItems.find((i) => i.label === "Star Journey")!;
      const chapters = await provider.getChildren(starProject);

      const firstContact = chapters.find((c) => c.label === "First Contact")!;
      expect(firstContact.description).toBe("5.2kw");

      const departure = chapters.find((c) => c.label === "Departure")!;
      expect(departure.description).toBe("0w");
    });

    it("should use check icon for completed chapters and file-code icon for draft", async () => {
      const rootItems = await provider.getChildren();
      const starProject = rootItems.find((i) => i.label === "Star Journey")!;
      const chapters = await provider.getChildren(starProject);

      const draftCh = chapters.find((c) => c.label === "The Beginning")!;
      const doneCh = chapters.find((c) => c.label === "First Contact")!;

      expect(draftCh.iconPath).toBeDefined();
      expect(doneCh.iconPath).toBeDefined();
    });

    it("should return empty array for projects with no chapters", async () => {
      const rootItems = await provider.getChildren();
      const mysticProject = rootItems.find((i) => i.label === "Mystic Forest")!;
      const chapters = await provider.getChildren(mysticProject);
      expect(chapters).toEqual([]);
    });
  });

  describe("getChildren - Scene Level", () => {
    it("should return scene/outline items when element is a chapter node", async () => {
      const rootItems = await provider.getChildren();
      const starProject = rootItems.find((i) => i.label === "Star Journey")!;
      const chapters = await provider.getChildren(starProject);
      const firstChapter = chapters.find((c) => c.label === "The Beginning")!;

      const scenes = await provider.getChildren(firstChapter);
      expect(scenes).toHaveLength(3);
      const labels = scenes.map((s) => s.label);
      expect(labels).toContain("Opening Scene");
      expect(labels).toContain("Character Introduction");
      expect(labels).toContain("World-building note");
    });

    it("should limit to max 20 scene nodes per chapter", async () => {
      const manyScenes = Array.from({ length: 25 }, (_, i) => ({
        id: `scene-${i}`,
        title: `Scene ${i + 1}`,
        type: "scene",
      }));
      mockRepo.listOutlineNodesByChapterId.mockResolvedValueOnce(manyScenes as any);

      const rootItems = await provider.getChildren();
      const starProject = rootItems.find((i) => i.label === "Star Journey")!;
      const chapters = await provider.getChildren(starProject);
      const firstChapter = chapters[0];

      const scenes = await provider.getChildren(firstChapter);
      expect(scenes).toHaveLength(20);
    });

    it("should use appropriate icons for different outline types", async () => {
      const rootItems = await provider.getChildren();
      const starProject = rootItems.find((i) => i.label === "Star Journey")!;
      const chapters = await provider.getChildren(starProject);
      const firstChapter = chapters.find((c) => c.label === "The Beginning")!;

      const scenes = await provider.getChildren(firstChapter);
      const sceneItem = scenes.find((s) => s.label === "Opening Scene")!;
      const noteItem = scenes.find((s) => s.label === "World-building note")!;

      expect(sceneItem.iconPath).toBeDefined();
      expect(noteItem.iconPath).toBeDefined();
    });

    it("should return empty array for chapter with no scenes", async () => {
      const rootItems = await provider.getChildren();
      const starProject = rootItems.find((i) => i.label === "Star Journey")!;
      const chapters = await provider.getChildren(starProject);
      const secondChapter = chapters.find((c) => c.label === "First Contact")!;

      const scenes = await provider.getChildren(secondChapter);
      expect(scenes).toHaveLength(1); // has 1 scene
    });
  });

  describe("refresh", () => {
    it("should fire onDidChangeTreeData event on refresh", () => {
      let fired = false;
      provider.onDidChangeTreeData(() => { fired = true; });
      provider.refresh();
      expect(fired).toBe(true);
    });
  });

  describe("getTreeItem", () => {
    it("should return the same tree item passed in", async () => {
      const items = await provider.getChildren();
      const item = items[0];
      expect(provider.getTreeItem(item)).toBe(item);
    });
  });

  describe("Node Type Identification", () => {
    it("should correctly identify project/chapter/scene nodes via contextValue", async () => {
      const rootItems = await provider.getChildren();

      expect(rootItems[0].contextValue).toBe("project");

      const starProject = rootItems.find((i) => i.label === "Star Journey")!;
      const chapters = await provider.getChildren(starProject);
      expect(chapters[0].contextValue).toBe("chapter");

      const firstChapter = chapters[0];
      const scenes = await provider.getChildren(firstChapter);
      expect(scenes[0].contextValue).toBe("scene");
    });
  });
});
