'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { CreateProjectModal } from '@/components/projects/CreateProjectModal';

interface Project {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'draft' | 'completed';
  chapterCount: number;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      setFilteredProjects(
        projects.filter(project =>
          project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          project.description.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredProjects(projects);
    }
  }, [searchTerm, projects]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await api.get<Project[]>('/api/projects');
      const projectsList = Array.isArray(response) ? response : ((response as any).projects || []);
      setProjects(projectsList);
      setFilteredProjects(projectsList);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      setProjects([]);
      setFilteredProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectClick = (projectId: string) => {
    router.push(`/workbench/${projectId}`);
  };

  const handleNewProject = () => {
    setIsModalOpen(true);
  };

  const handleProjectCreated = () => {
    // 重新获取项目列表
    fetchProjects();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载项目中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">我的项目</h1>
            <p className="mt-2 text-gray-600">管理和编辑你的写作项目</p>
          </div>
          <Button onClick={handleNewProject}>
            新建项目
          </Button>
        </div>

        <div className="mb-6">
          <Input
            type="text"
            placeholder="搜索项目"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md"
          />
        </div>

        {filteredProjects.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center empty-state">
            <h3 className="text-xl font-medium text-gray-900">暂无项目</h3>
            <p className="mt-2 text-gray-600">你还没有创建任何项目</p>
            <Button onClick={handleNewProject} className="mt-4">
              创建第一个项目
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 project-list">
            {filteredProjects.map((project) => (
              <ProjectCard 
                key={project.id} 
                project={project} 
                onClick={handleProjectClick} 
              />
            ))}
          </div>
        )}

        <CreateProjectModal
          isOpen={isModalOpen}
          onOpenChange={setIsModalOpen}
          onProjectCreated={handleProjectCreated}
        />
      </div>
    </div>
  );
}
