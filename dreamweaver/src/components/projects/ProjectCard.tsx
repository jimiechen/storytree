'use client';

import { useRouter } from 'next/navigation';

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

interface ProjectCardProps {
  project: Project;
  onClick?: (projectId: string) => void;
}

const statusMap = {
  draft: { label: '草稿', color: 'bg-surface-container-highest text-slate-400' },
  writing: { label: '连载中', color: 'bg-primary-container text-primary' },
  completed: { label: '已完成', color: 'bg-tertiary-container text-tertiary' },
  published: { label: '已发布', color: 'bg-secondary-container/20 text-secondary' },
};

const genreIcons: Record<string, string> = {
  '仙侠': 'swords',
  '都市': 'apartment',
  '悬疑': 'search_check',
  '科幻': 'rocket_launch',
  '奇幻': 'auto_awesome',
  '历史': 'history',
  '言情': 'favorite',
  '默认': 'book',
};

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const router = useRouter();
  const status = statusMap[project.status];
  const genreIcon = genreIcons[project.genre] || genreIcons['默认'];

  const handleClick = () => {
    if (onClick) {
      onClick(project.id);
    } else {
      router.push(`/workbench/${project.id}`);
    }
  };

  const handleContinue = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/workbench/${project.id}`);
  };

  // 计算最后编辑时间
  const getLastEdited = () => {
    const updated = new Date(project.updatedAt);
    const now = new Date();
    const diff = now.getTime() - updated.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return '刚刚';
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return updated.toLocaleDateString('zh-CN');
  };

  return (
    <div
      onClick={handleClick}
      className="project-card bg-surface-container border-l-4 border-primary rounded-lg p-5 flex items-start gap-5 hover:bg-surface-container-high transition-all group cursor-pointer"
    >
      {/* Cover */}
      <div className="w-20 h-28 flex-shrink-0 bg-surface-container-highest rounded overflow-hidden relative shadow-lg">
        <div className="w-full h-full bg-gradient-to-br from-surface-container-high to-surface-container-highest flex items-center justify-center">
          <span className="material-symbols-outlined text-4xl text-surface-variant">
            {genreIcon}
          </span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-2">
        <div className="flex justify-between items-start">
          <h3 className="font-serif text-lg font-bold">{project.name}</h3>
          <span className={`${status?.color || ''} text-[10px] px-2 py-0.5 rounded-full font-bold`}>
            {status?.label || ''}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-on-surface-variant font-medium">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">category</span>
            {project.genre || '未分类'}
          </span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">description</span>
            {project.currentWordCount?.toLocaleString() || '0'} 字
          </span>
        </div>

        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
          <span className="material-symbols-outlined text-xs">schedule</span>
          最后编辑 {getLastEdited()}
        </div>

        {project.status === 'writing' && (
          <div className="pt-2 flex gap-2">
            <button
              onClick={handleContinue}
              className="bg-primary/10 hover:bg-primary/20 text-primary text-[10px] px-3 py-1 rounded transition-colors font-bold tracking-wider"
            >
              继续写作
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
