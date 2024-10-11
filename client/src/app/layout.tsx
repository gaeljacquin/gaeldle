import "./globals.css";

import { Inter } from "next/font/google";
import dynamic from "next/dynamic";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import { VercelToolbar } from "@vercel/toolbar/next";
import Navbar from "@/components/navbar";
import { appinfo } from "@/lib/server-constants";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const DynamicFooter = dynamic(() => import("@/components/footer"), {
  ssr: false,
});

export const metadata = {
  title: appinfo.title,
  description: appinfo.description,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} font-inter antialiased bg-white text-gray-900 tracking-tight`}
      >
        <div className="flex flex-col min-h-screen" tabIndex={-1}>
          <Navbar />
          <main role="main">{children}</main>
        </div>
        <div className="mt-10 md:mt-24" tabIndex={-1}>
          <DynamicFooter />
        </div>
        <SpeedInsights />
        <Analytics />
        {process.env.NODE_ENV === "development" && <VercelToolbar />}
      </body>
    </html>
  );
}
