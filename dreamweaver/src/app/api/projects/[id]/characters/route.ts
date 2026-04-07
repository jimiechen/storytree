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

    const characters = await prisma.character.findMany({
      where: { projectId },
      orderBy: { updatedAt: 'desc' },
    });

    // 解析 JSON 字段
    const formattedCharacters = characters.map((char) => {
      let profile = {};
      let relationships = [];
      let aliases = [];
      let tags = [];

      try {
        if (char.profile) profile = JSON.parse(char.profile);
      } catch (e) {
        console.warn(`Failed to parse profile for character ${char.id}`, e);
      }

      try {
        if (char.relationships) relationships = JSON.parse(char.relationships);
      } catch (e) {
        console.warn(`Failed to parse relationships for character ${char.id}`, e);
      }

      try {
        if (char.aliases) aliases = JSON.parse(char.aliases);
      } catch (e) {
        console.warn(`Failed to parse aliases for character ${char.id}`, e);
      }

      // Default tags extraction or placeholder logic if tags isn't in DB schema directly
      try {
        // Just extract tags from profile if they exist
        if ((profile as any).tags) {
          tags = (profile as any).tags;
        }
      } catch (e) {}

      return {
        id: char.id,
        projectId: char.projectId,
        name: char.name,
        aliases: aliases,
        roleType: char.roleType,
        profile: profile,
        relationships: relationships,
        wordCount: char.wordCount,
        createdAt: char.createdAt.toISOString(),
        updatedAt: char.updatedAt.toISOString(),
      };
    });

    return NextResponse.json({
      result: {
        code: 10200,
        message: 'success',
        data: {
          characters: formattedCharacters,
        },
      },
    });
  } catch (error) {
    console.error('Failed to fetch characters:', error);
    return NextResponse.json(
      {
        result: {
          code: 10500,
          message: '获取角色列表失败',
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const body = await request.json();
    const { name, aliases, roleType, profile, relationships } = body;

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

    const newCharacter = await prisma.character.create({
      data: {
        projectId,
        name,
        aliases: aliases ? JSON.stringify(aliases) : null,
        roleType: roleType || 'other',
        profile: profile ? JSON.stringify(profile) : null,
        relationships: relationships ? JSON.stringify(relationships) : null,
        wordCount: 0,
      },
    });

    return NextResponse.json(
      {
        result: {
          code: 10200,
          message: 'success',
          data: newCharacter,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to create character:', error);
    return NextResponse.json(
      {
        result: {
          code: 10500,
          message: '创建角色失败',
        },
      },
      { status: 500 }
    );
  }
}
