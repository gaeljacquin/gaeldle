'use client';

import { appInfo } from "@/lib/app-info";
import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-card/50 py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center gap-4 text-center text-sm text-muted-foreground">
          <p>
            &copy; 2025 {currentYear > 2025 && <span>- {currentYear} </span>}
            <Link
              href={`${appInfo.authorUrl}`}
              target="_blank"
              className="hover:text-foreground hover:underline"
            >
              {appInfo.author}
            </Link>
            . All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
