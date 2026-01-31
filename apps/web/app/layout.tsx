import type { Metadata } from "next";
import { StackProvider, StackTheme } from "@stackframe/stack";
import { stackClientApp } from "../stack/client";
import { Providers } from "@/components/providers";
import "./globals.css";
import { daFont1, daFont2, daFont3 } from "@/lib/fonts";
import { appInfo } from "@/lib/app-info";
import { ReactNode } from "react";

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
        <Providers>{children}</Providers>
      </StackTheme></StackProvider></body>
    </html>
  );
}
