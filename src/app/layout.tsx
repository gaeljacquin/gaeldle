import './globals.css';

import { Comic_Neue } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { VercelToolbar } from '@vercel/toolbar/next';
import Footer from '@/components/footer';
import Navbar from '@/components/navbar';
import { Toaster } from '@/components/ui/toaster';
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
  return (
    <html lang="en">
      <body className={`${theFont} antialiased bg-white text-gray-900 tracking-tight`}>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main role="main">{children}</main>
          <Footer />
          <Toaster />
        </div>
        <SpeedInsights />
        <Analytics />
        {process.env.NODE_ENV === 'development' && <VercelToolbar />}
      </body>
    </html>
  );
}
