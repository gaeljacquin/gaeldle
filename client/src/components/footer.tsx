"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLinkIcon } from "@radix-ui/react-icons";
import LottieDynamic from "@/components/lottie-dynamic";
import { currentYear } from "~/src/lib/client-constants";

export default function Footer() {
  const pathname = usePathname();
  const navLink = (path: string, text: string) => {
    const markup = (
      <Link
        href={`${path}`}
        className={`${path === pathname && "text-gael-green"}`}
        onClick={path === pathname ? (e) => e.preventDefault() : () => null}
      >
        {text}
      </Link>
    );

    return markup;
  };

  return (
    <footer className="bottom-0 bg-gray-100 p-6 md:py-12 w-full dark:bg-gray-800">
      <div className="container max-w-7xl grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-8 text-sm flex">
        <div className="grid gap-1">
          <ul className="flex flex-col">
            <h3 className="font-semibold">Quick Links</h3>
            <li>{navLink("/", "Home")}</li>
            <li>{navLink("/triviary", "Play")}</li>
          </ul>
        </div>
        <div className="grid gap-1">
          <ul className="flex flex-col">
            <h3 className="font-semibold">Legal</h3>
            <li>{navLink("/privacy", "Privacy Policy")}</li>
            <li>{navLink("/tos", "Terms of Service")}</li>
          </ul>
        </div>
        <div className="grid gap-1">
          <ul className="flex flex-col">
            <h3 className="font-semibold">Socials</h3>
            <li>
              <Link href="https://linkedin.com/in/gaeljacquin" target="_blank">
                <span className="flex">
                  LinkedIn
                  <span className="ml-2">
                    <ExternalLinkIcon />
                  </span>
                </span>
              </Link>
            </li>
            <li>
              <Link href="https://github.com/gaeljacquin" target="_blank">
                <span className="flex">
                  GitHub
                  <span className="ml-2">
                    <ExternalLinkIcon />
                  </span>
                </span>
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="container max-w-7xl mt-8 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link
            href="https://gaeljacquin.com"
            target="_blank"
            className="w-16 h-auto"
          >
            <LottieDynamic loop={true} />
          </Link>
        </div>
        <p className="mt-4 text-sm text-gray-500 sm:pl-4 sm:mt-0">
          &copy; 2024{currentYear !== 2024 && `-${currentYear}`}{" "}
          <span className="text-gael-green hover:underline hover:text-gael-green-dark">
            <Link href="https://gaeljacquin.com" target="_blank">
              Gaël Jacquin
            </Link>
          </span>
          . All rights reserved.
        </p>
      </div>
    </footer>
  );
}
