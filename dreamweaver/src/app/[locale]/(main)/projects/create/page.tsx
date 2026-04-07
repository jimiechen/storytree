'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Form } from '@/components/ui/Form';

export default function CreateProjectPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateForm = (): boolean => {
    if (!title.trim()) {
      setError('项目标题不能为空');
      return false;
    }

    if (title.length > 100) {
      setError('项目标题不能超过 100 个字符');
      return false;
    }

    if (description.length > 1000) {
      setError('项目描述不能超过 1000 个字符');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await api.post<{
        id: string;
        title: string;
        description: string;
        createdAt: string;
        updatedAt: string;
      }>('/api/projects', {
        title,
        description
      });

      // 创建成功，跳转到项目列表
      router.push('/projects');
    } catch (err: any) {
      setError('创建项目失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/projects');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">新建项目</h1>
            <p className="mt-2 text-sm text-gray-600">创建一个新的小说写作项目</p>
          </div>

          {error && <Alert>{error}</Alert>}

          <Form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <Input
                label="项目标题"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="请输入项目标题"
                error={error && !title ? '项目标题不能为空' : undefined}
                className="w-full"
              />

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  项目描述
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="请输入项目描述（可选）"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  rows={4}
                  maxLength={1000}
                />
                <p className="mt-1 text-xs text-gray-500">
                  {description.length}/1000
                </p>
              </div>

              <div className="flex space-x-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCancel}
                  className="flex-1"
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  loading={loading}
                  className="flex-1"
                >
                  创建项目
                </Button>
              </div>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}
