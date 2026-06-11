import { describe, it, expect } from "bun:test";
import { mockProjects, mockBookshelfData } from "../mock-data";
import { createNovelProjectProvider } from "../providers/novel-project";

describe("STDD: Stitch 核心页面流程", () => {
  const projectProvider = createNovelProjectProvider();

  // === 页面 1: 我的书架 ===
  describe("Page: 我的书架 /bookshelf", () => {
    it("应该能获取项目列表", async () => {
      const projects = await projectProvider.listProjects();
      expect(projects.length).toBeGreaterThanOrEqual(1);
      expect(projects[0].id).toBeTruthy();
      expect(projects[0].name).toBeTruthy();
    });

    it("项目应该包含书架展示所需字段", async () => {
      const projects = await projectProvider.listProjects();
      for (const p of projects) {
        expect(p.id).toBeTruthy();
        expect(p.name).toBeTruthy();
        expect(p.genre).toBeTruthy();
        expect(p.totalWordCount).toBeGreaterThanOrEqual(0);
        expect(p.chapterCount).toBeGreaterThanOrEqual(0);
        expect(p.status).toBeOneOf(["active", "archived", "draft"]);
        expect(p.lastUpdated).toBeInstanceOf(Date);
      }
    });

    it("Mock 数据应该包含多个项目", () => {
      expect(mockProjects.length).toBeGreaterThanOrEqual(3);
    });

    it("书架统计数据应该有效", () => {
      expect(mockBookshelfData.totalProjects).toBeGreaterThanOrEqual(0);
      expect(mockBookshelfData.totalWordCount).toBeGreaterThanOrEqual(0);
      expect(mockBookshelfData.totalChapters).toBeGreaterThanOrEqual(0);
    });
  });

  // === 页面 2: 创建新项目弹窗 ===
  describe("Modal: 创建新项目", () => {
    it("应该支持创建新项目", async () => {
      const newProject = await projectProvider.createProject({
        name: "测试小说",
        genre: "玄幻",
        description: "测试描述",
        targetAudience: "general",
        writingStyle: "default",
        storyTheme: "default",
      });

      expect(newProject.id).toBeTruthy();
      expect(newProject.name).toBe("测试小说");
      expect(newProject.genre).toBe("玄幻");
      expect(newProject.status).toBe("active");
    });

    it("创建后项目列表应该增加", async () => {
      const before = (await projectProvider.listProjects()).length;
      await projectProvider.createProject({
        name: "新增项目",
        genre: "都市",
        description: "",
      });
      const after = (await projectProvider.listProjects()).length;
      expect(after).toBe(before + 1);
    });
  });

  // === 页面 3: 小说项目工作台 ===
  describe("Page: 工作台 /workbench/:projectId", () => {
    it("应该能获取指定项目的章节列表", async () => {
      const projects = await projectProvider.listProjects();
      const project = projects[0];
      const chapters = await projectProvider.listChapters(project.id);
      expect(chapters).toBeDefined();
    });

    it("工作台应该返回项目详情", async () => {
      const projects = await projectProvider.listProjects();
      const project = await projectProvider.getProject(projects[0].id);
      expect(project).toBeDefined();
      expect(project?.name).toBeTruthy();
    });
  });

  // === 页面 4: 章节编辑器 ===
  describe("Page: 章节编辑器 /editor/:chapterId", () => {
    it("应该能获取章节内容", async () => {
      const projects = await projectProvider.listProjects();
      const chapters = await projectProvider.listChapters(projects[0].id);
      if (chapters.length > 0) {
        const chapter = await projectProvider.getChapter(chapters[0].id);
        expect(chapter).toBeDefined();
        expect(chapter?.id).toBeTruthy();
        expect(chapter?.title).toBeTruthy();
      }
    });
  });

  // === 端到端流程 ===
  describe("E2E: 书架 → 创建 → 工作台 流程", () => {
    it("完整流程: 获取书架 → 创建项目 → 进入工作台", async () => {
      // Step 1: 书架有项目
      const bookshelf = await projectProvider.listProjects();
      expect(bookshelf.length).toBeGreaterThanOrEqual(1);

      // Step 2: 创建新项目
      const newProject = await projectProvider.createProject({
        name: "流程测试小说",
        genre: "科幻",
        description: "端到端测试",
      });
      expect(newProject.id).toBeTruthy();

      // Step 3: 书架包含新项目
      const updatedBookshelf = await projectProvider.listProjects();
      const found = updatedBookshelf.find(p => p.id === newProject.id);
      expect(found).toBeDefined();

      // Step 4: 能获取工作台数据
      const project = await projectProvider.getProject(newProject.id);
      expect(project).toBeDefined();
      const chapters = await projectProvider.listChapters(newProject.id);
      expect(chapters).toBeDefined();
    });
  });
});
