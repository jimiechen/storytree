import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, password, username } = await request.json();

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({
        result: {
          code: 10409,
          message: '邮箱已被注册',
        },
      }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        nickname: username,
      },
    });

    return NextResponse.json({
      result: {
        code: 10200,
        message: '注册成功',
        data: {
          userId: user.id,
          email: user.email,
          username: user.nickname || '',
          token: `mock-jwt-token-${user.id}`,
        },
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({
      result: {
        code: 10500,
        message: '服务器错误',
      },
    }, { status: 500 });
  }
}
