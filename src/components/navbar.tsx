'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import GitHubButton from 'react-github-btn';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { appinfo } from '@/utils/client-constants';

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = React.useState(false);
  const navItems = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
  ];
  const toggleMenu = () => setIsOpen(!isOpen);
  const LottieComp = dynamic(() => import('@/components/lottie-comp'), {
    ssr: false,
  });
  const lottie = () => {
    return (
      <>
        <LottieComp loop={false} />
        <span className="sr-only">{appinfo.title}</span>
      </>
    );
  };

  return (
    <nav className="bg-background border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            {pathname !== '/' ? (
              <Link href={pathname !== '/' ? '/' : '#'} className="mr-6 flex h-16 w-16">
                {lottie()}
              </Link>
            ) : (
              <span className="mr-6 flex h-16 w-16">{lottie()}</span>
            )}
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex space-x-4">
              <span className="mt-1">
                <GitHubButton
                  href="https://github.com/gaeljacquin/gaeldle"
                  data-color-scheme="no-preference: light; light: light; dark: dark;"
                  data-icon="octicon-star"
                  data-size="large"
                  aria-label="Star gaeljacquin/gaeldle on GitHub"
                >
                  Star
                </GitHubButton>
              </span>

              {navItems.map((item) => (
                <Link key={item.name} href={item.href} className="navbar-item">
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" className="px-2" onClick={toggleMenu}>
                  <span className="sr-only">Open main menu</span>
                  {isOpen ? (
                    <X className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Menu className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[240px] sm:w-[300px]">
                <nav className="flex flex-col gap-4">
                  {navItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="text-gray-600 hover:text-primary block px-3 py-2 rounded-md text-base font-medium"
                      onClick={() => setIsOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
