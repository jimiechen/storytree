/**
 * Mock Data Store - In-Memory Database Simulation
 *
 * Provides mock data for development and testing.
 * Simulates Prisma/SQLite operations without actual database.
 *
 * Features:
 * - CRUD operations for all entities
 * - Auto-incrementing IDs
 * - Relationship support (Project → Chapters, Characters, etc.)
 * - Search and filtering
 */
class MockDataStore {
    items = new Map();
    counter = 0;
    create(data) {
        const id = this.generateId();
        const now = new Date().toISOString();
        const entity = {
            ...data,
            id,
            createdAt: now,
            updatedAt: now,
        };
        this.items.set(id, entity);
        return entity;
    }
    findById(id) {
        return this.items.get(id);
    }
    findAll(filter) {
        if (!filter)
            return Array.from(this.items.values());
        return Array.from(this.items.values()).filter(filter);
    }
    update(id, data) {
        const existing = this.items.get(id);
        if (!existing)
            return undefined;
        const updated = {
            ...existing,
            ...data,
            id,
            createdAt: existing.createdAt,
            updatedAt: new Date().toISOString(),
        };
        this.items.set(id, updated);
        return updated;
    }
    delete(id) {
        return this.items.delete(id);
    }
    count() {
        return this.items.size;
    }
    clear() {
        this.items.clear();
    }
    generateId() {
        this.counter++;
        return `mock-${Date.now()}-${this.counter}`;
    }
}
class StoryTreeMockStore {
    projects = new MockDataStore();
    chapters = new MockDataStore();
    characters = new MockDataStore();
    worldSettings = new MockDataStore();
    outlineNodes = new MockDataStore();
    initialize() {
        this.seedSampleData();
    }
    reset() {
        this.projects.clear();
        this.chapters.clear();
        this.characters.clear();
        this.worldSettings.clear();
        this.outlineNodes.clear();
        this.initialize();
    }
    getProjects() {
        return this.projects.findAll();
    }
    getProjectById(id) {
        return this.projects.findById(id);
    }
    getChaptersByProject(projectId) {
        return this.chapters.findAll((ch) => ch.projectId === projectId);
    }
    getChapterById(id) {
        return this.chapters.findById(id);
    }
    getCharactersByProject(projectId) {
        return this.characters.findAll((ch) => ch.projectId === projectId);
    }
    getWorldSettingsByProject(projectId) {
        return this.worldSettings.findAll((ws) => ws.projectId === projectId);
    }
    getOutlineByProject(projectId) {
        return this.outlineNodes.findAll((on) => on.projectId === projectId);
    }
    createProject(data) {
        return this.projects.create(data);
    }
    createChapter(data) {
        return this.chapters.create(data);
    }
    createCharacter(data) {
        return this.characters.create(data);
    }
    search(query) {
        switch (query.type) {
            case "project":
                return this.projects.findAll((p) => p.name.includes(query.keyword) || (p.description ?? "").includes(query.keyword));
            case "chapter":
                return this.chapters.findAll((c) => c.title.includes(query.keyword));
            case "character":
                return this.characters.findAll((c) => c.name.includes(query.keyword) || (c.description ?? "").includes(query.keyword));
            default:
                return [];
        }
    }
    getStats() {
        return {
            projects: this.projects.count(),
            chapters: this.chapters.count(),
            characters: this.characters.count(),
            worldSettings: this.worldSettings.count(),
            outlineNodes: this.outlineNodes.count(),
        };
    }
    seedSampleData() {
        const project1 = this.createProject({
            name: "星际迷途：归乡",
            description: "一部关于太空探索与身份认同的科幻小说",
            genre: "科幻",
            status: "in_progress",
        });
        for (let i = 1; i <= 5; i++) {
            this.createChapter({
                projectId: project1.id,
                title: `第${i}章：${["启程", "遭遇", "转折", "危机", "回归"][i - 1]}`,
                order: i,
                wordCount: [2500, 3200, 4100, 3800, 5200][i - 1],
                status: i <= 2 ? "final" : "draft",
            });
        }
        this.createCharacter({
            projectId: project1.id,
            name: "林远航",
            role: "protagonist",
            description: "前地球联邦宇航员，因时空异常流落到未知星系",
            traits: ["勇敢", "好奇", "固执"],
            backstory: "出生在地球轨道空间站，从小梦想探索星辰大海",
        });
        this.createCharacter({
            projectId: project1.id,
            name: "艾拉",
            role: "supporting",
            description: "神秘的外星种族少女，拥有心灵感应能力",
            traits: ["智慧", "善良", "神秘"],
        });
        this.createCharacter({
            projectId: project1.id,
            name: "指挥官凯恩",
            role: "antagonist",
            description: "地球联邦追捕部队指挥官，坚信林远航是叛徒",
            traits: ["冷酷", "执着", "正义感扭曲"],
        });
        this.createWorldSetting({
            projectId: project1.id,
            category: "location",
            name: "新地平线空间站",
            description: "故事开始的地方，位于银河系边缘的废弃空间站",
            details: { population: 5000, establishedYear: "2287" },
        });
        this.createWorldSetting({
            projectId: project1.id,
            category: "organization",
            name: "星际联盟",
            description: "统治已知宇宙的政治实体",
            details: { memberWorlds: 1200, capital: "地球" },
        });
    }
}
export const mockStore = new StoryTreeMockStore();
export function initializeMockStore() {
    mockStore.initialize();
}
//# sourceMappingURL=mock-store.js.map