"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { IconMenu2, IconX } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUser } from "@stackframe/stack";
import { appInfo } from "@/lib/app-info";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const user = useUser();
  const isSignedIn = Boolean(user);
  const authLabel = isSignedIn ? "Dashboard" : "Sign in";
  const authHref = isSignedIn ? "/dashboard" : "/handler/sign-in";
  const isActive = (path: string) => pathname === path;

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt={`${appInfo.title} logo`} width={32} height={32} />
          <span className="text-xl font-bold tracking-tight text-foreground">{appInfo.title}</span>
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
              "rounded-md px-3 py-2 text-sm font-medium transition-colors ml-4",
              isActive(authHref)
                ? "bg-primary text-primary-foreground"
                : "bg-primary/90 text-primary-foreground hover:bg-primary"
            )}
          >
            {authLabel}
          </Link>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? <IconX size={20} /> : <IconMenu2 size={20} />}
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
                "bg-primary text-primary-foreground"
              )}
            >
              {authLabel}
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
