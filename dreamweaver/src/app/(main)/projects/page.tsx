'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { CreateProjectModal } from '@/components/projects/CreateProjectModal';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { StatsCard } from '@/components/projects/StatsCard';
import { TemplateCard } from '@/components/projects/TemplateCard';

interface Project {
  id: string;
  name: string;
  description: string;
  genre: string;
  status: 'draft' | 'writing' | 'completed' | 'published';
  currentWordCount: number;
  targetWordCount: number | null;
  chapterCount: number;
  createdAt: string;
  updatedAt: string;
}

const templates = [
  { id: 'xianxia', name: '仙侠', nameEn: 'Cultivation & Immortals', icon: 'swords', color: 'primary' as const },
  { id: 'urban', name: '都市', nameEn: 'Urban Legends', icon: 'apartment', color: 'secondary' as const },
  { id: 'mystery', name: '悬疑', nameEn: 'Mystery & Noir', icon: 'search_check', color: 'error' as const },
  { id: 'scifi', name: '科幻', nameEn: 'Futuristic Worlds', icon: 'rocket_launch', color: 'tertiary' as const },
];

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
          (project.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (project.description || '').toLowerCase().includes(searchTerm.toLowerCase())
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
      const projectsList = Array.isArray(response) ? response : [];
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
    fetchProjects();
  };

  const totalWordCount = projects.reduce((sum, p) => sum + (p.currentWordCount || 0), 0);
  const activeProjects = projects.filter(p => p.status === 'writing').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-on-surface-variant">加载项目中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <header className="h-16 flex items-center justify-between px-8 bg-surface/80 backdrop-blur-xl sticky top-0 z-40 border-b border-outline-variant/10">
        <div className="flex items-center gap-8">
          <div className="flex flex-col">
            <h1 className="font-serif text-2xl font-bold text-primary leading-none">织梦笔</h1>
            <span className="text-[10px] text-primary/60 tracking-wider font-medium mt-1">AI 驱动的长篇小说创作平台</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-500">
              <span className="material-symbols-outlined text-lg">search</span>
            </span>
            <input
              className="bg-surface-container-highest/50 border-none rounded-full pl-10 pr-4 py-1.5 text-sm focus:ring-1 focus:ring-primary/40 w-64 transition-all"
              placeholder="搜索项目..."
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="text-slate-400 hover:text-primary transition-all p-2">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="w-8 h-8 rounded-full bg-surface-container-highest overflow-hidden border border-outline-variant/30">
            <img alt="Profile" className="w-full h-full object-cover" src="/avatar.png" />
          </button>
        </div>
      </header>

      <div className="flex-1 p-10 space-y-12 max-w-7xl mx-auto w-full">
        {/* Dashboard Top Grid */}
        <div className="grid grid-cols-12 gap-10">
          {/* Center-Left: Recent Works */}
          <section className="col-span-12 lg:col-span-5 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl font-bold tracking-tight">最近作品</h2>
              <button className="text-primary text-xs font-semibold hover:underline" onClick={() => router.push('/projects/all')}>
                查看全部
              </button>
            </div>
            <div className="space-y-4">
              {filteredProjects.slice(0, 3).map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={() => handleProjectClick(project.id)}
                />
              ))}
              {filteredProjects.length === 0 && (
                <div className="bg-surface-container rounded-lg p-8 text-center border border-outline-variant/20">
                  <p className="text-slate-400">暂无项目</p>
                  <button
                    onClick={handleNewProject}
                    className="mt-4 text-primary text-sm font-medium hover:underline"
                  >
                    创建第一个项目
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Center-Right: Quick Start */}
          <section className="col-span-12 lg:col-span-7 space-y-8">
            <div className="grid grid-cols-2 gap-6">
              <div
                onClick={handleNewProject}
                className="col-span-2 md:col-span-1 h-44 bg-gradient-to-br from-surface-container to-surface-container-high rounded-xl p-6 flex flex-col justify-between border border-primary/10 hover:border-primary/40 transition-all group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-primary text-3xl">add</span>
                </div>
                <div>
                  <h3 className="font-serif text-xl font-bold">新建作品</h3>
                  <p className="text-xs text-slate-400 mt-1">开始你的杰作，AI 全程辅助。</p>
                </div>
              </div>
              <div
                onClick={() => router.push('/world-forge')}
                className="col-span-2 md:col-span-1 h-44 bg-surface-container rounded-xl p-6 flex flex-col justify-between border border-outline-variant/20 hover:bg-surface-container-high transition-all cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center">
                  <span className="material-symbols-outlined text-slate-400 text-3xl">grid_view</span>
                </div>
                <div>
                  <h3 className="font-serif text-xl font-bold">世界构建</h3>
                  <p className="text-xs text-slate-400 mt-1">定义角色、传说和地理。</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">写作模板</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {templates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onClick={() => handleNewProject()}
                  />
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Bottom: Writing Stats Dashboard */}
        <section className="bg-surface-container-low/50 rounded-2xl p-8 space-y-8 relative overflow-hidden">
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-2 rounded-lg">
                <span className="material-symbols-outlined text-primary">analytics</span>
              </div>
              <div>
                <h2 className="font-serif text-xl font-bold">写作洞察</h2>
                <p className="text-xs text-slate-500">进度追踪与成就统计</p>
              </div>
            </div>
            <div className="flex gap-10">
              <div className="text-center">
                <span className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold">总作品数</span>
                <span className="font-serif text-2xl font-bold text-primary">{projects.length}</span>
              </div>
              <div className="text-center">
                <span className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold">总字数</span>
                <span className="font-serif text-2xl font-bold text-secondary">{(totalWordCount / 1000).toFixed(1)}k</span>
              </div>
              <div className="text-center">
                <span className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold">进行中</span>
                <span className="font-serif text-2xl font-bold text-tertiary">{activeProjects}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative z-10">
            {/* Daily Word Count Bar Chart */}
            <div className="md:col-span-2 space-y-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">每日字数（最近7天）</span>
              <div className="h-48 flex items-end justify-between gap-4 px-2">
                {['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map((day, index) => {
                  const heights = ['40%', '65%', '50%', '90%', '30%', '75%', '45%'];
                  const isMax = heights[index] === '90%';
                  return (
                    <div key={day} className="w-full flex flex-col items-center gap-2">
                      <div
                        className={`w-full rounded-t-sm transition-all ${
                          isMax
                            ? 'bg-primary/60 border-t-2 border-primary shadow-[0_-10px_20px_-10px_rgba(117,209,255,0.4)]'
                            : 'bg-surface-container-highest'
                        }`}
                        style={{ height: heights[index] }}
                      ></div>
                      <span className={`text-[10px] ${isMax ? 'text-primary font-bold' : 'text-slate-500'}`}>
                        {day}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Trend / Next Goal */}
            <div className="bg-surface-container rounded-xl p-6 flex flex-col justify-center gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">创作动力</span>
                <h4 className="font-serif text-lg font-bold">等级 12: 织梦者</h4>
              </div>
              <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-secondary to-orange-400 h-full w-[72%]"></div>
              </div>
              <p className="text-[10px] text-slate-500">距离下一等级还需 840 字。保持创作！</p>
              <button className="mt-2 flex items-center justify-center gap-2 border border-outline-variant py-2 rounded text-[10px] font-bold uppercase tracking-widest hover:bg-surface-container-highest transition-all">
                <span className="material-symbols-outlined text-sm">emoji_events</span>
                成就
              </button>
            </div>
          </div>
        </section>
      </div>

      <CreateProjectModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        onProjectCreated={handleProjectCreated}
      />
    </div>
  );
}
