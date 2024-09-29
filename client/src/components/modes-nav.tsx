"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import zModes from "@/stores/modes";
import zCategories from "@/stores/categories";
import { Category } from "@/types/categories";
import { Mode } from "@/types/modes";

export default function ModesNav() {
  const { modes } = zModes();
  const { categories } = zCategories();

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
        {categories.map((category: Category) => (
          category._count.modes > 0 &&
          <div key={category.id}>
            <DropdownMenuLabel>{category.label}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {modes.filter((mode: Mode) => mode.categoryId === category.id).map((mode: Mode, index: number) => {
                return (
                  <DropdownMenuItem key={mode.mode + '-' + index}>
                    <Link href={`/${mode.mode}`}>{mode.label}</Link>
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
