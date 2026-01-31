"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useStackApp, useUser } from "@stackframe/stack";
import { appInfo } from "@/lib/app-info";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const user = useUser();
  const stackApp = useStackApp();
  const isSignedIn = Boolean(user);
  const authLabel = isSignedIn ? "Dashboard" : "Sign in";
  const authHref = isSignedIn ? "/dashboard" : "/sign-in";
  const isActive = (path: string) => pathname === path;

  const handleSignOut = () => {
    void stackApp.signOut();
  };

  return (
    <nav className="redesign sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href={`${appInfo.authorUrl}`} className="flex items-center gap-2">
          <Image src="/logo.png" alt={`${appInfo.title} logo`} width={32} height={32} />
          {/* <span className="text-xl font-bold tracking-tight text-foreground">{appInfo.title}</span> */}
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive(link.href)
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href={authHref}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive(authHref)
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            )}
          >
            {authLabel}
          </Link>
          {isSignedIn && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-2 text-muted-foreground hover:text-foreground cursor-pointer"
              onClick={handleSignOut}
            >
              Sign out
            </Button>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {isOpen && (
        <div className="border-t border-border bg-background/95 md:hidden">
          <div className="flex flex-col space-y-1 px-4 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive(link.href)
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={authHref}
              onClick={() => setIsOpen(false)}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive(authHref)
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )}
            >
              {authLabel}
            </Link>
            {isSignedIn && (
              <button
                type="button"
                onClick={() => {
                  handleSignOut();
                  setIsOpen(false);
                }}
                className="rounded-md px-3 py-2 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground cursor-pointer"
              >
                Sign out
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
