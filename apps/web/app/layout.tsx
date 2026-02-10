import type { Metadata } from "next";
import { Suspense } from "react";
import { StackProvider, StackTheme } from "@stackframe/stack";
import { stackClientApp } from "../stack/client";
import { Geist, Geist_Mono, Figtree } from "next/font/google";
import { LayoutWrapper } from "@/components/layout-wrapper";
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
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={figtree.variable}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <StackProvider app={stackClientApp}>
          <StackTheme>
            <Suspense fallback={<Loading />}>
              <LayoutWrapper>
                {children}
              </LayoutWrapper>
            </Suspense>
          </StackTheme>
        </StackProvider>
      </body>
    </html>
  );
}
