import { Icon, ReactNode } from '@tabler/icons-react';
import ViewportDebugger from './viewport-debugger';

interface DashboardPageHeaderProps {
  title: ReactNode;
  icon: Icon;
}

export function DashboardPageHeader(props: DashboardPageHeaderProps) {
  return (
    <div className="flex flex-row gap-1 justify-between">
      <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
        <props.icon size={22} className="text-primary" aria-hidden="true" />
        {props.title}
      </h1>
      <ViewportDebugger />
    </div>
  );
}
