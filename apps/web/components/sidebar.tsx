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
import SidebarToggle from "@/components/sidebar-toggle";

interface SidebarLinkProps {
  href: string;
  icon: React.ElementType;
  label: string;
  isCollapsed: boolean;
  isActive: boolean;
}

function SidebarLink({ href, icon: Icon, label, isCollapsed, isActive }: Readonly<SidebarLinkProps>) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        isCollapsed ? "justify-center px-0" : null,
        isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "transparent",
      )}
      title={isCollapsed ? label : undefined}
    >
      <Icon size={20} />
      {isCollapsed ? null : <span>{label}</span>}
    </Link>
  );
}

interface SidebarGamesSectionProps {
  isCollapsed: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  pathname: string;
}

interface SidebarGameLinkProps {
  mode: typeof gameModes[number];
  isCollapsed: boolean;
  pathname: string;
}

function SidebarGameLink({ mode, isCollapsed, pathname }: Readonly<SidebarGameLinkProps>) {
  const isActive = pathname === mode.href;
  return (
    <Link
      href={mode.href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        isCollapsed ? "justify-center px-0" : null,
        isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold" : "text-muted-foreground",
      )}
      title={isCollapsed ? mode.title : undefined}
    >
      <mode.icon size={isCollapsed ? 20 : 18} />
      {isCollapsed ? null : <span>{mode.title}</span>}
    </Link>
  );
}

function SidebarGamesSection({ isCollapsed, isExpanded, onToggle, pathname }: Readonly<SidebarGamesSectionProps>) {
  return (
    <div>
      <button
        onClick={onToggle}
        className={cn(
          "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer",
          isCollapsed ? "justify-center px-0" : null,
        )}
        title={isCollapsed ? "Games" : undefined}
      >
        <IconDeviceGamepad2 size={20} />
        {isCollapsed ? null : (
          <>
            <span>Games</span>
            <span className="ml-auto">
              {isExpanded ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
            </span>
          </>
        )}
      </button>
      {isExpanded && (
        <div className={cn("mt-1 space-y-1", isCollapsed ? null : "ml-4")}>
          {gameModes.map((mode) => (
            <SidebarGameLink
              key={mode.href}
              mode={mode}
              isCollapsed={isCollapsed}
              pathname={pathname}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface SidebarHeaderProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

function SidebarHeader({ isCollapsed, onToggle }: Readonly<SidebarHeaderProps>) {
  return (
    <div className={cn(
      "flex h-16 items-center border-b px-4",
      isCollapsed ? "justify-center px-0" : null,
    )}>
      {isCollapsed ? null : (
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
          <Image
            src="/logo.png"
            alt={`${appInfo.title} logo`}
            width={243}
            height={256}
            className="h-8 rounded-md"
            style={{ width: "auto" }}
            loading="eager"
          />
          <span>{appInfo.title}</span>
        </Link>
      )}
      <SidebarToggle isCollapsed={isCollapsed} toggleSidebar={onToggle} />
    </div>
  );
}

interface SidebarUserFooterProps {
  isCollapsed: boolean;
  user: { displayName?: string | null };
}

function SidebarUserFooter({ isCollapsed, user }: Readonly<SidebarUserFooterProps>) {
  return (
    <div className={cn("mt-auto border-t p-4 flex items-center", isCollapsed ? "justify-center px-0" : null)}>
      <div className={cn(
        "flex items-center gap-3",
        isCollapsed ? "justify-center" : null,
        isCollapsed ? null : "w-full",
      )}>
        <UserButton />
        {isCollapsed ? null : (
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-medium truncate">{user.displayName}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isGamesExpanded, setIsGamesExpanded] = useState(false);
  const pathname = usePathname();
  const user = useUser({ or: "redirect" });

  const toggleSidebar = () => setIsCollapsed((prev) => !prev);
  const toggleGames = () => setIsGamesExpanded((prev) => !prev);

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out",
        isCollapsed ? "w-12" : "w-64",
      )}
    >
      <SidebarHeader isCollapsed={isCollapsed} onToggle={toggleSidebar} />

      <nav className="flex-1 space-y-1 p-2">
        <SidebarLink
          href="/dashboard"
          icon={IconDashboard}
          label="Dashboard"
          isCollapsed={isCollapsed}
          isActive={pathname === "/dashboard"}
        />

        <SidebarGamesSection
          isCollapsed={isCollapsed}
          isExpanded={isGamesExpanded}
          onToggle={toggleGames}
          pathname={pathname}
        />

        <SidebarLink
          href="/dashboard/settings"
          icon={IconSettings}
          label="Settings"
          isCollapsed={isCollapsed}
          isActive={pathname === "/dashboard/settings"}
        />
      </nav>

      <SidebarUserFooter isCollapsed={isCollapsed} user={user} />
    </aside>
  );
}
