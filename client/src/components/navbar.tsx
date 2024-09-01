'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { usePathname } from 'next/navigation';
import LottieDynamic from '@/components/lottie-dynamic';
import useGaeldleStore from "@/stores/gaeldle-store";
import { modesSlice } from "@/stores/modes-slice";
import { Modes } from '@/types/modes';
import ModesDrawer from './modes-drawer';

type NavbarProps = {
  getModesAction: () => Promise<Modes>
}

export default function Navbar({ getModesAction }: NavbarProps) {
  const pathname = usePathname();
  const modesSliceState = useGaeldleStore() as modesSlice;
  const { setModes } = modesSliceState;
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    const fetchModes = async () => {
      try {
        const modes = await getModesAction();
        setModes(modes);
      } catch (error) {
        console.error('Failed to fetch modes:', error);
      }
    };

    fetchModes();
  }, [setModes, getModesAction]);

  const navLink = (path: string, text: string) => {
    const markup = (
      <Link
        href={`${path}`}
        className={`${path === pathname ? 'text-gael-green-light md:text-gael-green' : 'md:hover:text-gael-blue'}`}
        onClick={path === pathname ? (e) => e.preventDefault() : () => null}
      >
        {text}
      </Link>
    )

    return markup;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-600">
      <nav className="container mx-auto px-4 py-2 md:py-3 backdrop-filter backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="w-16 h-auto">
            <LottieDynamic loop={false} />
          </div>
          <div className="hidden md:flex space-x-4">
            {pathname !== '/' && <ModesDrawer />}
            {navLink("/", "Home")}
          </div>
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6 text-gray-600" /> : <Menu className="h-6 w-6 text-gray-600" />}
          </button>
        </div>
        {isMenuOpen && (
          <div className="mt-4 md:hidden">
            <Link href="/" className="block py-2 text-gray-600 hover:text-gray-800">Home</Link>
          </div>
        )}
      </nav>
    </header>
  )
}
