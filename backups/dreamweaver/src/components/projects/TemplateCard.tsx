'use client';

interface Template {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
  color: 'primary' | 'secondary' | 'error' | 'tertiary';
}

interface TemplateCardProps {
  template: Template;
  onClick?: () => void;
}

const colorMap = {
  primary: {
    icon: 'text-primary',
    border: 'border-primary/40',
  },
  secondary: {
    icon: 'text-secondary',
    border: 'border-secondary/40',
  },
  error: {
    icon: 'text-error',
    border: 'border-error/40',
  },
  tertiary: {
    icon: 'text-tertiary',
    border: 'border-tertiary/40',
  },
};

export function TemplateCard({ template, onClick }: TemplateCardProps) {
  const colors = colorMap[template.color];

  return (
    <div
      onClick={onClick}
      className={`bg-surface-container-low p-4 rounded-lg border-t-2 ${colors.border} hover:bg-surface-container transition-colors cursor-pointer group`}
    >
      <div className={`${colors.icon} mb-3`}>
        <span className="material-symbols-outlined text-2xl">{template.icon}</span>
      </div>
      <span className="font-serif block font-bold text-sm">{template.name}</span>
      <span className="text-[10px] text-slate-500">{template.nameEn}</span>
    </div>
  );
}
