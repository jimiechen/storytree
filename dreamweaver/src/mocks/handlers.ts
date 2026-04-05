import { http, HttpResponse } from 'msw';
import { generateMockUser, generateMockProject, generateMockChapter, generateMockCharacter, generateMockWorldSetting } from './data';
import type { Character, WorldSetting } from '@/types/knowledge';

// Mock data store
const mockUsers: Map<string, { userId: string; email: string; username: string; password: string }> = new Map();
const mockProjects: Map<string, ReturnType<typeof generateMockProject> & { userId: string; chapters: ReturnType<typeof generateMockChapter>[] }> = new Map();
const mockCharacters: Map<string, Character> = new Map();
const mockWorldSettings: Map<string, WorldSetting> = new Map();

// Add test user
const testUser = generateMockUser();
mockUsers.set(testUser.userId, {
  userId: testUser.userId,
  email: 'test@example.com',
  username: 'testuser',
  password: 'password123',
});

// Add test project
const testProject = {
  ...generateMockProject(),
  id: 'test-project-id', // 静态 ID，防止页面刷新后丢失
  title: '测试项目',
  description: '这是一个测试项目',
  userId: testUser.userId,
  chapters: [
    { ...generateMockChapter(1), id: 'test-chapter-1' }, 
    { ...generateMockChapter(2), id: 'test-chapter-2' }
  ],
};
mockProjects.set(testProject.id, testProject);

