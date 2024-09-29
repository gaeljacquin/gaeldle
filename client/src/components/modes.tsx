'use client'

import Link from "next/link";
import DisplayCountdown from "./display-countdown";
import { Button } from "./ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Mode } from "@/types/modes";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import Placeholders from "@/views/placeholders";
import zModes from "~/src/stores/modes";
import zCategories from "@/stores/categories"
import { Category } from "../types/categories";

type generateButtonProps = {
  label: string
  description: string
  slug: string
  classNames: string
  isNew: boolean
  buttonKey: string
}

export default function Modes() {
  const { modes } = zModes();
  const { categories } = zCategories();
  const [clickedButton, setClickedButton] = useState<string | null>(null);
  const readySetGo = modes && categories;
  const mdGridColsClass = "md:grid-cols-" + Math.max(categories.length, 1);

  const handleClick = (buttonKey: string) => {
    if (clickedButton === null) {
      setClickedButton(buttonKey)
    }
  }

  const generateButtonKey = (label: string, index: number) => {
    return label + '-' + index
  }

  const generateButton = ({ label, description, slug, classNames, isNew, buttonKey }: generateButtonProps) => {
    const isClicked = clickedButton === buttonKey
    const isDisabled = clickedButton !== null

    const buttonMarkup = () => {
      return (
        <Button
          className={`w-full ${classNames} ${isNew && 'shadow-animate'} ${isDisabled && !isClicked ? 'cursor-not-allowed' : ''}`}
          onClick={() => handleClick(buttonKey)}
          disabled={isClicked}
          aria-disabled={isDisabled && !isClicked}
        >
          {isClicked && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {label}
        </Button>
      )
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              className="flex justify-center w-full"
              href={`/${slug}`}
              aria-disabled={isDisabled && !isClicked}
            >
              {buttonMarkup()}
            </Link>
          </TooltipTrigger>
          <TooltipContent>
            <p>{description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  if (!readySetGo) {
    return <Placeholders />
  }

  return (
    readySetGo &&
    <div className={`grid sm:grid-cols-1 gap-6 mt-8 ${mdGridColsClass} md:gap-8`}>
      {categories.map((category: Category) => (
        <div key={category.id} className="relative flex flex-col p-6 bg-white shadow-lg rounded-lg dark:bg-zinc-850 justify-between border-2 border-gael-purple">
          <div className="px-3 py-1 text-lg text-white border-2 border-gael-purple bg-gradient-to-r from-gael-pink to-gael-purple rounded-full inline-block absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            {category.label}
          </div>
          <div className="mt-5 text-center">
            {category._count.modes > 0 ?
              <ul className="mt-4 space-y-6">
                {modes.filter((mode: Mode) => mode.categoryId === category.id).map((mode: Mode, index: number) => {
                  const buttonKey = generateButtonKey(mode.mode, index);

                  return mode.active ? (
                    <li key={mode.mode + '-' + index} className="flex items-center">
                      {generateButton({
                        label: mode.label,
                        description: mode.description,
                        slug: mode.mode,
                        classNames: mode.levels.classNames,
                        isNew: mode.isNew,
                        buttonKey: buttonKey,
                      })}
                    </li>
                  ) : (
                    <li key={mode + '-' + index} className="flex items-center">
                      <Button className={`w-full ${mode.levels.classNames}`} disabled>
                        {mode.label}
                      </Button>
                    </li>
                  );
                })}
              </ul>
              :
              <ul className="mt-4 space-y-6">
                <li className="flex items-center">
                  <Button className="w-full" disabled>
                    ?
                  </Button>
                </li>
              </ul>
            }
            {category.id === 1 && (
              <div className="mt-5">
                <DisplayCountdown />
              </div>
            )}
          </div>
          <div className="mt-6">
          </div>
        </div>
      ))}
    </div>
  )
}
