import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

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

    const worldSettings = await prisma.worldSetting.findMany({
      where: { projectId },
      orderBy: { updatedAt: 'desc' },
    });

    const formattedSettings = worldSettings.map((setting) => {
      let properties = {};
      let relations = [];

      try {
        if (setting.properties) properties = JSON.parse(setting.properties);
      } catch (e) {
        console.warn(`Failed to parse properties for world setting ${setting.id}`, e);
      }

      try {
        if (setting.relations) relations = JSON.parse(setting.relations);
      } catch (e) {
        console.warn(`Failed to parse relations for world setting ${setting.id}`, e);
      }

      return {
        id: setting.id,
        projectId: setting.projectId,
        title: setting.name, // Mapping DB 'name' to 'title' 
        category: setting.category,
        content: setting.description || '', // Mapping DB 'description' to 'content'
        properties,
        relations,
        type: setting.type,
        version: setting.version,
        createdAt: setting.createdAt.toISOString(),
        updatedAt: setting.updatedAt.toISOString(),
      };
    });

    return NextResponse.json({
      result: {
        code: 10200,
        message: 'success',
        data: {
          worldSettings: formattedSettings,
        },
      },
    });
  } catch (error) {
    console.error('Failed to fetch world settings:', error);
    return NextResponse.json(
      {
        result: {
          code: 10500,
          message: '获取世界观设定列表失败',
        },
      },
      { status: 500 }
    );
  }
}
