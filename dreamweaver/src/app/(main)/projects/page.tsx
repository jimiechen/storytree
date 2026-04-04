'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';

interface Project {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get<Project[]>('/api/projects');
      setProjects(response);
    } catch (err: any) {
      setError('获取项目列表失败');
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(project =>
    project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateProject = () => {
    router.push('/projects/create');
  };

  const handleProjectClick = (projectId: string) => {
    router.push(`/workbench/${projectId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">项目列表</h1>
            <p className="mt-2 text-sm text-gray-600">管理您的小说写作项目</p>
          </div>
          <Button onClick={handleCreateProject} className="mt-4 md:mt-0">
            新建项目
          </Button>
        </div>

        <div className="mb-6">
          <Input
            type="search"
            placeholder="搜索项目..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-96"
          />
        </div>

        {error && <Alert>{error}</Alert>}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">加载中...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-400 mb-4">📝</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">暂无项目</h3>
            <p className="text-gray-600 mb-6">开始创建您的第一个小说写作项目</p>
            <Button onClick={handleCreateProject}>
              创建第一个项目
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="project-card bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer p-6"
                onClick={() => handleProjectClick(project.id)}
              >
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {project.title}
                </h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {project.description}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>创建于: {new Date(project.createdAt).toLocaleDateString()}</span>
                  <span>更新于: {new Date(project.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
