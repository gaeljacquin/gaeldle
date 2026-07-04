'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { IconArrowLeft } from '@tabler/icons-react';
import { usePathname, useSearchParams } from 'next/navigation';

export interface DashboardBacklinkProps {
  text?: string;
  href?: string;
}

function DashboardBacklinkContent({
  text = 'Dashboard',
  href = '/dashboard',
}: DashboardBacklinkProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (!pathname.startsWith('/dashboard/')) {
    return null;
  }

  const queryString = searchParams?.toString() || '';
  const finalHref = queryString ? `${href}?${queryString}` : href;

  return (
    <Link
      href={finalHref}
      className="flex flex-row cursor-pointer items-center gap-2"
    >
      <IconArrowLeft stroke={2} size={18} />
      <span className="text-sm">{text}</span>
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
