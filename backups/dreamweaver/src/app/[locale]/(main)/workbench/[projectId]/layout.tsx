'use client';

import React, { useState, useEffect } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';

interface WorkbenchLayoutProps {
  children: React.ReactNode;
}

export default function WorkbenchLayout({ children }: WorkbenchLayoutProps) {
  const params = useParams();
  const pathname = usePathname();
  const projectId = params.projectId as string;
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const t = useTranslations('Workbench');

  useEffect(() => {
    setMounted(true);
  }, []);

  // The narrow sidebar items
  const navItems = [
    { id: 'draft', icon: 'edit_document', href: `/workbench/${projectId}`, exact: true, title: t('draft') },
    { id: 'outline', icon: 'menu_book', href: `/workbench/${projectId}/outline`, exact: false, title: t('outline') },
    { id: 'branches', icon: 'account_tree', href: `/workbench/${projectId}/branches`, exact: false, title: t('branches') },
    { id: 'knowledge', icon: 'library_books', href: `/workbench/${projectId}/characters`, exact: false, title: t('knowledge') },
    { id: 'models', icon: 'smart_toy', href: `/workbench/${projectId}/models`, exact: false, title: t('models') },
    { id: 'stats', icon: 'bar_chart', href: `/workbench/${projectId}/stats`, exact: false, title: t('stats') },
  ];

  const isActive = (href: string, exact: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="flex h-screen bg-[#11111a]" data-testid="workbench-layout">
      {/* 极简侧边栏 (Narrow Sidebar) */}
      <aside className="w-16 bg-[#1a1a24] flex flex-col items-center py-4 border-r border-white/5 relative h-full flex-shrink-0 z-20 shadow-2xl">
        {/* Logo */}
        <Link href="/projects" className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1e1e2d] to-[#2d2d3f] flex items-center justify-center mb-8 shadow-inner border border-white/10 hover:border-white/20 transition-all group" aria-label="Back to Projects">
          <span className="material-symbols-outlined text-[#75d1ff] group-hover:scale-110 transition-transform" aria-hidden="true">auto_awesome</span>
        </Link>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-6 items-center w-full mt-4" aria-label="Workbench Navigation">
          {navItems.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`relative group transition-all p-2 rounded-lg ${
                  active
                    ? 'text-[#75d1ff] bg-white/5 before:content-[""] before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[3px] before:bg-[#75d1ff] before:shadow-[0_0_8px_#75d1ff] before:rounded-r-full'
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
                title={item.title}
                aria-label={item.title}
                aria-current={active ? 'page' : undefined}
              >
                <span className="material-symbols-outlined text-[22px]" aria-hidden="true">{item.icon}</span>
              </Link>
            );
          })}
        </nav>

        {/* 底部功能区 */}
        <div className="mt-auto flex flex-col items-center gap-4 py-4 relative z-10">
          {mounted && (
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="text-white/40 hover:text-white transition-colors" 
              title="切换主题"
              aria-label="Toggle Theme"
            >
              <span className="material-symbols-outlined text-[22px]" aria-hidden="true">
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
          )}
          <button className="text-white/40 hover:text-white transition-colors" title="历史版本" aria-label="History">
            <span className="material-symbols-outlined text-[22px]" aria-hidden="true">history</span>
          </button>
          <button className="text-white/40 hover:text-white transition-colors" title="设置" aria-label="Settings">
            <span className="material-symbols-outlined text-[22px]" aria-hidden="true">settings</span>
          </button>
          <button className="w-8 h-8 rounded-full overflow-hidden border border-white/20 mt-2" aria-label="User Profile">
            <img alt="Profile" className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity" src="/avatar.png" />
          </button>
        </div>
      </aside>

      {/* 主内容区域 */}
      <main className="flex-1 overflow-hidden flex flex-col relative">
        {children}
      </main>
    </div>
  );
}
