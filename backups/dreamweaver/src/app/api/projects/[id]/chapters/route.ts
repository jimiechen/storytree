import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/projects/:projectId/chapters
 * 获取项目下的章节列表
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    // 检查项目是否存在
    const project = await prisma.project.findUnique({
      where: { id: projectId },
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

    const chapters = await prisma.chapter.findMany({
      where: { projectId },
      orderBy: [
        { volumeNumber: 'asc' },
        { chapterNumber: 'asc' },
      ],
      select: {
        id: true,
        title: true,
        content: true,
        volumeNumber: true,
        chapterNumber: true,
        wordCount: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const formattedChapters = chapters.map(chapter => ({
      id: chapter.id,
      title: chapter.title,
      content: chapter.content || '',
      order: chapter.chapterNumber,
      wordCount: chapter.wordCount,
      status: chapter.status,
      createdAt: chapter.createdAt.toISOString(),
      updatedAt: chapter.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      result: {
        code: 10200,
        message: 'success',
        data: {
          chapters: formattedChapters,
        },
      },
    });
  } catch (error) {
    console.error('Failed to fetch chapters:', error);
    return NextResponse.json(
      {
        result: {
          code: 10500,
          message: '获取章节列表失败',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects/:projectId/chapters
 * 创建新章节
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const body = await request.json();
    const { title, content, volumeNumber, chapterNumber } = body;

    // 检查项目是否存在
    const project = await prisma.project.findUnique({
      where: { id: projectId },
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

    // 验证标题
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        {
          result: {
            code: 10400,
            message: '章节标题不能为空',
          },
        },
        { status: 400 }
      );
    }

    // 计算字数
    const wordCount = content?.length || 0;

    // 获取当前最大章节号
    const lastChapter = await prisma.chapter.findFirst({
      where: { projectId },
      orderBy: { chapterNumber: 'desc' },
    });

    const newChapterNumber = chapterNumber || (lastChapter?.chapterNumber || 0) + 1;
    const newVolumeNumber = volumeNumber || lastChapter?.volumeNumber || 1;

    const chapter = await prisma.chapter.create({
      data: {
        title: title.trim(),
        content: content || '',
        projectId,
        volumeNumber: newVolumeNumber,
        chapterNumber: newChapterNumber,
        wordCount,
        status: 'draft',
      },
    });

    // 更新项目字数统计
    await prisma.project.update({
      where: { id: projectId },
      data: {
        currentWordCount: {
          increment: wordCount,
        },
      },
    });

    return NextResponse.json(
      {
        result: {
          code: 10200,
          message: '创建成功',
          data: {
            id: chapter.id,
            title: chapter.title,
            content: chapter.content || '',
            order: chapter.chapterNumber,
            wordCount: chapter.wordCount,
            status: chapter.status,
            createdAt: chapter.createdAt.toISOString(),
            updatedAt: chapter.updatedAt.toISOString(),
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to create chapter:', error);
    return NextResponse.json(
      {
        result: {
          code: 10500,
          message: '创建章节失败',
        },
      },
      { status: 500 }
    );
  }
}
