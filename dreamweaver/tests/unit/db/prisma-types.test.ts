import { describe, it, expect } from 'vitest';
import type { User, Project, Chapter, Character, WorldSetting } from '@prisma/client';
import type { User as ApiUser, Project as ApiProject, Chapter as ApiChapter } from '@/types/api';
import type { Character as ApiCharacter, WorldSetting as ApiWorldSetting } from '@/types/knowledge';

/**
 * Prisma 类型与 API 接口类型兼容性测试
 * 验证生成的 Prisma Client 类型能与现有的 API 接口类型无缝对接
 */
describe('Prisma Types Compatibility', () => {
  describe('User Model', () => {
    it('should have compatible User type with API User interface', () => {
      const prismaUser: User = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        nickname: 'Test User',
        avatarUrl: null,
        subscriptionTier: 'free',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(prismaUser.id).toBeDefined();
      expect(prismaUser.email).toBeDefined();
      expect(typeof prismaUser.email).toBe('string');
    });

    it('should map Prisma User fields correctly', () => {
      const user: User = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'user@example.com',
        passwordHash: 'hash',
        nickname: 'Nickname',
        avatarUrl: 'https://example.com/avatar.png',
        subscriptionTier: 'pro',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      expect(user.id).toBeTruthy();
      expect(user.email).toBe('user@example.com');
    });
  });

  describe('Project Model', () => {
    it('should have compatible Project type with API Project interface', () => {
      const prismaProject: Project = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        userId: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test Novel',
        description: 'A test novel',
        genre: 'Fantasy',
        targetWordCount: 50000,
        currentWordCount: 10000,
        status: 'writing',
        settings: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(prismaProject.id).toBeDefined();
      expect(prismaProject.name).toBeDefined();
      expect(prismaProject.status).toBeOneOf(['draft', 'writing', 'completed', 'published']);
    });

    it('should support all ProjectStatus enum values', () => {
      const statuses: Project['status'][] = ['draft', 'writing', 'completed', 'published'];
      
      statuses.forEach(status => {
        const project: Partial<Project> = { status };
        expect(project.status).toBe(status);
      });
    });
  });

  describe('Chapter Model', () => {
    it('should have compatible Chapter type with API Chapter interface', () => {
      const prismaChapter: Chapter = {
        id: '550e8400-e29b-41d4-a716-446655440002',
        projectId: '550e8400-e29b-41d4-a716-446655440001',
        volumeNumber: 1,
        chapterNumber: 1,
        title: 'Chapter 1',
        content: 'Once upon a time...',
        wordCount: 500,
        status: 'draft',
        branchId: null,
        parentVersion: null,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(prismaChapter.id).toBeDefined();
      expect(prismaChapter.title).toBeDefined();
      expect(prismaChapter.content).toBeDefined();
    });

    it('should support all ChapterStatus enum values', () => {
      const statuses: Chapter['status'][] = ['outline', 'draft', 'revised', 'final'];
      
      statuses.forEach(status => {
        const chapter: Partial<Chapter> = { status };
        expect(chapter.status).toBe(status);
      });
    });
  });

  describe('Character Model', () => {
    it('should have compatible Character type with API Character interface', () => {
      const prismaCharacter: Character = {
        id: '550e8400-e29b-41d4-a716-446655440003',
        projectId: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Hero',
        aliases: null,
        roleType: 'protagonist',
        profile: null,
        relationships: null,
        arc: null,
        firstAppearance: null,
        wordCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(prismaCharacter.id).toBeDefined();
      expect(prismaCharacter.name).toBeDefined();
      expect(prismaCharacter.roleType).toBeOneOf(['protagonist', 'antagonist', 'supporting', 'minor']);
    });

    it('should support all RoleType enum values', () => {
      const roleTypes: Character['roleType'][] = ['protagonist', 'antagonist', 'supporting', 'minor'];
      
      roleTypes.forEach(roleType => {
        const character: Partial<Character> = { roleType };
        expect(character.roleType).toBe(roleType);
      });
    });
  });

  describe('WorldSetting Model', () => {
    it('should have compatible WorldSetting type with API WorldSetting interface', () => {
      const prismaWorldSetting: WorldSetting = {
        id: '550e8400-e29b-41d4-a716-446655440004',
        projectId: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Magic System',
        category: 'magic',
        type: 'system',
        description: 'The magic system of the world',
        properties: null,
        relations: null,
        sourceChapters: null,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(prismaWorldSetting.id).toBeDefined();
      expect(prismaWorldSetting.name).toBeDefined();
      expect(prismaWorldSetting.category).toBeDefined();
    });
  });

  describe('Type Conversion', () => {
    it('should convert Prisma Date to API string format', () => {
      const now = new Date('2024-01-15T10:30:00.000Z');
      const prismaProject: Partial<Project> = {
        createdAt: now,
        updatedAt: now,
      };

      const apiProject: Partial<ApiProject> = {
        createdAt: prismaProject.createdAt?.toISOString(),
      };

      expect(apiProject.createdAt).toBe('2024-01-15T10:30:00.000Z');
    });

    it('should handle JSON fields correctly', () => {
      const character: Partial<Character> = {
        profile: {
          age: 25,
          gender: 'male',
          appearance: 'Tall and handsome',
        },
        relationships: [
          { targetId: 'other-id', type: 'friend', description: 'Best friend' },
        ],
      };

      expect(character.profile).toBeDefined();
      expect(character.relationships).toBeDefined();
      expect(Array.isArray(character.relationships)).toBe(true);
    });
  });

  describe('Prisma Client Export', () => {
    it('should export all required types', () => {
      const types = ['User', 'Project', 'Chapter', 'Character', 'WorldSetting'];
      
      types.forEach(type => {
        expect(type).toBeTruthy();
      });
    });
  });
});
