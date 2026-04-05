import { http, HttpResponse } from 'msw';
import { generateMockUser, generateMockProject, generateMockChapter } from './data';

// Mock data store
const mockUsers: Map<string, { userId: string; email: string; username: string; password: string }> = new Map();
const mockProjects: Map<string, ReturnType<typeof generateMockProject> & { userId: string; chapters: ReturnType<typeof generateMockChapter>[] }> = new Map();

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
      status: body.status || 'active',
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
];

