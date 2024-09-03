import Link from 'next/link';
import Image from 'next/image';

import LottieDynamic from '@/components/lottie-dynamic';
import { currentYear } from '@/constants/date';

export default function Footer() {
  return (
    <>
      <section className="text-gray-700 bg-white body-font mt-10">
        <div className="container flex flex-col items-center px-8 py-8 mx-auto max-w-7xl sm:flex-row border-t border-gray-200">
          <span className="w-12">
            <LottieDynamic loop={true} />
          </span>
          <p className="mt-4 text-sm text-gray-500 sm:pl-4 sm:mt-0">&copy; 2024{currentYear !== 2024 && `-${currentYear}`} <span className="text-gael-green">Gaël Jacquin</span>. All rights reserved.</p>
          <span className="inline-flex justify-center mt-4 space-x-5 sm:ml-auto sm:mt-0 sm:justify-start">
            {/* <Link href="https://gaeljacquin.com" target="_blank" className="flex justify-center items-center text-gray-600 hover:text-gray-900 bg-white hover:bg-white-100 rounded-full border border-gray-200 hover:border-gray-400 shadow transition duration-150 ease-in-out" aria-label="Personal Website">
              <Image
                src="/favicon.ico"
                width={32}
                height={32}
                alt="Personal Website Logo"
              />
            </Link> */}
            <Link href="https://github.com/gaeljacquin" target="_blank" className="flex justify-center items-center text-gray-600 hover:text-gray-900 bg-white hover:bg-white-100 rounded-full border border-gray-200 hover:border-gray-400 shadow transition duration-150 ease-in-out" aria-label="Github">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="w-12 h-12 fill-current">
                <path d="M16 8.2c-4.4 0-8 3.6-8 8 0 3.5 2.3 6.5 5.5 7.6.4.1.5-.2.5-.4V22c-2.2.5-2.7-1-2.7-1-.4-.9-.9-1.2-.9-1.2-.7-.5.1-.5.1-.5.8.1 1.2.8 1.2.8.7 1.3 1.9.9 2.3.7.1-.5.3-.9.5-1.1-1.8-.2-3.6-.9-3.6-4 0-.9.3-1.6.8-2.1-.1-.2-.4-1 .1-2.1 0 0 .7-.2 2.2.8.6-.2 1.3-.3 2-.3s1.4.1 2 .3c1.5-1 2.2-.8 2.2-.8.4 1.1.2 1.9.1 2.1.5.6.8 1.3.8 2.1 0 3.1-1.9 3.7-3.7 3.9.3.4.6.9.6 1.6v2.2c0 .2.1.5.6.4 3.2-1.1 5.5-4.1 5.5-7.6-.1-4.4-3.7-8-8.1-8z" />
              </svg>
            </Link>
            <Link href="https://linkedin.com/in/gaeljacquin" target="_blank" className="flex justify-center items-center text-gray-600 hover:text-gray-900 bg-white hover:bg-white-100 rounded-full border border-gray-200 hover:border-gray-400 shadow transition duration-150 ease-in-out" aria-label="LinkedIn">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="w-12 h-12 fill-current">
                <rect x="7" y="7" width="18" height="18" fill="gray-600" />
                <text x="16" y="16" fontSize="10" fontWeight="bold" fill="white" textAnchor="middle" dominantBaseline="middle">in</text>
              </svg>
            </Link>
          </span>
        </div>
      </section>
    </>
  )
}
