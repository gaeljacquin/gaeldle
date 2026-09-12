'use client';

import { type Icon, ReactNode } from '@tabler/icons-react';
import ViewportDebugger from '@/components/viewport-debugger';
import {
  DashboardBacklink,
  DashboardBacklinkProps,
} from '@/components/dashboard-backlink';

interface DashboardHeaderProps {
  title: ReactNode;
  icon: Icon;
  subtitle?: ReactNode;
  rightElement?: ReactNode;
  extraElements?: ReactNode;
  dashboardBacklinkProps?: DashboardBacklinkProps;
}

export function DashboardHeader(props: DashboardHeaderProps) {
  return (
    <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-20">
      <div className="container mx-auto px-4 py-4 space-y-4">
        <div className="flex flex-row gap-1 justify-between items-center">
          {props.subtitle ? (
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <props.icon
                  size={22}
                  className="text-primary"
                  aria-hidden="true"
                />
                {props.title}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {props.subtitle}
              </p>
            </div>
          ) : (
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <props.icon
                size={22}
                className="text-primary"
                aria-hidden="true"
              />
              {props.title}
            </h1>
          )}
          <ViewportDebugger />
          <div className="flex items-center justify-end">
            {props.rightElement ?? (
              <DashboardBacklink {...props.dashboardBacklinkProps} />
            )}
          </div>
        </div>
        {props.extraElements}
      </div>
    </div>
  );
}
