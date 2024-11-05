import './globals.css';

import { Comic_Neue } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { VercelToolbar } from '@vercel/toolbar/next';
import Footer from '@/components/footer';
import Navbar from '@/components/navbar';
import { getModes } from '@/services/modes';
import { appinfo } from '@/utils/server-constants';

const theFontInit = Comic_Neue({
  weight: '400',
  style: 'normal',
  subsets: ['latin'],
  display: 'swap',
});
const theFontClass = 'font-comic-neue';
const theFont = theFontInit.className + ' ' + theFontClass;

export const metadata = {
  title: appinfo.title,
  description: appinfo.description,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const modes = await getModes();

  return (
    <html lang="en">
      <body className={`${theFont} antialiased bg-white text-gray-900 tracking-tight`}>
        <div className="flex flex-col min-h-screen">
          <Navbar modes={modes} />
          <main role="main">{children}</main>
          <Footer modes={modes} />
        </div>
        <SpeedInsights />
        <Analytics />
        {process.env.NODE_ENV === 'development' && <VercelToolbar />}
      </body>
    </html>
  );
}
