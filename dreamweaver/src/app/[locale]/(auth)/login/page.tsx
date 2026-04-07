'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

interface LoginResponse {
  userId: string;
  email: string;
  username: string;
  token: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const saveAuthData = (userData: LoginResponse) => {
  localStorage.setItem('token', userData.token);
  localStorage.setItem('user', JSON.stringify(userData));
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!email) {
      newErrors.email = '邮箱不能为空';
    } else if (!validateEmail(email)) {
      newErrors.email = '邮箱格式无效';
    }

    if (!password) {
      newErrors.password = '密码不能为空';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      console.log('Login attempt with:', { email, password });
      const response = await api.post<LoginResponse>(
        '/api/auth/login',
        { email, password }
      );
      console.log('Login response:', response);

      saveAuthData(response);
      console.log('Auth data saved, redirecting to /projects');
      router.push('/projects');
    } catch (err) {
      console.error('Login error:', err);
      setErrors({ general: '邮箱或密码错误' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            登录
          </h2>
        </div>

        {errors.general && <Alert>{errors.general}</Alert>}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
          <Input
            label="邮箱"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="请输入邮箱"
            error={errors.email}
          />

          <Input
            label="密码"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="请输入密码"
            error={errors.password}
          />

          <Button
            type="submit"
            loading={loading}
            className="w-full"
          >
            登录
          </Button>
        </form>

        <div className="text-center">
          <a href="/register" className="text-sm text-indigo-600 hover:text-indigo-500">
            还没有账号？立即注册
          </a>
        </div>
      </div>
    </div>
  );
}
