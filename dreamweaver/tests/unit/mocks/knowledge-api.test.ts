import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { setupServer } from 'msw/node';
import { handlers } from '@/mocks/handlers';

const server = setupServer(...handlers);

const API_BASE = 'http://localhost:3000';

describe('Knowledge Mock API', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterAll(() => server.close());
  beforeEach(() => server.resetHandlers());

  describe('Characters API', () => {
    const projectId = 'test-project-id';

    describe('POST /api/projects/:projectId/characters', () => {
      it('应该创建新角色并返回 10200', async () => {
        const newCharacter = {
          name: '测试角色',
          aliases: ['别名1', '别名2'],
          age: 25,
          gender: 'male' as const,
          occupation: '剑客',
          appearance: '英俊潇洒',
          personality: '正直勇敢',
          backstory: '出身贫寒',
          goals: '成为天下第一',
          relationships: [],
          notes: '这是测试笔记',
          status: 'active' as const,
          tags: ['主角', '剑客'],
        };

        const response = await fetch(`${API_BASE}/api/projects/${projectId}/characters`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newCharacter),
        });

        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.result.code).toBe(10200);
        expect(data.result.data).toMatchObject({
          name: newCharacter.name,
          age: newCharacter.age,
          gender: newCharacter.gender,
        });
        expect(data.result.data.id).toBeDefined();
        expect(data.result.data.createdAt).toBeDefined();
        expect(data.result.data.updatedAt).toBeDefined();
      });

      it('项目不存在时应该返回 10404', async () => {
        const response = await fetch(`${API_BASE}/api/projects/non-existent/characters`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: '测试角色' }),
        });

        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.result.code).toBe(10404);
        expect(data.result.message).toBe('项目不存在');
      });
    });

    describe('GET /api/projects/:projectId/characters', () => {
      it('应该返回角色列表', async () => {
        // 先创建几个角色
        const characters = [
          { name: '角色1', relationships: [], status: 'active', tags: [] },
          { name: '角色2', relationships: [], status: 'active', tags: [] },
        ];

        for (const char of characters) {
          await fetch(`${API_BASE}/api/projects/${projectId}/characters`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(char),
          });
        }

        const response = await fetch(`${API_BASE}/api/projects/${projectId}/characters`);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.result.code).toBe(10200);
        expect(Array.isArray(data.result.data)).toBe(true);
        expect(data.result.data.length).toBeGreaterThanOrEqual(2);
      });

      it('项目不存在时应该返回 10404', async () => {
        const response = await fetch(`${API_BASE}/api/projects/non-existent/characters`);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.result.code).toBe(10404);
      });
    });

    describe('GET /api/projects/:projectId/characters/:characterId', () => {
      it('应该返回单个角色详情', async () => {
        // 先创建一个角色
        const createResponse = await fetch(`${API_BASE}/api/projects/${projectId}/characters`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: '特定角色',
            relationships: [],
            status: 'active',
            tags: [],
          }),
        });
        const createData = await createResponse.json();
        const characterId = createData.result.data.id;

        const response = await fetch(`${API_BASE}/api/projects/${projectId}/characters/${characterId}`);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.result.code).toBe(10200);
        expect(data.result.data.name).toBe('特定角色');
      });

      it('角色不存在时应该返回 10404', async () => {
        const response = await fetch(`${API_BASE}/api/projects/${projectId}/characters/non-existent`);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.result.code).toBe(10404);
      });
    });

    describe('PUT /api/projects/:projectId/characters/:characterId', () => {
      it('应该更新角色信息', async () => {
        // 先创建一个角色
        const createResponse = await fetch(`${API_BASE}/api/projects/${projectId}/characters`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: '旧名字',
            relationships: [],
            status: 'active',
            tags: [],
          }),
        });
        const createData = await createResponse.json();
        const characterId = createData.result.data.id;

        const response = await fetch(`${API_BASE}/api/projects/${projectId}/characters/${characterId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: '新名字' }),
        });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.result.code).toBe(10200);
        expect(data.result.data.name).toBe('新名字');
        expect(data.result.data.updatedAt).not.toBe(createData.result.data.updatedAt);
      });
    });

    describe('DELETE /api/projects/:projectId/characters/:characterId', () => {
      it('应该删除角色', async () => {
        // 先创建一个角色
        const createResponse = await fetch(`${API_BASE}/api/projects/${projectId}/characters`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: '待删除角色',
            relationships: [],
            status: 'active',
            tags: [],
          }),
        });
        const createData = await createResponse.json();
        const characterId = createData.result.data.id;

        const response = await fetch(`${API_BASE}/api/projects/${projectId}/characters/${characterId}`, {
          method: 'DELETE',
        });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.result.code).toBe(10200);

        // 验证已删除
        const getResponse = await fetch(`${API_BASE}/api/projects/${projectId}/characters/${characterId}`);
        expect(getResponse.status).toBe(404);
      });
    });
  });

  describe('World Settings API', () => {
    const projectId = 'test-project-id';

    describe('POST /api/projects/:projectId/world-settings', () => {
      it('应该创建新的世界观设定并返回 10200', async () => {
        const newSetting = {
          title: '魔法体系',
          category: 'magic' as const,
          content: '这是一个关于魔法体系的详细设定...',
          importance: 'critical' as const,
          relatedCharacterIds: [],
          relatedChapterIds: [],
          tags: ['魔法', '世界观'],
          status: 'active' as const,
        };

        const response = await fetch(`${API_BASE}/api/projects/${projectId}/world-settings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSetting),
        });

        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.result.code).toBe(10200);
        expect(data.result.data).toMatchObject({
          title: newSetting.title,
          category: newSetting.category,
          importance: newSetting.importance,
        });
        expect(data.result.data.id).toBeDefined();
      });

      it('项目不存在时应该返回 10404', async () => {
        const response = await fetch(`${API_BASE}/api/projects/non-existent/world-settings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: '测试设定' }),
        });

        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.result.code).toBe(10404);
      });
    });

    describe('GET /api/projects/:projectId/world-settings', () => {
      it('应该返回世界观设定列表', async () => {
        // 先创建几个设定
        const settings = [
          { title: '设定1', category: 'geography', content: '内容1', importance: 'high', relatedCharacterIds: [], relatedChapterIds: [], tags: [], status: 'active' },
          { title: '设定2', category: 'history', content: '内容2', importance: 'medium', relatedCharacterIds: [], relatedChapterIds: [], tags: [], status: 'active' },
        ];

        for (const setting of settings) {
          await fetch(`${API_BASE}/api/projects/${projectId}/world-settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(setting),
          });
        }

        const response = await fetch(`${API_BASE}/api/projects/${projectId}/world-settings`);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.result.code).toBe(10200);
        expect(Array.isArray(data.result.data)).toBe(true);
      });
    });

    describe('PUT /api/projects/:projectId/world-settings/:settingId', () => {
      it('应该更新世界观设定', async () => {
        // 先创建一个设定
        const createResponse = await fetch(`${API_BASE}/api/projects/${projectId}/world-settings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: '旧标题',
            category: 'geography',
            content: '内容',
            importance: 'medium',
            relatedCharacterIds: [],
            relatedChapterIds: [],
            tags: [],
            status: 'active',
          }),
        });
        const createData = await createResponse.json();
        const settingId = createData.result.data.id;

        const response = await fetch(`${API_BASE}/api/projects/${projectId}/world-settings/${settingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: '新标题', importance: 'critical' }),
        });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.result.code).toBe(10200);
        expect(data.result.data.title).toBe('新标题');
        expect(data.result.data.importance).toBe('critical');
      });
    });

    describe('DELETE /api/projects/:projectId/world-settings/:settingId', () => {
      it('应该删除世界观设定', async () => {
        // 先创建一个设定
        const createResponse = await fetch(`${API_BASE}/api/projects/${projectId}/world-settings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: '待删除设定',
            category: 'culture',
            content: '内容',
            importance: 'low',
            relatedCharacterIds: [],
            relatedChapterIds: [],
            tags: [],
            status: 'active',
          }),
        });
        const createData = await createResponse.json();
        const settingId = createData.result.data.id;

        const response = await fetch(`${API_BASE}/api/projects/${projectId}/world-settings/${settingId}`, {
          method: 'DELETE',
        });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.result.code).toBe(10200);
      });
    });
  });

  describe('API 响应格式验证', () => {
    const projectId = 'test-project-id';

    it('所有成功响应应该包含 result.code === 10200', async () => {
      const response = await fetch(`${API_BASE}/api/projects/${projectId}/characters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '格式测试角色',
          relationships: [],
          status: 'active',
          tags: [],
        }),
      });

      const data = await response.json();

      expect(data).toHaveProperty('result');
      expect(data.result).toHaveProperty('code');
      expect(data.result.code).toBe(10200);
      expect(data.result).toHaveProperty('message');
      expect(data.result).toHaveProperty('data');
    });

    it('所有错误响应应该包含 result.code 和 message', async () => {
      const response = await fetch(`${API_BASE}/api/projects/non-existent/characters`);
      const data = await response.json();

      expect(data).toHaveProperty('result');
      expect(data.result).toHaveProperty('code');
      expect(data.result.code).toBe(10404);
      expect(data.result).toHaveProperty('message');
    });
  });
});
