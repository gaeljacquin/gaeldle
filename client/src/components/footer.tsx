"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLinkIcon } from "@radix-ui/react-icons";
import { currentYear } from "~/src/lib/client-constants";
import zModes from "~/src/stores/modes";

export default function Footer() {
  const pathname = usePathname();
  const { modes } = zModes();
  const navLink = (path: string, text: string, external?: boolean) => {
    const markup = (
      <Link
        href={`${path}`}
        className={`${path === pathname && "underline"} text-sm font-light`}
        onClick={path === pathname ? (e) => e.preventDefault() : () => null}
        {...(external && { target: "_blank" })}
      >
        <span className="flex">
          {text}
          {external && (
            <span className="ml-2">
              <ExternalLinkIcon />
            </span>
          )}
        </span>
      </Link>
    );

    return markup;
  };

  return (
    <footer className="bottom-0 bg-gradient-to-r from-blue-700 to-teal-600 text-white pt-8 pb-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap text-left lg:text-left w-full">
          <div className="w-full lg:w-full px-4">
            <div className="flex flex-wrap items-top mb-6">
              <div className="w-full md:w-3/12 px-4 mb-4 md:mb-0">
                <span className="block text-md font-semibold mb-2">Links</span>
                <ul className="list-unstyled">
                  <li>{navLink("/", "Home")}</li>
                </ul>
              </div>
              <div className="w-full md:w-3/12 px-4 mb-4 md:mb-0">
                <span className="block text-md font-semibold mb-2">Modes</span>
                <ul className="list-unstyled">
                  {modes &&
                    modes.map((mode) => (
                      <li key={mode.id}>
                        {navLink(`/${mode.mode}`, mode.label)}
                      </li>
                    ))}
                </ul>
              </div>
              <div className="w-full md:w-3/12 px-4 mb-4 md:mb-0">
                <span className="block text-md font-semibold mb-2">Legal</span>
                <ul className="list-unstyled">
                  <li>{navLink("/privacy", "Privacy Policy")}</li>
                  <li>{navLink("/tos", "Terms of Service")}</li>
                </ul>
              </div>
              <div className="w-full md:w-3/12 px-4 mb-4 md:mb-0">
                <span className="block text-md font-semibold mb-2">
                  Socials
                </span>
                <ul className="list-unstyled">
                  <li>
                    {navLink(
                      "https://linkedin.com/in/gaeljacquin",
                      "LinkedIn",
                      true
                    )}
                  </li>
                  <li>
                    {navLink("https://github.com/gaeljacquin", "GitHub", true)}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <hr className="my-6 border-white" />
        <div className="flex flex-wrap items-center md:justify-between justify-center">
          <div className="w-full md:w-4/12 px-4 mx-auto text-center">
            <div className="text-sm font-semibold py-1">
              &copy; 2024{currentYear !== 2024 && `-${currentYear}`}{" "}
              <span className="hover:underline">
                <Link href="https://gaeljacquin.com" target="_blank">
                  Gaël Jacquin
                </Link>
              </span>
              . All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
