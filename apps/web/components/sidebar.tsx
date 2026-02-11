"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { UserButton, useUser } from "@stackframe/stack";
import {
  IconDashboard,
  IconDeviceGamepad2,
  IconChevronDown,
  IconChevronRight,
  IconSettings,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { appInfo } from "@/lib/app-info";
import { gameModes } from "@/lib/game-mode";
import SidebarToggle from "./sidebar-toggle";

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isGamesExpanded, setIsGamesExpanded] = useState(false);
  const pathname = usePathname();
  const user = useUser({ or: "redirect" });

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);
  const toggleGames = () => setIsGamesExpanded(!isGamesExpanded);

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out",
        isCollapsed ? "w-12" : "w-64",
      )}
    >
      <div className={cn(
        "flex h-16 items-center border-b px-4",
        isCollapsed && "justify-center px-0",
      )}>
        {!isCollapsed && (
          <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
            <div className="relative size-8 overflow-hidden rounded-md">
              <Image
                src="/logo.png"
                alt={`${appInfo.title} logo`}
                fill
                className="object-cover"
              />
            </div>
            <span>{appInfo.title}</span>
          </Link>
        )}
        <SidebarToggle isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />
      </div>

      <nav className="flex-1 space-y-1 p-2">
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            isCollapsed && "justify-center px-0",
            pathname === "/dashboard" ? "bg-sidebar-accent text-sidebar-accent-foreground" : "transparent",
          )}
          title={isCollapsed ? "Dashboard" : undefined}
        >
          <IconDashboard size={20} />
          {!isCollapsed && <span>Dashboard</span>}
        </Link>

        <div>
          <button
            onClick={toggleGames}
            className={cn(
              "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer",
              isCollapsed && "justify-center px-0",
            )}
            title={isCollapsed ? "Games" : undefined}
          >
            <IconDeviceGamepad2 size={20} />
            {!isCollapsed && (
              <>
                <span>Games</span>
                <span className="ml-auto">
                  {isGamesExpanded ? (
                    <IconChevronDown size={16} />
                  ) : (
                    <IconChevronRight size={16} />
                  )}
                </span>
              </>
            )}
          </button>
          {isGamesExpanded && (
            <div className={cn("mt-1 space-y-1", !isCollapsed && "ml-4")}>
              {gameModes.map((mode) => (
                <Link
                  key={mode.href}
                  href={mode.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isCollapsed && "justify-center px-0",
                    pathname === mode.href ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold" : "text-muted-foreground",
                  )}
                  title={isCollapsed ? mode.title : undefined}
                >
                  <mode.icon size={isCollapsed ? 20 : 18} />
                  {!isCollapsed && <span>{mode.title}</span>}
                </Link>
              ))}
            </div>
          )}
        </div>

        <Link
          href="/dashboard/settings"
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            isCollapsed && "justify-center px-0",
            pathname === "/dashboard/settings" ? "bg-sidebar-accent text-sidebar-accent-foreground" : "transparent",
          )}
          title={isCollapsed ? "Settings" : undefined}
        >
          <IconSettings size={20} />
          {!isCollapsed && <span>Settings</span>}
        </Link>
      </nav>

      <div className={cn("mt-auto border-t p-4 flex items-center", isCollapsed && "justify-center px-0")}>
        <div className={cn(
          "flex items-center gap-3",
          isCollapsed && "justify-center",
          !isCollapsed && "w-full",
        )}>
          <UserButton />
          {!isCollapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium truncate">{user.displayName}</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
