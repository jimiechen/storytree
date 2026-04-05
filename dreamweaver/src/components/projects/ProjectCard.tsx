import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

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

interface ProjectCardProps {
  project: Project;
  onClick: (projectId: string) => void;
}

import Link from 'next/link';

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const getStatusBadge = (status: Project['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">进行中</Badge>;
      case 'draft':
        return <Badge variant="secondary">草稿</Badge>;
      case 'completed':
        return <Badge variant="outline">已完成</Badge>;
      default:
        return null;
    }
  };

  return (
    <Link href={`/workbench/${project.id}`} className="block h-full">
      <Card className="project-card cursor-pointer hover:shadow-md transition-shadow h-full">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="project-title text-lg font-semibold text-gray-900">
              {project.title}
            </h3>
            {getStatusBadge(project.status)}
          </div>
          <p className="project-description text-gray-600 mb-4">
            {project.description}
          </p>
          <div className="project-stats flex justify-between text-sm text-gray-500">
            <span>{project.chapterCount} 章节</span>
            <span>{project.wordCount} 字</span>
            <span>
              更新于 {new Date(project.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
