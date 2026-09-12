'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { IconArrowLeft } from '@tabler/icons-react';
import { usePathname, useSearchParams } from 'next/navigation';

export interface DashboardBacklinkProps {
  text?: string;
  href?: string;
  hide?: boolean;
}

const BACKLINK_LABEL_MAP: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/library/steam': 'Steam Library',
  '/dashboard/library/epic': 'Epic Library',
  '/dashboard/library/gog': 'GOG Library',
  '/dashboard/library/nintendo': 'Nintendo Library',
  '/dashboard/library/amazon': 'Amazon Library',
  '/dashboard/library/xbox': 'XBOX Library',
  '/dashboard/wishlist/steam': 'Steam Wishlist',
  '/dashboard/wishlist/epic': 'Epic Wishlist',
  '/dashboard/wishlist/nintendo': 'Nintendo Wishlist',
  '/dashboard/wishlist/xbox': 'XBOX Wishlist',
  '/dashboard/wishlist/humble-bundle': 'Humble Bundle Wishlist',
  '/dashboard/discover-games': 'Discover Games',
  '/dashboard/edit-modes': 'Edit Modes',
  '/dashboard/settings': 'Settings',
  '/dashboard/utilities': 'Utilities',
};

export function getBacklinkDetails(from: string | null | undefined): {
  text: string;
  href: string;
} {
  if (!from || !from.startsWith('/dashboard')) {
    return { text: 'Dashboard', href: '/dashboard' };
  }

  const text = BACKLINK_LABEL_MAP[from] ?? 'Dashboard';
  return { text, href: from };
}

function DashboardBacklinkContent({
  text,
  href,
  hide,
}: DashboardBacklinkProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (
    hide ||
    !pathname.startsWith('/dashboard/') ||
    pathname.startsWith('/dashboard/library') ||
    pathname.startsWith('/dashboard/wishlist')
  ) {
    return null;
  }

  const from = searchParams.get('from');
  const defaultDetails = getBacklinkDetails(from);

  const resolvedHref = href ?? defaultDetails.href;
  const resolvedText = text ?? defaultDetails.text;

  const params = new URLSearchParams(searchParams?.toString() || '');
  params.delete('from');
  const queryString = params.toString();
  const finalHref = queryString
    ? `${resolvedHref}?${queryString}`
    : resolvedHref;

  return (
    <Link
      href={finalHref}
      className="flex flex-row cursor-pointer items-center gap-2"
    >
      <IconArrowLeft stroke={2} size={18} />
      <span className="text-sm">{resolvedText}</span>
    </Link>
  );
}

export function DashboardBacklink(props: DashboardBacklinkProps) {
  return (
    <Suspense fallback={null}>
      <DashboardBacklinkContent {...props} />
    </Suspense>
  );
}
