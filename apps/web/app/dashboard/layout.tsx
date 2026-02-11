import { stackServerApp } from "@/stack/server";
import { Sidebar } from "@/components/sidebar";
import { ReactNode } from "react";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  await stackServerApp.getUser({ or: "redirect" });

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto scrollbar-gutter-stable">
        {children}
      </main>
    </div>
  );
}
