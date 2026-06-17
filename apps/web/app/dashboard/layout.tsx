import { Sidebar } from '@/components/sidebar';
import { ReactNode } from 'react';

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto scrollbar-gutter-stable">
        {children}
      </main>
    </div>
  );
}
