'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import GitHubButton from 'react-github-btn';
import AboutModal from '@/components/about-modal';
import LottieComp from '@/components/lottie-comp';
// import ModesNav from '@/components/modes-nav';
import { Modes } from '@/services/modes';
import { appinfo } from '@/utils/server-constants';

type Props = {
  modes: Modes;
};

export default function Navbar(props: Props) {
  // const { modes } = props;
  void props;
  const pathname = usePathname();
  const lottie = () => {
    return (
      <>
        <LottieComp loop={false} />
        <span className="sr-only">{appinfo.title}</span>
      </>
    );
  };

  return (
    <header
      role="banner"
      className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-600 backdrop-filter backdrop-blur-md flex h-20 w-full shrink-0 items-center px-4 md:px-6"
    >
      {pathname !== '/' ? (
        <Link href={pathname !== '/' ? '/' : '#'} className="mr-6 flex h-16 w-16">
          {lottie()}
        </Link>
      ) : (
        <span className="mr-6 flex h-16 w-16">{lottie()}</span>
      )}

      <nav role="navigation" className="ml-auto flex gap-4">
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

        {pathname !== '/' ? (
          <Link href="/" className="navbar-item">
            Home
          </Link>
        ) : (
          <span className="navbar-item">Home</span>
        )}
        <AboutModal />
        {/* <ModesNav modes={modes} /> */}
      </nav>
    </header>
  );
}
