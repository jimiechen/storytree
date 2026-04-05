import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { prisma } from './db';

/**
 * 用户会话信息
 */
export interface Session {
  userId: string;
  email: string;
  username: string;
}

/**
 * 从请求中获取会话信息
 * 支持 Cookie 和 Authorization Header 两种方式
 */
export async function getSession(request?: NextRequest): Promise<Session | null> {
  try {
    let token: string | undefined;

    if (request) {
      // 从请求头中获取
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }

      // 从 Cookie 中获取
      if (!token) {
        const cookieStore = await cookies();
        token = cookieStore.get('auth-token')?.value;
      }
    } else {
      // 从 Cookie 中获取
      const cookieStore = await cookies();
      token = cookieStore.get('auth-token')?.value;
    }

    if (!token) {
      return null;
    }

    // 验证 token 格式 (mock JWT 验证)
    // 实际项目中应该使用 jsonwebtoken 库验证
    const session = verifyToken(token);
    return session;
  } catch (error) {
    console.error('Failed to get session:', error);
    return null;
  }
}

/**
 * 验证 JWT Token
 * 注意：这是一个简化实现，实际项目应使用 jsonwebtoken 库
 */
export function verifyToken(token: string): Session | null {
  try {
    // 检查是否是 mock token
    if (token.startsWith('mock-jwt-token-')) {
      const userId = token.replace('mock-jwt-token-', '');
      return {
        userId,
        email: 'user@example.com',
        username: 'user',
      };
    }

    // 尝试解析 base64 编码的 token (简化实现)
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    // 检查 token 是否过期
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return null;
    }

    return {
      userId: payload.sub,
      email: payload.email,
      username: payload.username,
    };
  } catch (error) {
    console.error('Failed to verify token:', error);
    return null;
  }
}

/**
 * 生成 JWT Token
 * 注意：这是一个简化实现，实际项目应使用 jsonwebtoken 库
 */
export function generateToken(payload: {
  userId: string;
  email: string;
  username: string;
}): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(
    JSON.stringify({
      sub: payload.userId,
      email: payload.email,
      username: payload.username,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 天过期
    })
  ).toString('base64url');
  
  // 简化签名，实际项目应使用密钥签名
  const signature = Buffer.from('mock-signature').toString('base64url');
  
  return `${header}.${body}.${signature}`;
}

/**
 * 设置认证 Cookie
 */
export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 天
    path: '/',
  });
}

/**
 * 清除认证 Cookie
 */
export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('auth-token');
}

/**
 * 验证用户是否已认证
 * 用于 API 路由保护
 */
export async function requireAuth(request?: NextRequest): Promise<Session> {
  const session = await getSession(request);
  
  if (!session) {
    throw new AuthError('未登录或登录已过期', 401);
  }
  
  return session;
}

/**
 * 认证错误类
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number = 401
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * 检查是否使用 Mock API
 */
export function isMockApiEnabled(): boolean {
  return process.env.NEXT_PUBLIC_USE_MOCK_API === 'true';
}
