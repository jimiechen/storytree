import React from 'react';

interface ProjectCardProps {
  project: {
    id: string;
    title: string;
    description: string;
    createdAt: string;
    updatedAt: string;
  };
  onClick: (projectId: string) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick }) => {
  return (
    <div
      className="project-card bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer p-6"
      onClick={() => onClick(project.id)}
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
  );
};
