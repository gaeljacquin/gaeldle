"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Settings,
  Gamepad2,
  ChevronDown,
  Image as ImageIcon,
  Palette,
  Sparkles,
  Clock,
  History,
  FileText,
} from "lucide-react";
import { UserButton } from "@stackframe/stack";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import Image from 'next/image';

const gameItems = [
  { title: "Cover Art", url: "/cover-art", icon: ImageIcon },
  { title: "Artwork", url: "/artwork", icon: Palette },
  { title: "Image AI", url: "/image-ai", icon: Sparkles },
  { title: "Timeline", url: "/timeline", icon: Clock },
  { title: "Timeline 2", url: "/timeline-2", icon: History },
  { title: "Specifications", url: "/specifications", icon: FileText },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [gamesOpen, setGamesOpen] = useState(true);

  const isActive = (path: string) => pathname === path;
  const isGameActive = gameItems.some((item) => isActive(item.url));

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className={cn("flex items-center px-2 py-2", isCollapsed ? "justify-center" : "justify-between")}>
          {!isCollapsed && (
            <span className="flex items-center gap-2">
              <Image src="/logo.png" alt="Gaeldle" className="size-8 shrink-0" width={32} height={32} sizes="10vw" />
              <span className="text-lg font-bold text-sidebar-foreground">
                Gaeldle
              </span>
            </span>
          )}
          <SidebarTrigger className="h-8 w-8" />
        </div>
      </SidebarHeader>

      <SidebarContent className="overflow-x-hidden">
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/")}
                  tooltip="Homepage"
                  className={cn(isCollapsed && "justify-center")}
                >
                  <Link href="/" className={cn(isCollapsed && "justify-center")}>
                    <Home className="h-4 w-4" />
                    {!isCollapsed && <span>Homepage</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <Collapsible open={gamesOpen} onOpenChange={setGamesOpen} className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip="Games"
                    isActive={isGameActive}
                    className={cn(isCollapsed && "justify-center")}
                  >
                    <Gamepad2 className="h-4 w-4" />
                    {!isCollapsed && (
                      <>
                        <span>Games</span>
                        <ChevronDown
                          className={cn(
                            "ml-auto h-4 w-4 transition-transform",
                            gamesOpen && "rotate-180"
                          )}
                        />
                      </>
                    )}
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                {!isCollapsed && (
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {gameItems.map((item) => (
                        <SidebarMenuSubItem key={item.title}>
                          <SidebarMenuSubButton asChild isActive={isActive(item.url)}>
                            <Link href={item.url}>
                              <item.icon className="h-4 w-4" />
                              <span>{item.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                )}
              </SidebarMenuItem>
            </Collapsible>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/dashboard/settings")}
                  tooltip="Settings"
                  className={cn(isCollapsed && "justify-center")}
                >
                  <Link href="/dashboard/settings" className={cn(isCollapsed && "justify-center")}>
                    <Settings className="h-4 w-4" />
                    {!isCollapsed && <span>Settings</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className={cn("w-full", isCollapsed ? "flex justify-center" : "px-2")}>
              <UserButton showUserInfo={!isCollapsed} />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
