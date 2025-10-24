'use client';

import { appInfo } from "@/lib/app-info";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const pathname = usePathname();
  const isHomePage = pathname === "/";


  return (
    <footer className="mt-auto py-6 px-4 sm:px-6 lg:px-8 border-t bg-transparent flex flex-col gap-7">
      <div className="max-w-6xl mx-auto text-center text-muted-foreground">
        <p>&copy; 2025 {currentYear > 2025 && <span>- {new Date().getFullYear()}</span>} {appInfo.author}. All rights reserved.</p>
      </div>
      <div className="max-w-6xl mx-auto text-center text-muted-foreground flex gap-7 items-center justify-center">
        <Link
          href="/"
          className={cn(
            "hover:text-foreground transition-colors",
            isHomePage ? "text-foreground font-medium" : "text-muted-foreground"
          )}
        >
          Home
        </Link>
        <Link
          href="/privacy"
          className={cn(
            "hover:text-foreground transition-colors",
            pathname === "/privacy" ? "text-foreground font-medium" : "text-muted-foreground"
          )}
        >
          Privacy
        </Link>
        <Link
          href="/terms"
          className={cn(
            "hover:text-foreground transition-colors",
            pathname === "/terms" ? "text-foreground font-medium" : "text-muted-foreground"
          )}
        >
          Terms
        </Link>
      </div>
    </footer>
  );
}
