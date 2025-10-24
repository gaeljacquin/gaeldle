"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function TopNav() {
  const [blurred, setBlurred] = useState(false);
  const pathname = usePathname();

  const isHomePage = pathname === "/";

  const navContent = () => {
    return (
      <div className="flex items-center gap-6 text-sm">
        {!isHomePage && (
          <Link
            href="/"
            className={cn(
              "hover:text-foreground transition-colors",
              "text-muted-foreground"
            )}
          >
            Home
          </Link>
        )}
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
    )
  }

  // Detect scroll and toggle blur
  useEffect(() => {
    const mainEl = document.querySelector("main");
    if (!mainEl) return;

    const handleScroll = () => {
      const isBlurred = mainEl.scrollTop > 0;
      setBlurred(isBlurred);
    };

    mainEl.addEventListener("scroll", handleScroll, { passive: true });
    return () => mainEl.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full border-b h-16 flex items-center justify-end pl-8 pr-8",
      blurred ? "backdrop-blur bg-background/90" : "bg-transparent",
      "transition-all duration-200"
    )}>
      {navContent()}
    </header>
  );
}
