'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import BMCButton from '@/components/bmc-button';
import LottieComp from '@/components/lottie-comp';
import { appinfo, currentYear } from '@/utils/client-constants';

export default function Footer() {
  const pathname = usePathname();
  const lottie = () => {
    return (
      <>
        <LottieComp loop />
        <span className="sr-only">{appinfo.title}</span>
      </>
    );
  };

  return (
    <>
      <footer className="bg-muted mt-auto">
        <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center text-sm mb-4 md:mb-0">
            {pathname !== '/' ? (
              <Link href={pathname !== '/' ? '/' : '#'} className="h-10 w-16">
                {lottie()}
              </Link>
            ) : (
              <span className="h-10 w-16">{lottie()}</span>
            )}
            <span className="ml-2">
              &copy; 2024{currentYear !== 2024 && `-${currentYear}`}{' '}
              <span className="hover:underline">
                <Link href="https://gaeljacquin.com" target="_blank">
                  Gaël Jacquin
                </Link>
              </span>
              . All rights reserved.
            </span>
          </div>

          <div className="flex flex-row items-center space-x-4">
            <BMCButton />
            <Link href="/privacy" className="text-sm hover:underline">
              Privacy
            </Link>
            <Link href="/tos" className="text-sm hover:underline">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}
