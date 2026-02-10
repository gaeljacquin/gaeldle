import type { Metadata } from "next";
import { ReactNode, Suspense } from "react";
import { Geist, Geist_Mono, Figtree } from "next/font/google";
import { LayoutWrapper } from "@/components/layout-wrapper";
import Providers from "./providers";
import Loading from "./loading";
import "./globals.css";

const figtree = Figtree({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gaeldle",
  description: "A gaming-themed Wordle clone",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className={figtree.variable}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <Suspense fallback={<Loading />}>
            <LayoutWrapper>
              {children}
            </LayoutWrapper>
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}
