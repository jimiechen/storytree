'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateUsername = (username: string): boolean => {
    return username.length >= 3 && username.length <= 50;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 表单验证
    if (!username) {
      setError('用户名不能为空');
      return;
    }

    if (!validateUsername(username)) {
      setError('用户名长度必须在 3-50 个字符之间');
      return;
    }

    if (!validateEmail(email)) {
      setError('邮箱格式无效');
      return;
    }

    if (!password) {
      setError('密码不能为空');
      return;
    }

    if (password.length < 8) {
      setError('密码至少 8 位');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post<{ userId: string; email: string; username: string }>(
        '/api/auth/register',
        { username, email, password }
      );

      // 注册成功，跳转到登录页
      router.push('/login');
    } catch (err: any) {
      if (err.message?.includes('邮箱已被注册')) {
        setError('该邮箱已被注册');
      } else if (err.message?.includes('用户名已被使用')) {
        setError('该用户名已被使用');
      } else {
        setError('注册失败，请稍后重试');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            注册
          </h2>
        </div>

        {error && <Alert>{error}</Alert>}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <Input
            label="用户名"
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="请输入用户名"
            error={error && !username ? '用户名不能为空' : undefined}
          />

          <Input
            label="邮箱"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="请输入邮箱"
            error={error && !validateEmail(email) ? '邮箱格式无效' : undefined}
          />

          <Input
            label="密码"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="请输入密码（至少8位）"
            error={error && password.length < 8 ? '密码至少 8 位' : undefined}
          />

          <Button
            type="submit"
            loading={loading}
            className="w-full"
          >
            注册
          </Button>
        </form>

        <div className="text-center">
          <a href="/login" className="text-sm text-indigo-600 hover:text-indigo-500">
            已有账号？立即登录
          </a>
        </div>
      </div>
    </div>
  );
}
