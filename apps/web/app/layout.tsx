import type { Metadata } from "next";
import { StackProvider, StackTheme } from "@stackframe/stack";
import { stackClientApp } from "../stack/client";
import { Providers } from "@/components/providers";
import "./globals.css";
import { daFont1, daFont2, daFont3 } from "@/lib/fonts";
import { appInfo } from "@/lib/app-info";
import { ReactNode, Suspense } from "react";
import Footer from "@/components/footer";
import Navbar from "@/components/navbar";

export const metadata: Metadata = {
  title: appInfo.title,
  description: appInfo.description,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${daFont1.variable} ${daFont2.variable} ${daFont3.variable}`}
      ><StackProvider app={stackClientApp}><StackTheme>
        <Providers>
          <div className="flex h-screen overflow-hidden">
            <main className="flex flex-1 flex-col overflow-y-auto" style={{ backgroundColor: "#f5f5f0", scrollbarGutter: "stable" }}>
              <Suspense fallback={null}>
                <Navbar />
              </Suspense>
              <div className="flex-1">
                {children}
              </div>
              <Suspense fallback={null}>
                <Footer />
              </Suspense>
            </main>
          </div>
        </Providers>
      </StackTheme></StackProvider></body>
    </html>
  );
}
