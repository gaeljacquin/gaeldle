import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { stackServerApp } from "@/stack/server";

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const user = await stackServerApp.getUser({ tokenStore: "nextjs-cookie" });

  if (!user) {
    redirect("/sign-in");
  }

  return <>{children}</>;
}
