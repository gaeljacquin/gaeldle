'use client';

import { ElementType, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { UserButton, useUser } from '@hexclave/next';
import { useSuspenseQuery } from '@tanstack/react-query';
import {
  IconDashboard,
  IconChevronDown,
  IconChevronRight,
  IconSettings,
  IconLayoutSidebarLeftExpand,
  IconLayoutSidebarLeftCollapse,
  IconHome,
  IconTools,
  IconHealthRecognition,
  IconPlayerPlay,
  IconLibrary,
  IconHeart,
} from '@tabler/icons-react';
import { cn } from '@workspace/ui/lib/utils';
import { appInfo } from '@/lib/app-info';
import { Separator } from '@workspace/ui/separator';
import { gameModesQueryOptions } from '@/lib/services/game-mode.service';
import { GameModePlus } from '@workspace/db';

interface SidebarNavItem {
  label: string;
  href: string;
}

const LIBRARY_ITEMS: SidebarNavItem[] = [
  { label: 'Steam', href: '/dashboard/library/steam' },
  { label: 'Epic', href: '/dashboard/library/epic' },
  { label: 'GOG', href: '/dashboard/library/gog' },
  { label: 'Nintendo', href: '/dashboard/library/nintendo' },
  { label: 'Amazon', href: '/dashboard/library/amazon' },
  { label: 'XBOX', href: '/dashboard/library/xbox' },
];

const WISHLIST_ITEMS: SidebarNavItem[] = [
  { label: 'Steam', href: '/dashboard/wishlist/steam' },
  { label: 'Epic', href: '/dashboard/wishlist/epic' },
  { label: 'Nintendo', href: '/dashboard/wishlist/nintendo' },
  { label: 'XBOX', href: '/dashboard/wishlist/xbox' },
  { label: 'Humble Bundle', href: '/dashboard/wishlist/humble-bundle' },
];

interface SidebarLinkProps {
  href: string;
  icon: ElementType;
  label: string;
  isCollapsed: boolean;
  isActive: boolean;
}

function SidebarLink({
  href,
  icon: Icon,
  label,
  isCollapsed,
  isActive,
}: SidebarLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        isCollapsed ? 'justify-center px-0' : null,
        isActive
          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
          : 'transparent',
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
  mode: GameModePlus;
  isCollapsed: boolean;
  pathname: string;
}

function SidebarGameLink({
  mode,
  isCollapsed,
  pathname,
}: SidebarGameLinkProps) {
  const href = `/${mode.slug}`;
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        isCollapsed ? 'justify-center px-0' : null,
        isActive
          ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold'
          : 'text-muted-foreground',
      )}
      title={isCollapsed ? mode.title : undefined}
    >
      {isCollapsed ? null : <span>{mode.title}</span>}
    </Link>
  );
}

