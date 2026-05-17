'use client';

interface StatusBarProps {
  wordCount: number;
  todayWordCount?: number;
  totalWordCount?: number;
  modelName?: string;
  consistencyStatus?: 'checked' | 'warning' | 'error';
}

export function StatusBar({
  wordCount,
  todayWordCount = 0,
  totalWordCount = 0,
  modelName = 'CLAUDE 4 OPUS',
  consistencyStatus = 'checked',
}: StatusBarProps) {
  return (
    <footer className="h-8 bg-surface-container flex items-center justify-between px-6 text-[10px] text-outline uppercase tracking-wider">
      {/* Word Count Stats */}
      <div className="flex items-center gap-6">
        <span>
          字数: <span className="text-on-surface">{wordCount.toLocaleString()}</span>
        </span>
        <span>
          今日: <span className="text-on-surface">{todayWordCount.toLocaleString()}</span>
        </span>
        <span>
          总计: <span className="text-on-surface">{totalWordCount.toLocaleString()}</span>
        </span>
      </div>

      {/* Model & Consistency Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-tertiary shadow-[0_0_5px_#83da85]"></span>
          <span>模型: {modelName}</span>
        </div>
        <div
          className={`flex items-center gap-1.5 ${
            consistencyStatus === 'checked'
              ? 'text-tertiary'
              : consistencyStatus === 'warning'
              ? 'text-secondary'
              : 'text-error'
          }`}
        >
          <span className="material-symbols-outlined text-[14px]">
            {consistencyStatus === 'checked'
              ? 'check_circle'
              : consistencyStatus === 'warning'
              ? 'warning'
              : 'error'}
          </span>
          <span>
            {consistencyStatus === 'checked'
              ? '一致性已校验'
              : consistencyStatus === 'warning'
              ? '存在警告'
              : '存在错误'}
          </span>
        </div>
      </div>
    </footer>
  );
}
