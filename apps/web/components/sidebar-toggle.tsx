import { cn } from "@/lib/utils";
import {
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
} from "@tabler/icons-react";

interface SidebarToggleProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

export default function SidebarToggle({ isCollapsed, toggleSidebar }: Readonly<SidebarToggleProps>) {
  return (
    <button
      onClick={toggleSidebar}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer",
        !isCollapsed && "ml-auto",
      )}
      title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
    >
      {isCollapsed ? (
        <IconLayoutSidebarLeftExpand size={20} />
      ) : (
        <IconLayoutSidebarLeftCollapse size={20} />
      )}
    </button>
  )
}
