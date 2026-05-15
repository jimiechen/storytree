'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

interface CreateProjectModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectCreated: () => void;
}

const genres = [
  { id: '仙侠', name: '仙侠', icon: 'swords' },
  { id: '都市', name: '都市', icon: 'apartment' },
  { id: '悬疑', name: '悬疑', icon: 'search_check' },
  { id: '科幻', name: '科幻', icon: 'rocket_launch' },
  { id: '奇幻', name: '奇幻', icon: 'auto_awesome' },
  { id: '历史', name: '历史', icon: 'history' },
  { id: '言情', name: '言情', icon: 'favorite' },
  { id: '其他', name: '其他', icon: 'book' },
];

export function CreateProjectModal({ isOpen, onOpenChange, onProjectCreated }: CreateProjectModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState('');
  const [targetWordCount, setTargetWordCount] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = '项目名称不能为空';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      await api.post('/api/projects', {
        name: name.trim(),
        description: description.trim() || undefined,
        genre: genre || undefined,
        targetWordCount: targetWordCount ? parseInt(targetWordCount) : undefined,
      });

      // 重置表单
      setName('');
      setDescription('');
      setGenre('');
      setTargetWordCount('');
      setErrors({});

      // 关闭弹窗
      onOpenChange(false);

      // 通知父组件项目已创建
      onProjectCreated();
    } catch (error) {
      console.error('Failed to create project:', error);
      setErrors({ general: '创建项目失败，请稍后重试' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onOpenChange(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-surface-container rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">add</span>
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold">新建作品</h2>
              <p className="text-[10px] text-slate-400">开始你的创作之旅</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-on-surface transition-colors p-2"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {errors.general && (
            <div className="bg-error-container/20 border border-error/30 rounded-lg p-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-error text-sm">error</span>
              <span className="text-error text-sm">{errors.general}</span>
            </div>
          )}

          {/* Project Name */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              作品名称 <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="给你的作品起个名字"
              className="w-full bg-surface-container-highest border border-outline-variant/30 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
            />
            {errors.name && (
              <p className="text-error text-xs flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">error</span>
                {errors.name}
              </p>
            )}
          </div>

          {/* Genre Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              作品类型
            </label>
            <div className="grid grid-cols-4 gap-2">
              {genres.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setGenre(g.id)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${
                    genre === g.id
                      ? 'bg-primary/10 border-primary/40 text-primary'
                      : 'bg-surface-container-highest border-outline-variant/20 text-slate-400 hover:border-outline-variant/40'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">{g.icon}</span>
                  <span className="text-[10px]">{g.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              作品简介
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="简要描述你的作品..."
              rows={3}
              className="w-full bg-surface-container-highest border border-outline-variant/30 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all resize-none"
            />
          </div>

          {/* Target Word Count */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              目标字数
            </label>
            <div className="relative">
              <input
                type="number"
                value={targetWordCount}
                onChange={(e) => setTargetWordCount(e.target.value)}
                placeholder="例如: 50000"
                className="w-full bg-surface-container-highest border border-outline-variant/30 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                字
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-outline-variant/20 bg-surface-container-low/50">
          <button
            onClick={handleClose}
            disabled={loading}
            className="px-5 py-2.5 text-sm font-medium text-slate-400 hover:text-on-surface transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2.5 bg-gradient-to-r from-primary to-on-primary-container text-on-primary rounded-lg text-sm font-bold uppercase tracking-wider shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                创建中...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">auto_awesome</span>
                创建作品
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
