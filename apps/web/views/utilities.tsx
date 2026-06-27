'use client';

import { ViewTransition } from 'react';
import {
  IconCirclePlus,
  IconArrowsExchange,
  IconZoomScan,
  IconTools,
  IconPlayerPlay,
} from '@tabler/icons-react';
import { MenuCard } from '@/components/menu-card';
import { DashboardHeader } from '@/components/dashboard-header';

const utilityItems = [
  {
    href: '/dashboard/add-game',
    title: 'Add Game',
    description: 'Add new games to the library by IGDB ID.',
    icon: IconCirclePlus,
    gradient: '--gradient-easy-1',
  },
  {
    href: '/dashboard/replace-game',
    title: 'Replace Game',
    description: 'Swap games using IGDB IDs.',
    icon: IconArrowsExchange,
    gradient: '--gradient-medium-2',
  },
  {
    href: '/dashboard/discover-games',
    title: 'Discover Games',
    description: 'Browse and discover new games on IGDB.',
    icon: IconZoomScan,
    gradient: '--gradient-hard-1',
  },
  {
    href: '/dashboard/edit-modes',
    title: 'Edit Modes',
    description: 'Manage and update active and inactive game modes.',
    icon: IconPlayerPlay,
    gradient: '--gradient-medium-3',
  },
] as const;

export default function UtilitiesView() {
  return (
    <ViewTransition>
      <div className="flex flex-col min-h-full bg-background">
        <DashboardHeader
          title="Utilities"
          icon={IconTools}
          dashboardBacklinkProps={{ text: 'Dashboard', href: '/dashboard' }}
        />

        <div className="container mx-auto px-4 py-8">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {utilityItems.map((item) => (
              <MenuCard
                key={item.href}
                href={item.href}
                title={item.title}
                description={item.description}
                icon={item.icon}
                gradient={item.gradient}
              />
            ))}
          </div>
        </div>
      </div>
    </ViewTransition>
  );
}
