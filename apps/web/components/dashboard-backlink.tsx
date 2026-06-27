'use client';

import Link from 'next/link';
import { IconArrowLeft } from '@tabler/icons-react';
import { usePathname } from 'next/navigation';

export interface DashboardBacklinkProps {
  text?: string;
  href?: string;
}

export function DashboardBacklink({
  text = 'Dashboard',
  href = '/dashboard',
}: DashboardBacklinkProps) {
  const pathname = usePathname();

  if (!pathname.startsWith('/dashboard/')) {
    return null;
  }

  return (
    <Link
      href={href}
      className="flex flex-row cursor-pointer items-center gap-2"
    >
      <IconArrowLeft stroke={2} size={18} />
      <span className="text-sm">{text}</span>
    </Link>
  );
}
