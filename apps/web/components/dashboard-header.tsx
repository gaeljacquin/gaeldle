import { type Icon, ReactNode } from '@tabler/icons-react';
import ViewportDebugger from './viewport-debugger';

interface DashboardHeaderProps {
  title: ReactNode;
  icon: Icon;
  extraElements?: ReactNode;
}

export function DashboardHeader(props: DashboardHeaderProps) {
  return (
    <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4 space-y-4">
        <div className="flex flex-row gap-1 justify-between">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <props.icon size={22} className="text-primary" aria-hidden="true" />
            {props.title}
          </h1>
          <ViewportDebugger />
        </div>
        {props.extraElements}
      </div>
    </div>
  );
}
