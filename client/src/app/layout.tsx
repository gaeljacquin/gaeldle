import './globals.css'

import { Inter } from 'next/font/google'
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";

import Footer from "@/components/footer";
import Navbar from "@/components/navbar";
import TextSpecial from '@/components/text-special';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap'
})

export const metadata = {
  title: 'Gaeldle',
  description: 'A Wordle clone inspired by Gamedle',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-inter antialiased bg-white text-gray-900 tracking-tight`}>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <div className="text-center mt-10">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-5xl md:text-6xl font-extrabold mb-4">
                <TextSpecial term1={'Gael'} term2={'dle'} space={false} />
              </h1>
            </div>
          </div>
          {children}
          <SpeedInsights />
          <Analytics />
          <Footer />
        </div>
      </body>
    </html>
  )
}
