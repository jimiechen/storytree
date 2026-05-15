'use client';

import { usePathname } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

export function DashboardSidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const t = useTranslations('Sidebar');

  useEffect(() => {
    setMounted(true);
  }, []);

  const menuItems = [
    { icon: 'book', label: t('library'), href: '/projects' },
    { icon: 'article', label: t('manuscript'), href: '#' },
    { icon: 'people', label: t('characters'), href: '#' },
    { icon: 'public', label: t('worldBuilding'), href: '#' },
    { icon: 'show_chart', label: t('analytics'), href: '#' },
  ];

  return (
    <aside className="w-[250px] bg-[#1a1a24] flex flex-col h-screen fixed left-0 top-0 border-r border-white/5">
      {/* Logo Area */}
      <div className="p-6 pb-8">
        <div className="flex items-center gap-3 text-[#75d1ff]">
          <span className="material-symbols-outlined text-2xl">auto_awesome</span>
          <h1 className="font-serif text-xl font-bold tracking-wide">DreamWeaver</h1>
        </div>
        <p className="text-[10px] text-white/40 font-bold tracking-[0.2em] mt-2 uppercase">
          Master Architect
        </p>
      </div>

      {/* Main Menu */}
      <nav className="flex-1 flex flex-col gap-2 px-4" aria-label="Main Navigation">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={`flex items-center gap-4 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-white/10 text-white relative before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:bg-[#75d1ff] before:rounded-r-full'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="material-symbols-outlined text-[20px] opacity-80" aria-hidden="true">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Area */}
      <div className="p-6 flex flex-col gap-4">
        <button 
          className="w-full py-3 bg-gradient-to-r from-[#38bdf8] to-[#0ea5e9] text-white rounded-lg text-xs font-bold tracking-wider hover:opacity-90 transition-opacity shadow-lg shadow-sky-500/20"
          aria-label={t('newManuscript')}
        >
          {t('newManuscript')}
        </button>
        <div className="flex flex-col gap-2 mt-4">
          <Link 
            href="#" 
            className="flex items-center gap-3 text-white/50 hover:text-white text-xs font-medium px-2 py-2 transition-colors"
            aria-label={t('settings')}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">settings</span>
            {t('settings')}
          </Link>
          <Link 
            href="#" 
            className="flex items-center gap-3 text-white/50 hover:text-white text-xs font-medium px-2 py-2 transition-colors"
            aria-label={t('support')}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">help</span>
            {t('support')}
          </Link>
          {mounted && (
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex items-center gap-3 text-white/50 hover:text-white text-xs font-medium px-2 py-2 transition-colors"
              aria-label={t('theme')}
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
              {t('theme')}
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
