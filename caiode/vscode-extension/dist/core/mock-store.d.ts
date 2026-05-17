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
export interface MockEntity {
    id: string;
    createdAt: string;
    updatedAt: string;
}
export interface Project extends MockEntity {
    name: string;
    description?: string;
    genre?: string;
    status: "draft" | "in_progress" | "completed" | "archived";
}
export interface Chapter extends MockEntity {
    projectId: string;
    title: string;
    content?: string;
    order: number;
    wordCount: number;
    status: "outline" | "draft" | "review" | "final";
    parentId?: string;
}
export interface Character extends MockEntity {
    projectId: string;
    name: string;
    role: "protagonist" | "antagonist" | "supporting" | "minor";
    description?: string;
    traits?: string[];
    backstory?: string;
}
export interface WorldSetting extends MockEntity {
    projectId: string;
    category: "location" | "organization" | "magic_system" | "technology" | "culture" | "other";
    name: string;
    description?: string;
    details?: Record<string, unknown>;
}
export interface OutlineNode extends MockEntity {
    projectId: string;
    chapterId?: string;
    type: "act" | "arc" | "scene" | "beat";
    title: string;
    synopsis?: string;
    order: number;
    parentId?: string;
    childrenIds?: string[];
}
declare class StoryTreeMockStore {
    private projects;
    private chapters;
    private characters;
    private worldSettings;
    private outlineNodes;
    initialize(): void;
    reset(): void;
    getProjects(): Project[];
    getProjectById(id: string): Project | undefined;
    getChaptersByProject(projectId: string): Chapter[];
    getChapterById(id: string): Chapter | undefined;
    getCharactersByProject(projectId: string): Character[];
    getWorldSettingsByProject(projectId: string): WorldSetting[];
    getOutlineByProject(projectId: string): OutlineNode[];
    createProject(data: Omit<Project, "id" | "createdAt" | "updatedAt">): Project;
    createChapter(data: Omit<Chapter, "id" | "createdAt" | "updatedAt">): Chapter;
    createCharacter(data: Omit<Character, "id" | "createdAt" | "updatedAt">): Character;
    search(query: {
        type: "project" | "chapter" | "character";
        keyword: string;
    }): Project[] | Chapter[] | Character[];
    getStats(): {
        projects: number;
        chapters: number;
        characters: number;
        worldSettings: number;
        outlineNodes: number;
    };
    private seedSampleData;
}
export declare const mockStore: StoryTreeMockStore;
export declare function initializeMockStore(): void;
export {};
//# sourceMappingURL=mock-store.d.ts.map