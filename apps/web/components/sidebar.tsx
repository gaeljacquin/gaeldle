"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { UserButton, useUser } from "@stackframe/stack";
import {
  IconDashboard,
  IconHome,
  IconDeviceGamepad2,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconChevronDown,
  IconChevronRight
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

const gameModes = [
  { name: "Cover Art", href: "/cover-art" },
  { name: "AI Image", href: "/image-ai" },
  { name: "Artwork", href: "/artwork" },
  { name: "Timeline", href: "/timeline" },
  { name: "Timeline 2", href: "/timeline-2" },
  { name: "Specifications", href: "/specifications" },
];

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
        isCollapsed ? "w-12" : "w-64"
      )}
    >
      {/* Top Header */}
      <div className={cn(
        "flex h-16 items-center border-b px-4",
        isCollapsed && "justify-center px-0"
      )}>
        {!isCollapsed && (
          <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
            <div className="relative h-8 w-8 overflow-hidden rounded-md">
              <Image
                src="/logo.png"
                alt="Gaeldle Logo"
                fill
                className="object-cover"
              />
            </div>
            <span>Gaeldle</span>
          </Link>
        )}
        <button
          onClick={toggleSidebar}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer",
            !isCollapsed && "ml-auto"
          )}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <IconLayoutSidebarLeftExpand size={20} />
          ) : (
            <IconLayoutSidebarLeftCollapse size={20} />
          )}
        </button>
      </div>

      {/* Navigation */}
      {!isCollapsed && (
        <nav className="flex-1 space-y-1 p-2">
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              pathname === "/dashboard" ? "bg-sidebar-accent text-sidebar-accent-foreground" : "transparent"
            )}
          >
            <IconDashboard size={20} />
            <span>Dashboard</span>
          </Link>

          <Link
            href="/"
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              pathname === "/" ? "bg-sidebar-accent text-sidebar-accent-foreground" : "transparent"
            )}
          >
            <IconHome size={20} />
            <span>Home</span>
          </Link>

          <div>
            <button
              onClick={toggleGames}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <IconDeviceGamepad2 size={20} />
              <span>Games</span>
              <span className="ml-auto">
                {isGamesExpanded ? (
                  <IconChevronDown size={16} />
                ) : (
                  <IconChevronRight size={16} />
                )}
              </span>
            </button>
            {isGamesExpanded && (
              <div className="mt-1 ml-9 space-y-1">
                {gameModes.map((mode) => (
                  <Link
                    key={mode.href}
                    href={mode.href}
                    className={cn(
                      "block rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      pathname === mode.href ? "text-sidebar-accent-foreground font-semibold" : "text-muted-foreground"
                    )}
                  >
                    {mode.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>
      )}

      {/* Bottom Footer */}
      <div className="mt-auto border-t p-4 flex items-center">
        <div className={cn(
          "flex w-full items-center gap-3",
          isCollapsed && "justify-center px-0",
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
