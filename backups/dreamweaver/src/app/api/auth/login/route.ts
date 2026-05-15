import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({
        result: {
          code: 10401,
          message: '邮箱或密码错误',
        },
      }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      return NextResponse.json({
        result: {
          code: 10401,
          message: '邮箱或密码错误',
        },
      }, { status: 401 });
    }

    return NextResponse.json({
      result: {
        code: 10200,
        message: '登录成功',
        data: {
          userId: user.id,
          email: user.email,
          username: user.nickname || '',
          token: `mock-jwt-token-${user.id}`, // Simplified for now
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({
      result: {
        code: 10500,
        message: '服务器错误',
      },
    }, { status: 500 });
  }
}
