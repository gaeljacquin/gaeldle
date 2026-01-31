'use client';

import { appInfo } from "@/lib/app-info";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useStackApp, useUser } from "@stackframe/stack";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const user = useUser();
  const stackApp = useStackApp();
  const isSignedIn = Boolean(user);
  const authLabel = isSignedIn ? "Dashboard" : "Sign in";
  const authHref = isSignedIn ? "/dashboard" : "/sign-in";
  const isAuthPageActive = pathname === authHref;
  const handleSignOut = () => {
    void stackApp.signOut();
  };

  return (
    <footer className="mt-auto py-6 px-4 sm:px-6 lg:px-8 border-t bg-transparent flex flex-col gap-7">
      <div className="max-w-6xl mx-auto text-center text-muted-foreground">
        <p>
          &copy; 2025 {currentYear > 2025 && <span>- {new Date().getFullYear()} </span>}
          <Link
            href={`${appInfo.authorUrl}`}
            target="_blank"
            className="hover:underline"
          >
            {appInfo.author}
          </Link>
          . All rights reserved.
        </p>
      </div>
      <div className="max-w-6xl mx-auto w-full text-muted-foreground flex flex-col items-center gap-4">
        <div className="flex gap-7 items-center justify-center">
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
          <Link
            href={authHref}
            className={cn(
              "hover:text-foreground transition-colors",
              isAuthPageActive ? "text-foreground font-medium" : "text-muted-foreground"
            )}
          >
            {authLabel}
          </Link>
          {isSignedIn && (
            <button
              type="button"
              onClick={handleSignOut}
              className="hover:text-foreground transition-colors text-muted-foreground cursor-pointer"
            >
              Sign out
            </button>
          )}
        </div>
      </div>
    </footer>
  );
}
