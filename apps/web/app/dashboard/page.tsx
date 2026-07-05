import { Suspense } from 'react';
import Dashboard from '@/views/dashboard';

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center p-8 text-muted-foreground">
          Loading Dashboard...
        </div>
      }
    >
      <Dashboard />
    </Suspense>
  );
}
