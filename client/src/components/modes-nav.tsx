"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import zModes from "@/stores/modes";
import { Mode } from "@/types/modes";
import { Button } from "./ui/button";

export default function ModesNav() {
  const { modes } = zModes();
  const readySetGo = !!modes;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Link
          href="#"
          className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900 focus:bg-gray-100 focus:text-gray-900 focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-gray-100/50 data-[state=open]:bg-gray-100/50 dark:bg-gray-950 dark:hover:bg-gray-800 dark:hover:text-gray-50 dark:focus:bg-gray-800 dark:focus:text-gray-50 dark:data-[active]:bg-gray-800/50 dark:data-[state=open]:bg-gray-800/50"
        >
          Modes
        </Link>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        {!readySetGo ? (
          <p className="text-center text-sm font-semibold">Loading modes...</p>
        ) : (
          modes.map((mode: Mode, index: number) => (
            <DropdownMenuItem key={mode.mode + "-" + index}>
              <Link href={`/${mode.mode}`} className="w-full">
                <Button className={`${mode.classNames} w-full`}>
                  {mode.label}
                </Button>
              </Link>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
