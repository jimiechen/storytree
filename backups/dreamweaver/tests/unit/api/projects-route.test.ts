import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/projects/route';
import { prisma } from '@/lib/db';

// Mock Prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    project: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe('Projects API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/projects', () => {
    it('should return projects list with correct response format', async () => {
      const mockProjects = [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: 'Test Project 1',
          description: 'Description 1',
          genre: 'Fantasy',
          status: 'draft',
          currentWordCount: 1000,
          targetWordCount: 50000,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-02'),
          _count: { chapters: 5 },
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          name: 'Test Project 2',
          description: null,
          genre: null,
          status: 'writing',
          currentWordCount: 5000,
          targetWordCount: null,
          createdAt: new Date('2024-01-03'),
          updatedAt: new Date('2024-01-04'),
          _count: { chapters: 10 },
        },
      ];

      vi.mocked(prisma.project.findMany).mockResolvedValue(mockProjects as any);

      const response = await GET();
      const data = await response.json();

      // Verify response format matches MSW format: { result: { code, message, data } }
      expect(data).toHaveProperty('result');
      expect(data.result).toHaveProperty('code', 10200);
      expect(data.result).toHaveProperty('message', 'success');
      expect(data.result).toHaveProperty('data');
      expect(Array.isArray(data.result.data)).toBe(true);

      // Verify data structure
      const project = data.result.data[0];
      expect(project).toHaveProperty('id');
      expect(project).toHaveProperty('name');
      expect(project).toHaveProperty('description');
      expect(project).toHaveProperty('genre');
      expect(project).toHaveProperty('status');
      expect(project).toHaveProperty('currentWordCount');
      expect(project).toHaveProperty('targetWordCount');
      expect(project).toHaveProperty('chapterCount');
      expect(project).toHaveProperty('createdAt');
      expect(project).toHaveProperty('updatedAt');

      // Verify null handling
      expect(data.result.data[1].description).toBe('');
      expect(data.result.data[1].genre).toBe('');
    });

    it('should return empty array when no projects exist', async () => {
      vi.mocked(prisma.project.findMany).mockResolvedValue([]);

      const response = await GET();
      const data = await response.json();

      expect(data.result.code).toBe(10200);
      expect(data.result.data).toEqual([]);
    });

    it('should return 500 on database error', async () => {
      vi.mocked(prisma.project.findMany).mockRejectedValue(new Error('Database error'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.result.code).toBe(10500);
      expect(data.result.message).toBe('获取项目列表失败');
    });
  });

  describe('POST /api/projects', () => {
    it('should create project with correct response format', async () => {
      const mockProject = {
        id: '550e8400-e29b-41d4-a716-446655440003',
        name: 'New Project',
        description: 'New Description',
        genre: 'Sci-Fi',
        status: 'draft',
        currentWordCount: 0,
        targetWordCount: 100000,
        createdAt: new Date('2024-01-05'),
        updatedAt: new Date('2024-01-05'),
      };

      vi.mocked(prisma.project.create).mockResolvedValue(mockProject as any);

      const request = new Request('http://localhost/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'New Project',
          description: 'New Description',
          genre: 'Sci-Fi',
          targetWordCount: 100000,
        }),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.result.code).toBe(10200);
      expect(data.result.message).toBe('创建成功');
      expect(data.result.data).toHaveProperty('id');
      expect(data.result.data).toHaveProperty('name', 'New Project');
      expect(data.result.data).toHaveProperty('chapterCount', 0);
    });

    it('should return 400 when name is empty', async () => {
      const request = new Request('http://localhost/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '',
          description: 'Description',
        }),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.result.code).toBe(10400);
      expect(data.result.message).toBe('项目名称不能为空');
    });

    it('should return 400 when name is whitespace only', async () => {
      const request = new Request('http://localhost/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '   ',
          description: 'Description',
        }),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.result.code).toBe(10400);
    });

    it('should handle optional fields as null', async () => {
      const mockProject = {
        id: '550e8400-e29b-41d4-a716-446655440004',
        name: 'Minimal Project',
        description: null,
        genre: null,
        status: 'draft',
        currentWordCount: 0,
        targetWordCount: null,
        createdAt: new Date('2024-01-06'),
        updatedAt: new Date('2024-01-06'),
      };

      vi.mocked(prisma.project.create).mockResolvedValue(mockProject as any);

      const request = new Request('http://localhost/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Minimal Project',
        }),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(data.result.code).toBe(10200);
      expect(data.result.data.description).toBe('');
      expect(data.result.data.genre).toBe('');
    });
  });
});
