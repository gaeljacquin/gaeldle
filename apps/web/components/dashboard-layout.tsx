"use client";

import { ReactNode } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { DashboardSidebar } from "./dashboard-sidebar";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider 
      className="redesign min-h-svh w-full bg-background text-foreground"
      style={{ "--sidebar-width": "12rem" } as React.CSSProperties}
    >
      <DashboardSidebar />
      <SidebarInset className="min-w-0 md:pl-[calc(var(--sidebar-width)+theme(spacing.4))] md:peer-data-[state=collapsed]:pl-[calc(var(--sidebar-width-icon)+theme(spacing.4))] peer-data-[variant=inset]:min-h-[calc(100svh-theme(spacing.4))] md:peer-data-[variant=inset]:m-2 md:peer-data-[state=collapsed]:peer-data-[variant=inset]:ml-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow">
        <div className="flex-1 w-full overflow-auto p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
