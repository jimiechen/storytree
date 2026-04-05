'use client';

import React from 'react';
import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Users, Globe, Settings, GitBranch, Cpu } from 'lucide-react';

interface WorkbenchLayoutProps {
  children: React.ReactNode;
}

export default function WorkbenchLayout({ children }: WorkbenchLayoutProps) {
  const params = useParams();
  const pathname = usePathname();
  const projectId = params.projectId as string;

  const navItems = [
    {
      href: `/workbench/${projectId}`,
      label: '编辑器',
      icon: BookOpen,
      exact: true,
    },
    {
      href: `/workbench/${projectId}/branches`,
      label: '分支导图',
      icon: GitBranch,
      exact: false,
    },
    {
      href: `/workbench/${projectId}/characters`,
      label: '角色管理',
      icon: Users,
      exact: false,
    },
    {
      href: `/workbench/${projectId}/world-settings`,
      label: '世界观设定',
      icon: Globe,
      exact: false,
    },
    {
      href: `/workbench/${projectId}/models`,
      label: '模型中心',
      icon: Cpu,
      exact: false,
    },
    {
      href: `/workbench/${projectId}/settings`,
      label: '项目设置',
      icon: Settings,
      exact: false,
    },
  ];

  const isActive = (href: string, exact: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="flex h-screen" data-testid="workbench-layout">
      {/* 左侧导航栏 */}
      <aside 
        className="w-16 bg-gray-900 flex flex-col items-center py-4"
        data-testid="workbench-sidebar"
      >
        <div className="mb-8">
          <Link href="/projects" className="text-white text-xl font-bold">
            DW
          </Link>
        </div>

        <nav className="flex-1 flex flex-col gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, item.exact);
            
            return (
              <Link
                key={item.href}
                href={item.href}
                data-testid={`nav-${item.label}`}
                className={`
                  p-3 rounded-lg transition-colors relative group
                  ${active 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }
                `}
                title={item.label}
              >
                <Icon size={24} />
                {/* Tooltip */}
                <span className="
                  absolute left-full ml-2 px-2 py-1 
                  bg-gray-800 text-white text-sm rounded 
                  opacity-0 group-hover:opacity-100 
                  transition-opacity whitespace-nowrap
                  pointer-events-none z-50
                ">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* 主内容区域 */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
