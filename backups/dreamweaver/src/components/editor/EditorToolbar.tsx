'use client';

interface EditorToolbarProps {
  saveStatus: 'saved' | 'saving' | 'unsaved';
  lastSaved?: string;
}

export function EditorToolbar({ saveStatus, lastSaved }: EditorToolbarProps) {
  const getSaveStatusText = () => {
    switch (saveStatus) {
      case 'saving':
        return '保存中...';
      case 'saved':
        return lastSaved ? `已保存 ${lastSaved}` : '已保存';
      case 'unsaved':
        return '未保存';
      default:
        return '';
    }
  };

  const getSaveStatusColor = () => {
    switch (saveStatus) {
      case 'saving':
        return 'text-primary';
      case 'saved':
        return 'text-tertiary';
      case 'unsaved':
        return 'text-secondary';
      default:
        return 'text-outline';
    }
  };

  return (
    <header className="h-12 border-b border-outline-variant/20 flex items-center justify-between px-6 bg-surface-container-lowest/80 backdrop-blur">
      {/* Formatting Tools */}
      <div className="flex items-center gap-4 text-outline text-[14px]">
        <button className="hover:text-primary transition-colors">
          <span className="material-symbols-outlined">format_bold</span>
        </button>
        <button className="hover:text-primary transition-colors">
          <span className="material-symbols-outlined">format_italic</span>
        </button>
        <span className="w-[1px] h-4 bg-outline-variant"></span>
        <button className="text-[11px] font-bold hover:text-primary transition-colors">H1</button>
        <button className="text-[11px] font-bold hover:text-primary transition-colors">H2</button>
        <button className="text-[11px] font-bold hover:text-primary transition-colors">H3</button>
        <span className="w-[1px] h-4 bg-outline-variant"></span>
        <button className="hover:text-primary transition-colors">
          <span className="material-symbols-outlined">format_quote</span>
        </button>
      </div>

      {/* Save Status */}
      <div className="flex items-center gap-4">
        <span className={`text-[10px] uppercase tracking-widest ${getSaveStatusColor()}`}>
          {getSaveStatusText()}
        </span>
        <button className="text-primary hover:text-on-primary-container">
          <span className="material-symbols-outlined text-[20px]">
            {saveStatus === 'saved' ? 'cloud_done' : 'cloud_sync'}
          </span>
        </button>
      </div>
    </header>
  );
}
