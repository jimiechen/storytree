import type { Component } from 'solid-js';
import type { Project } from '../../types';
import { ProjectCard } from './project-card';

interface ProjectGridProps {
  projects: Project[];
  onSelect: (id: string) => void;
}

/** 项目卡片网格（响应式，最小 3 列） */
export const ProjectGrid: Component<ProjectGridProps> = (props) => {
  return (
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 px-6 py-4" data-testid="bookshelf-project-grid">
      {props.projects.map((p) => (
        <ProjectCard project={p} onSelect={props.onSelect} />
      ))}
    </div>
  );
};
