import type { Metadata } from "next";
import { ReactNode, Suspense } from "react";
import { Figtree, JetBrains_Mono } from "next/font/google";
import { LayoutWrapper } from "@/components/layout-wrapper";
import Providers from "./providers";
import Loading from "./loading";
import "./globals.css";
import { appInfo } from "@/lib/app-info";

const figtree = Figtree({subsets:['latin'],variable:'--font-sans'});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: appInfo.title,
  description: appInfo.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className={figtree.variable} suppressHydrationWarning>
      <body
        className={`${jetbrainsMono.variable} font-sans antialiased`}
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
