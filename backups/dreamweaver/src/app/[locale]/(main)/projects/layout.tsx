import { DashboardSidebar } from '@/components/layout/DashboardSidebar';

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#11111a] flex">
      <DashboardSidebar />
      <main className="flex-1 ml-[250px] flex flex-col min-h-screen bg-[#11111a]">
        {children}
      </main>
    </div>
  );
}