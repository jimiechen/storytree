import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/projects/:id
 * 获取单个项目详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        chapters: {
          orderBy: [
            { volumeNumber: 'asc' },
            { chapterNumber: 'asc' },
          ],
          select: {
            id: true,
            title: true,
            volumeNumber: true,
            chapterNumber: true,
            wordCount: true,
            status: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        {
          result: {
            code: 10404,
            message: '项目不存在',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      result: {
        code: 10200,
        message: 'success',
        data: {
          id: project.id,
          name: project.name,
          description: project.description || '',
          genre: project.genre || '',
          status: project.status,
          currentWordCount: project.currentWordCount,
          targetWordCount: project.targetWordCount,
          chapters: project.chapters.map(chapter => ({
            id: chapter.id,
            title: chapter.title,
            order: chapter.chapterNumber,
            wordCount: chapter.wordCount,
            status: chapter.status,
            updatedAt: chapter.updatedAt.toISOString(),
          })),
          createdAt: project.createdAt.toISOString(),
          updatedAt: project.updatedAt.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Failed to fetch project:', error);
    return NextResponse.json(
      {
        result: {
          code: 10500,
          message: '获取项目详情失败',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/projects/:id
 * 更新项目
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, genre, targetWordCount, status } = body;

    // 检查项目是否存在
    const existingProject = await prisma.project.findUnique({
      where: { id },
    });

    if (!existingProject) {
      return NextResponse.json(
        {
          result: {
            code: 10404,
            message: '项目不存在',
          },
        },
        { status: 404 }
      );
    }

    // 验证名称
    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
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

    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(genre !== undefined && { genre: genre?.trim() || null }),
        ...(targetWordCount !== undefined && { targetWordCount: targetWordCount || null }),
        ...(status !== undefined && { status }),
      },
      include: {
        _count: {
          select: {
            chapters: true,
          },
        },
      },
    });

    return NextResponse.json({
      result: {
        code: 10200,
        message: '更新成功',
        data: {
          id: updatedProject.id,
          name: updatedProject.name,
          description: updatedProject.description || '',
          genre: updatedProject.genre || '',
          status: updatedProject.status,
          currentWordCount: updatedProject.currentWordCount,
          targetWordCount: updatedProject.targetWordCount,
          chapterCount: updatedProject._count.chapters,
          createdAt: updatedProject.createdAt.toISOString(),
          updatedAt: updatedProject.updatedAt.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Failed to update project:', error);
    return NextResponse.json(
      {
        result: {
          code: 10500,
          message: '更新项目失败',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/projects/:id
 * 删除项目
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 检查项目是否存在
    const existingProject = await prisma.project.findUnique({
      where: { id },
    });

    if (!existingProject) {
      return NextResponse.json(
        {
          result: {
            code: 10404,
            message: '项目不存在',
          },
        },
        { status: 404 }
      );
    }

    await prisma.project.delete({
      where: { id },
    });

    return NextResponse.json({
      result: {
        code: 10200,
        message: '删除成功',
      },
    });
  } catch (error) {
    console.error('Failed to delete project:', error);
    return NextResponse.json(
      {
        result: {
          code: 10500,
          message: '删除项目失败',
        },
      },
      { status: 500 }
    );
  }
}