function SidebarGamesSection({
  isCollapsed,
  isExpanded,
  onToggle,
  pathname,
}: SidebarGamesSectionProps) {
  const { data: gameModes } = useSuspenseQuery(gameModesQueryOptions);

  return (
    <div>
      <button
        onClick={onToggle}
        className={cn(
          'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer',
          isCollapsed ? 'justify-center px-0' : null,
        )}
        title={isCollapsed ? 'Modes' : undefined}
      >
        <IconPlayerPlay size={20} />
        {isCollapsed ? null : (
          <>
            <span>Modes</span>
            <span className="ml-auto">
              {isExpanded ? (
                <IconChevronDown size={16} />
              ) : (
                <IconChevronRight size={16} />
              )}
            </span>
          </>
        )}
      </button>
      {isExpanded && (
        <div className={cn('mt-1 space-y-1', isCollapsed ? null : 'ml-4')}>
          {gameModes.map((mode) => (
            <SidebarGameLink
              key={mode.slug}
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

interface SidebarMenuSectionProps {
  title: string;
  icon: ElementType;
  items: SidebarNavItem[];
  isCollapsed: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  pathname: string;
}

function SidebarMenuSection({
  title,
  icon: Icon,
  items,
  isCollapsed,
  isExpanded,
  onToggle,
  pathname,
}: SidebarMenuSectionProps) {
  return (
    <div>
      <button
        onClick={onToggle}
        className={cn(
          'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer',
          isCollapsed ? 'justify-center px-0' : null,
        )}
        title={isCollapsed ? title : undefined}
      >
        <Icon size={20} />
        {isCollapsed ? null : (
          <>
            <span>{title}</span>
            <span className="ml-auto">
              {isExpanded ? (
                <IconChevronDown size={16} />
              ) : (
                <IconChevronRight size={16} />
              )}
            </span>
          </>
        )}
      </button>
      {isExpanded && (
        <div className={cn('mt-1 space-y-1', isCollapsed ? null : 'ml-4')}>
          {items.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  isCollapsed ? 'justify-center px-0' : null,
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold'
                    : 'text-muted-foreground',
                )}
                title={isCollapsed ? item.label : undefined}
              >
                {isCollapsed ? null : <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface SidebarHeaderProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

function SidebarHeader({ isCollapsed, onToggle }: SidebarHeaderProps) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'group flex h-16 w-full cursor-pointer items-center border-b px-4',
        isCollapsed ? 'justify-center px-0' : null,
      )}
    >
      {isCollapsed ? (
        <div
          className="relative flex size-8 items-center justify-center"
          title="Expand sidebar"
        >
          <Image
            src="/logo.png"
            alt={`${appInfo.title} logo`}
            width={32}
            height={32}
            className="h-8 w-auto rounded-md group-hover:hidden"
            loading="eager"
            priority
            unoptimized
          />
          <IconLayoutSidebarLeftExpand
            size={20}
            className="hidden group-hover:block"
          />
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 font-bold tracking-tight">
            <Image
              src="/logo.png"
              alt={`${appInfo.title} logo`}
              width={32}
              height={32}
              className="h-8 w-auto rounded-md"
              loading="eager"
              priority
              unoptimized
            />{' '}
            <span>{appInfo.title}</span>
          </div>
          <div
            className="ml-auto hidden group-hover:block"
            title="Collapse sidebar"
          >
            <IconLayoutSidebarLeftCollapse size={20} />
          </div>
        </>
      )}
    </button>
  );
}

interface SidebarUserFooterProps {
  isCollapsed: boolean;
  user: { displayName?: string | null };
}

function SidebarUserFooter({ isCollapsed, user }: SidebarUserFooterProps) {
  return (
    <div
      className={cn(
        'mt-auto border-t p-4 flex items-center',
        isCollapsed ? 'justify-center px-0' : null,
      )}
    >
      <div
        className={cn(
          'flex items-center gap-3',
          isCollapsed ? 'justify-center' : 'w-full',
        )}
      >
        <UserButton />
        {isCollapsed ? null : (
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-medium truncate">
              {user.displayName}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const user = useUser();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isGamesExpanded, setIsGamesExpanded] = useState(false);
  const [isLibraryExpanded, setIsLibraryExpanded] = useState(() =>
    pathname.startsWith('/dashboard/library'),
  );
  const [isWishlistExpanded, setIsWishlistExpanded] = useState(() =>
    pathname.startsWith('/dashboard/wishlist'),
  );

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const nextCollapsed = !prev;
      if (nextCollapsed) {
        setIsGamesExpanded(false);
        setIsLibraryExpanded(false);
        setIsWishlistExpanded(false);
      }
      return nextCollapsed;
    });
  };

  const toggleGames = () => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setIsGamesExpanded(true);
    } else {
      setIsGamesExpanded((prev) => !prev);
    }
  };

  const toggleLibrary = () => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setIsLibraryExpanded(true);
    } else {
      setIsLibraryExpanded((prev) => !prev);
    }
  };

  const toggleWishlist = () => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setIsWishlistExpanded(true);
    } else {
      setIsWishlistExpanded((prev) => !prev);
    }
  };

  return (
    <aside
      className={cn(
        'relative flex flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-24' : 'w-64',
      )}
    >
      <SidebarHeader isCollapsed={isCollapsed} onToggle={toggleSidebar} />

      <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
        <SidebarLink
          href="/dashboard"
          icon={IconDashboard}
          label="Dashboard"
          isCollapsed={isCollapsed}
          isActive={pathname === '/dashboard'}
        />

        <SidebarMenuSection
          title="Library"
          icon={IconLibrary}
          items={LIBRARY_ITEMS}
          isCollapsed={isCollapsed}
          isExpanded={isLibraryExpanded}
          onToggle={toggleLibrary}
          pathname={pathname}
        />

        <SidebarMenuSection
          title="Wishlist"
          icon={IconHeart}
          items={WISHLIST_ITEMS}
          isCollapsed={isCollapsed}
          isExpanded={isWishlistExpanded}
          onToggle={toggleWishlist}
          pathname={pathname}
        />

        <SidebarLink
          href="/dashboard/utilities"
          icon={IconTools}
          label="Utilities"
          isCollapsed={isCollapsed}
          isActive={
            pathname.startsWith('/dashboard/utilities') ||
            [
              '/dashboard/image-gen',
              '/dashboard/new-game',
              '/dashboard/discover-games',
            ].includes(pathname)
          }
        />

        <SidebarLink
          href="/dashboard/settings"
          icon={IconSettings}
          label="Settings"
          isCollapsed={isCollapsed}
          isActive={pathname === '/dashboard/settings'}
        />

        <Separator />

        <SidebarLink
          href="/"
          icon={IconHome}
          label="Home"
          isCollapsed={isCollapsed}
          isActive={pathname === '/'}
        />

        <SidebarLink
          href="/health"
          icon={IconHealthRecognition}
          label="Health"
          isCollapsed={isCollapsed}
          isActive={pathname === '/health'}
        />

        <SidebarGamesSection
          isCollapsed={isCollapsed}
          isExpanded={isGamesExpanded}
          onToggle={toggleGames}
          pathname={pathname}
        />
      </nav>

      <SidebarUserFooter isCollapsed={isCollapsed} user={user!} />
    </aside>
  );
}