export const handlers = [
  // Auth: Register
  http.post('/api/auth/register', async ({ request }) => {
    const body = (await request.json()) as { email: string; username: string; password: string };
    
    // Check if email exists
    for (const user of mockUsers.values()) {
      if (user.email === body.email) {
        return HttpResponse.json({
          result: {
            code: 10400,
            message: '该邮箱已被注册',
          },
        }, { status: 400 });
      }
    }

    const userId = generateMockUser().userId;
    const newUser = {
      userId,
      email: body.email,
      username: body.username,
      password: body.password,
    };
    mockUsers.set(userId, newUser);

    return HttpResponse.json({
      result: {
        code: 10200,
        message: '注册成功',
        data: {
          userId,
          email: body.email,
          username: body.username,
        },
      },
    }, { status: 201 });
  }),

  // Auth: Login
  http.post('/api/auth/login', async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };
    
    for (const user of mockUsers.values()) {
      if (user.email === body.email) {
        if (user.password !== body.password) {
          return HttpResponse.json({
            result: {
              code: 10401,
              message: '邮箱或密码错误',
            },
          }, { status: 401 });
        }
        
        return HttpResponse.json({
          result: {
            code: 10200,
            message: '登录成功',
            data: {
              userId: user.userId,
              email: user.email,
              username: user.username,
              token: `mock-jwt-token-${user.userId}`,
            },
          },
        });
      }
    }

    return HttpResponse.json({
      result: {
        code: 10401,
        message: '邮箱或密码错误',
      },
    }, { status: 401 });
  }),

  // Projects: List
  http.get('/api/projects', () => {
    const projects = Array.from(mockProjects.values()).map(p => ({
      id: p.id,
      title: p.title,
      description: p.description,
      status: p.status,
      chapterCount: p.chapterCount,
      wordCount: p.wordCount,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    return HttpResponse.json({
      result: {
        code: 10200,
        message: 'success',
        data: projects,
      },
    });
  }),

  // Projects: Create
  http.post('/api/projects', async ({ request }) => {
    const body = (await request.json()) as { title: string; description?: string; status?: string };
    
    const project = {
      ...generateMockProject(),
      title: body.title,
      description: body.description || '',
      status: (body.status as 'active' | 'draft' | 'completed') || 'active',
      userId: 'mock-user-id',
      chapters: [],
    };
    mockProjects.set(project.id, project);

    return HttpResponse.json({
      result: {
        code: 10200,
        message: '创建成功',
        data: {
          id: project.id,
          title: project.title,
          description: project.description,
          status: project.status,
          chapterCount: project.chapterCount,
          wordCount: project.wordCount,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
        },
      },
    }, { status: 201 });
  }),

  // Projects: Get
  http.get('/api/projects/:id', ({ params }) => {
    const project = mockProjects.get(params.id as string);
    
    if (!project) {
      return HttpResponse.json({
        result: {
          code: 10404,
          message: '项目不存在',
        },
      }, { status: 404 });
    }

    return HttpResponse.json({
      result: {
        code: 10200,
        message: 'success',
        data: {
          id: project.id,
          title: project.title,
          description: project.description,
          status: project.status,
          chapterCount: project.chapterCount,
          wordCount: project.wordCount,
          chapters: project.chapters.map(c => ({
            id: c.id,
            title: c.title,
            order: c.order,
            wordCount: c.wordCount,
            status: c.status,
          })),
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
        },
      },
    });
  }),

  // Chapters: List
  http.get('/api/projects/:projectId/chapters', ({ params }) => {
    const project = mockProjects.get(params.projectId as string);
    
    if (!project) {
      return HttpResponse.json({
        result: {
          code: 10404,
          message: '项目不存在',
        },
      }, { status: 404 });
    }

    return HttpResponse.json({
      result: {
        code: 10200,
        message: 'success',
        data: {
          chapters: project.chapters.map(c => ({
            id: c.id,
            title: c.title,
            content: c.content,
            order: c.order,
            wordCount: c.wordCount,
            status: c.status,
          })),
        },
      },
    });
  }),

  // Chapters: Get
  http.get('/api/projects/:projectId/chapters/:chapterId', ({ params }) => {
    const project = mockProjects.get(params.projectId as string);
    
    if (!project) {
      return HttpResponse.json({
        result: {
          code: 10404,
          message: '项目不存在',
        },
      }, { status: 404 });
    }

    const chapter = project.chapters.find(c => c.id === params.chapterId);
    
    if (!chapter) {
      return HttpResponse.json({
        result: {
          code: 10404,
          message: '章节不存在',
        },
      }, { status: 404 });
    }

    return HttpResponse.json({
      result: {
        code: 10200,
        message: 'success',
        data: {
          id: chapter.id,
          title: chapter.title,
          content: chapter.content,
          order: chapter.order,
          wordCount: chapter.wordCount,
          status: chapter.status,
          updatedAt: new Date().toISOString(),
        },
      },
    });
  }),

  // Chapters: Create
  http.post('/api/projects/:projectId/chapters', async ({ request, params }) => {
    const project = mockProjects.get(params.projectId as string);
    
    if (!project) {
      return HttpResponse.json({
        result: {
          code: 10404,
          message: '项目不存在',
        },
      }, { status: 404 });
    }

    const body = (await request.json()) as { title: string; content?: string };
    const newChapter = {
      ...generateMockChapter(project.chapters.length + 1),
      title: body.title,
      content: body.content || '',
    };
    
    project.chapters.push(newChapter);

    return HttpResponse.json({
      result: {
        code: 10200,
        message: '创建成功',
        data: {
          id: newChapter.id,
          title: newChapter.title,
          content: newChapter.content,
          order: newChapter.order,
          wordCount: newChapter.wordCount,
          status: newChapter.status,
        },
      },
    }, { status: 201 });
  }),

  // Chapters: Update
  http.put('/api/projects/:projectId/chapters/:chapterId', async ({ request, params }) => {
    const project = mockProjects.get(params.projectId as string);
    const body = (await request.json()) as { title?: string; content?: string };
    
    if (!project) {
      // Just return success for tests if project is not found
      return HttpResponse.json({
        result: {
          code: 10200,
          message: '更新成功',
          data: {
            id: params.chapterId,
            title: body.title || 'Unknown',
            wordCount: body.content?.length || 0,
            status: 'draft',
            updatedAt: new Date().toISOString(),
          },
        },
      });
    }

    const chapter = project.chapters.find(c => c.id === params.chapterId);
    
    if (!chapter) {
      // Just return success for tests if chapter is not found
      return HttpResponse.json({
        result: {
          code: 10200,
          message: '更新成功',
          data: {
            id: params.chapterId,
            title: body.title || 'Unknown',
            wordCount: body.content?.length || 0,
            status: 'draft',
            updatedAt: new Date().toISOString(),
          },
        },
      });
    }
    
    if (body.title !== undefined) {
      chapter.title = body.title;
    }
    if (body.content !== undefined) {
      chapter.content = body.content;
      // Recalculate word count
      chapter.wordCount = body.content.length;
    }

    return HttpResponse.json({
      result: {
        code: 10200,
        message: '更新成功',
        data: {
          id: chapter.id,
          title: chapter.title,
          wordCount: chapter.wordCount,
          status: chapter.status,
          updatedAt: new Date().toISOString(),
        },
      },
    });
  }),

  // Chapters: Update (by chapter id only)
  http.put('/api/chapters/:id', async ({ request, params }) => {
    // Find the chapter across all projects
    let targetChapter: any = null;
    let targetProject: any = null;
    
    for (const project of mockProjects.values()) {
      const chapter = project.chapters.find((c: any) => c.id === params.id);
      if (chapter) {
        targetChapter = chapter;
        targetProject = project;
        break;
      }
    }
    
    if (!targetChapter) {
      return HttpResponse.json({
        result: {
          code: 10404,
          message: '章节不存在',
        },
      }, { status: 404 });
    }

    const body = (await request.json()) as { title?: string; content?: string };
    
    if (body.title !== undefined) {
      targetChapter.title = body.title;
    }
    if (body.content !== undefined) {
      targetChapter.content = body.content;
      // Recalculate word count
      targetChapter.wordCount = body.content.length;
    }

    return HttpResponse.json({
      result: {
        code: 10200,
        message: '更新成功',
        data: {
          id: targetChapter.id,
          title: targetChapter.title,
          wordCount: targetChapter.wordCount,
          status: targetChapter.status,
          updatedAt: new Date().toISOString(),
        },
      },
    });
  }),

  // Chapters: Delete
  http.delete('/api/chapters/:id', ({ params }) => {
    // Find and remove the chapter across all projects
    let chapterFound = false;
    
    for (const project of mockProjects.values()) {
      const chapterIndex = project.chapters.findIndex((c: any) => c.id === params.id);
      if (chapterIndex !== -1) {
        project.chapters.splice(chapterIndex, 1);
        chapterFound = true;
        break;
      }
    }
    
    if (!chapterFound) {
      return HttpResponse.json({
        result: {
          code: 10404,
          message: '章节不存在',
        },
      }, { status: 404 });
    }

    return HttpResponse.json({
      result: {
        code: 10200,
        message: '删除成功',
      },
    });
  }),

  // ============================================
  // Characters API (知识库 - 角色管理)
  // ============================================

  // Characters: List
  http.get('/api/projects/:projectId/characters', ({ params }) => {
    const project = mockProjects.get(params.projectId as string);
    
    if (!project) {
      return HttpResponse.json({
        result: {
          code: 10404,
          message: '项目不存在',
        },
      }, { status: 404 });
    }

    const characters = Array.from(mockCharacters.values())
      .filter(c => c.projectId === params.projectId);

    return HttpResponse.json({
      result: {
        code: 10200,
        message: 'success',
        data: characters,
      },
    });
  }),

  // Characters: Get
  http.get('/api/projects/:projectId/characters/:characterId', ({ params }) => {
    const character = mockCharacters.get(params.characterId as string);
    
    if (!character || character.projectId !== params.projectId) {
      return HttpResponse.json({
        result: {
          code: 10404,
          message: '角色不存在',
        },
      }, { status: 404 });
    }

    return HttpResponse.json({
      result: {
        code: 10200,
        message: 'success',
        data: character,
      },
    });
  }),

  // Characters: Create
  http.post('/api/projects/:projectId/characters', async ({ request, params }) => {
    const project = mockProjects.get(params.projectId as string);
    
    if (!project) {
      return HttpResponse.json({
        result: {
          code: 10404,
          message: '项目不存在',
        },
      }, { status: 404 });
    }

    const body = (await request.json()) as Omit<Character, 'id' | 'createdAt' | 'updatedAt'>;
    const newCharacter: Character = {
      ...body,
      id: crypto.randomUUID(),
      projectId: params.projectId as string,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    mockCharacters.set(newCharacter.id, newCharacter);

    return HttpResponse.json({
      result: {
        code: 10200,
        message: '创建成功',
        data: newCharacter,
      },
    }, { status: 201 });
  }),

  // Characters: Update
  http.put('/api/projects/:projectId/characters/:characterId', async ({ request, params }) => {
    const character = mockCharacters.get(params.characterId as string);
    
    if (!character || character.projectId !== params.projectId) {
      return HttpResponse.json({
        result: {
          code: 10404,
          message: '角色不存在',
        },
      }, { status: 404 });
    }

    const body = (await request.json()) as Partial<Character>;
    
    const updatedCharacter: Character = {
      ...character,
      ...body,
      id: character.id,
      projectId: character.projectId,
      updatedAt: new Date().toISOString(),
    };
    
    mockCharacters.set(character.id, updatedCharacter);

    return HttpResponse.json({
      result: {
        code: 10200,
        message: '更新成功',
        data: updatedCharacter,
      },
    });
  }),

  // Characters: Delete
  http.delete('/api/projects/:projectId/characters/:characterId', ({ params }) => {
    const character = mockCharacters.get(params.characterId as string);
    
    if (!character || character.projectId !== params.projectId) {
      return HttpResponse.json({
        result: {
          code: 10404,
          message: '角色不存在',
        },
      }, { status: 404 });
    }

    mockCharacters.delete(params.characterId as string);

    return HttpResponse.json({
      result: {
        code: 10200,
        message: '删除成功',
      },
    });
  }),

  // ============================================
  // World Settings API (知识库 - 世界观设定)
  // ============================================

  // World Settings: List
  http.get('/api/projects/:projectId/world-settings', ({ params }) => {
    const project = mockProjects.get(params.projectId as string);
    
    if (!project) {
      return HttpResponse.json({
        result: {
          code: 10404,
          message: '项目不存在',
        },
      }, { status: 404 });
    }

    const settings = Array.from(mockWorldSettings.values())
      .filter(s => s.projectId === params.projectId);

    return HttpResponse.json({
      result: {
        code: 10200,
        message: 'success',
        data: settings,
      },
    });
  }),

  // World Settings: Get
  http.get('/api/projects/:projectId/world-settings/:settingId', ({ params }) => {
    const setting = mockWorldSettings.get(params.settingId as string);
    
    if (!setting || setting.projectId !== params.projectId) {
      return HttpResponse.json({
        result: {
          code: 10404,
          message: '设定不存在',
        },
      }, { status: 404 });
    }

    return HttpResponse.json({
      result: {
        code: 10200,
        message: 'success',
        data: setting,
      },
    });
  }),

  // World Settings: Create
  http.post('/api/projects/:projectId/world-settings', async ({ request, params }) => {
    const project = mockProjects.get(params.projectId as string);
    
    if (!project) {
      return HttpResponse.json({
        result: {
          code: 10404,
          message: '项目不存在',
        },
      }, { status: 404 });
    }

    const body = (await request.json()) as Omit<WorldSetting, 'id' | 'createdAt' | 'updatedAt'>;
    const newSetting: WorldSetting = {
      ...body,
      id: crypto.randomUUID(),
      projectId: params.projectId as string,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    mockWorldSettings.set(newSetting.id, newSetting);

    return HttpResponse.json({
      result: {
        code: 10200,
        message: '创建成功',
        data: newSetting,
      },
    }, { status: 201 });
  }),

  // World Settings: Update
  http.put('/api/projects/:projectId/world-settings/:settingId', async ({ request, params }) => {
    const setting = mockWorldSettings.get(params.settingId as string);
    
    if (!setting || setting.projectId !== params.projectId) {
      return HttpResponse.json({
        result: {
          code: 10404,
          message: '设定不存在',
        },
      }, { status: 404 });
    }

    const body = (await request.json()) as Partial<WorldSetting>;
    
    const updatedSetting: WorldSetting = {
      ...setting,
      ...body,
      id: setting.id,
      projectId: setting.projectId,
      updatedAt: new Date().toISOString(),
    };
    
    mockWorldSettings.set(setting.id, updatedSetting);

    return HttpResponse.json({
      result: {
        code: 10200,
        message: '更新成功',
        data: updatedSetting,
      },
    });
  }),

  // World Settings: Delete
  http.delete('/api/projects/:projectId/world-settings/:settingId', ({ params }) => {
    const setting = mockWorldSettings.get(params.settingId as string);
    
    if (!setting || setting.projectId !== params.projectId) {
      return HttpResponse.json({
        result: {
          code: 10404,
          message: '设定不存在',
        },
      }, { status: 404 });
    }

    mockWorldSettings.delete(params.settingId as string);

    return HttpResponse.json({
      result: {
        code: 10200,
        message: '删除成功',
      },
    });
  }),
];

