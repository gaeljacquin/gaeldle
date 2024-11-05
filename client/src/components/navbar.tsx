'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AboutModal from '@/components/about-modal';
import LottieDynamic from '@/components/lottie-dynamic';
import ModesNav from '@/components/modes-nav';
import { type Modes } from '@/services/modes';
import { appinfo } from '@/utils/server-constants';

type Props = {
  modes: Modes;
};

export default function Navbar(props: Props) {
  const { modes } = props;
  const pathname = usePathname();

  return (
    <header
      role="banner"
      className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-600 backdrop-filter backdrop-blur-md flex h-20 w-full shrink-0 items-center px-4 md:px-6"
    >
      <Link href={pathname !== '/' ? '/' : '#'} className="mr-6 flex h-16 w-16">
        <LottieDynamic loop={false} />
        <span className="sr-only">{appinfo.title}</span>
      </Link>

      <nav role="navigation" className="ml-auto flex gap-6">
        <Link
          href={pathname !== '/' ? '/' : '#'}
          className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-white px-4 py-2 text-lg font-medium transition-colors hover:bg-gray-100 hover:text-gray-900 focus:bg-gray-100 focus:text-gray-900 focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-gray-100/50 data-[state=open]:bg-gray-100/50 dark:bg-gray-950 dark:hover:bg-gray-800 dark:hover:text-gray-50 dark:focus:bg-gray-800 dark:focus:text-gray-50 dark:data-[active]:bg-gray-800/50 dark:data-[state=open]:bg-gray-800/50"
        >
          Home
        </Link>
        <AboutModal />
        <ModesNav modes={modes} />
      </nav>
    </header>
  );
}
