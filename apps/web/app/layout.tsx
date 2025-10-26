import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";
import { daFont1, daFont2, daFont3 } from "@/lib/fonts";
import { appInfo } from "@/lib/app-info";
import { ReactNode } from "react";
import Footer from "@/components/footer";
// import TopNav from "@/components/top-nav";

export const metadata: Metadata = {
  title: appInfo.title,
  description: appInfo.description,
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${daFont1.variable} ${daFont2.variable} ${daFont3.variable}`}
      >
        <Providers>
          <div className="flex h-screen overflow-hidden">
            <main className="flex flex-1 flex-col overflow-y-auto" style={{ backgroundColor: "#f5f5f0", scrollbarGutter: "stable" }}>
              {/* <TopNav /> */}
              <div className="flex-1">
                {children}
              </div>
              <Footer />
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
