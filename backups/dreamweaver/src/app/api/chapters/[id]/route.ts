import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/chapters/:id
 * 获取单个章节详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const chapter = await prisma.chapter.findUnique({
      where: { id },
    });

    if (!chapter) {
      return NextResponse.json(
        {
          result: {
            code: 10404,
            message: '章节不存在',
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
    });
  } catch (error) {
    console.error('Failed to fetch chapter:', error);
    return NextResponse.json(
      {
        result: {
          code: 10500,
          message: '获取章节详情失败',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/chapters/:id
 * 更新章节
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, content, status } = body;

    // 获取原章节信息
    const existingChapter = await prisma.chapter.findUnique({
      where: { id },
    });

    if (!existingChapter) {
      return NextResponse.json(
        {
          result: {
            code: 10404,
            message: '章节不存在',
          },
        },
        { status: 404 }
      );
    }

    // 验证标题
    if (title !== undefined && (typeof title !== 'string' || title.trim().length === 0)) {
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

    // 计算字数变化
    const oldWordCount = existingChapter.wordCount;
    const newWordCount = content !== undefined ? content.length : oldWordCount;
    const wordCountDiff = newWordCount - oldWordCount;

    const updatedChapter = await prisma.chapter.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(content !== undefined && { content }),
        ...(status !== undefined && { status }),
        wordCount: newWordCount,
      },
    });

    // 更新项目字数统计
    if (wordCountDiff !== 0) {
      await prisma.project.update({
        where: { id: existingChapter.projectId },
        data: {
          currentWordCount: {
            increment: wordCountDiff,
          },
        },
      });
    }

    return NextResponse.json({
      result: {
        code: 10200,
        message: '更新成功',
        data: {
          id: updatedChapter.id,
          title: updatedChapter.title,
          content: updatedChapter.content || '',
          order: updatedChapter.chapterNumber,
          wordCount: updatedChapter.wordCount,
          status: updatedChapter.status,
          createdAt: updatedChapter.createdAt.toISOString(),
          updatedAt: updatedChapter.updatedAt.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Failed to update chapter:', error);
    return NextResponse.json(
      {
        result: {
          code: 10500,
          message: '更新章节失败',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/chapters/:id
 * 删除章节
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 获取原章节信息
    const existingChapter = await prisma.chapter.findUnique({
      where: { id },
    });

    if (!existingChapter) {
      return NextResponse.json(
        {
          result: {
            code: 10404,
            message: '章节不存在',
          },
        },
        { status: 404 }
      );
    }

    const wordCount = existingChapter.wordCount;
    const projectId = existingChapter.projectId;

    await prisma.chapter.delete({
      where: { id },
    });

    // 更新项目字数统计
    await prisma.project.update({
      where: { id: projectId },
      data: {
        currentWordCount: {
          decrement: wordCount,
        },
      },
    });

    return NextResponse.json({
      result: {
        code: 10200,
        message: '删除成功',
      },
    });
  } catch (error) {
    console.error('Failed to delete chapter:', error);
    return NextResponse.json(
      {
        result: {
          code: 10500,
          message: '删除章节失败',
        },
      },
      { status: 500 }
    );
  }
}
