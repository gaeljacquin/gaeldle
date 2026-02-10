"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ReactNode } from "react";

export function LayoutWrapper({ children }: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname();
  const shouldHideNav = pathname?.startsWith("/dashboard") || pathname?.startsWith("/handler");

  if (shouldHideNav) {
    return <>{children}</>;
  }

  return (
    <div className="redesign flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
