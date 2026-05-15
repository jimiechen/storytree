import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession, isMockApiEnabled } from '@/lib/auth';

/**
 * GET /api/projects
 * 获取项目列表
 */
export async function GET(request: NextRequest) {
  try {
    // 检查认证（仅在非 Mock 模式下）
    if (!isMockApiEnabled()) {
      const session = await getSession(request);
      if (!session) {
        return NextResponse.json(
          {
            result: {
              code: 10401,
              message: '未登录或登录已过期',
            },
          },
          { status: 401 }
        );
      }
    }

    const projects = await prisma.project.findMany({
      orderBy: {
        updatedAt: 'desc',
      },
      include: {
        _count: {
          select: {
            chapters: true,
          },
        },
      },
    });

    const formattedProjects = projects.map(project => ({
      id: project.id,
      name: project.name,
      description: project.description || '',
      genre: project.genre || '',
      status: project.status,
      currentWordCount: project.currentWordCount,
      targetWordCount: project.targetWordCount,
      chapterCount: project._count.chapters,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      result: {
        code: 10200,
        message: 'success',
        data: formattedProjects,
      },
    });
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    return NextResponse.json(
      {
        result: {
          code: 10500,
          message: '获取项目列表失败',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects
 * 创建新项目
 */
export async function POST(request: NextRequest) {
  try {
    // 检查认证（仅在非 Mock 模式下）
    let userId = '550e8400-e29b-41d4-a716-446655440000'; // 默认 mock user
    
    if (!isMockApiEnabled()) {
      const session = await getSession(request);
      if (!session) {
        return NextResponse.json(
          {
            result: {
              code: 10401,
              message: '未登录或登录已过期',
            },
          },
          { status: 401 }
        );
      }
      userId = session.userId;
    }

    const body = await request.json();
    const { name, description, genre, targetWordCount } = body;

    // 验证必填字段
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        {
          result: {
            code: 10400,
            message: '项目名称不能为空',
          },
        },
        { status: 400 }
      );
    }

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        genre: genre?.trim() || null,
        targetWordCount: targetWordCount || null,
        userId: userId,
        status: 'draft',
        currentWordCount: 0,
      },
    });

    return NextResponse.json(
      {
        result: {
          code: 10200,
          message: '创建成功',
          data: {
            id: project.id,
            name: project.name,
            description: project.description || '',
            genre: project.genre || '',
            status: project.status,
            currentWordCount: project.currentWordCount,
            targetWordCount: project.targetWordCount,
            chapterCount: 0,
            createdAt: project.createdAt.toISOString(),
            updatedAt: project.updatedAt.toISOString(),
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to create project:', error);
    return NextResponse.json(
      {
        result: {
          code: 10500,
          message: '创建项目失败',
        },
      },
      { status: 500 }
    );
  }
}
