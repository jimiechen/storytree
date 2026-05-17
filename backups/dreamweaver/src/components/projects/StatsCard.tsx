'use client';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: string;
  color?: 'primary' | 'secondary' | 'tertiary' | 'error';
}

const colorMap = {
  primary: 'bg-primary/10 text-primary',
  secondary: 'bg-secondary/10 text-secondary',
  tertiary: 'bg-tertiary/10 text-tertiary',
  error: 'bg-error/10 text-error',
};

export function StatsCard({ title, value, icon, color = 'primary' }: StatsCardProps) {
  const colorClass = colorMap[color];

  return (
    <div className="bg-surface-container rounded-xl p-6 border border-outline-variant/20">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-full ${colorClass} flex items-center justify-center`}>
          <span className="material-symbols-outlined text-2xl">{icon}</span>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">{title}</p>
          <p className="font-serif text-2xl font-bold text-on-surface">{value}</p>
        </div>
      </div>
    </div>
  );
}
