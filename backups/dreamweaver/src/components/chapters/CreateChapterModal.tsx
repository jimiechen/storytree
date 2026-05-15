'use client';

import { useState } from 'react';

interface CreateChapterModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onChapterCreated: (title: string) => void;
}

export function CreateChapterModal({ isOpen, onOpenChange, onChapterCreated }: CreateChapterModalProps) {
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('章节标题不能为空');
      return;
    }

    setLoading(true);
    try {
      await onChapterCreated(title.trim());
      setTitle('');
      setError('');
    } catch (err) {
      setError('创建章节失败');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setTitle('');
      setError('');
      onOpenChange(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative bg-surface-container rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">add</span>
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold">新建章节</h2>
              <p className="text-[10px] text-slate-400">添加新章节到当前卷</p>
            </div>
          </div>
          <button onClick={handleClose} className="text-slate-400 hover:text-on-surface transition-colors p-2">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="bg-error-container/20 border border-error/30 rounded-lg p-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-error text-sm">error</span>
              <span className="text-error text-sm">{error}</span>
            </div>
          )}

          {/* Chapter Title */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              章节标题 <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入章节标题"
              className="w-full bg-surface-container-highest border border-outline-variant/30 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
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
                <span className="material-symbols-outlined text-sm">add</span>
                创建章节
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
