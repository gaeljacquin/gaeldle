import Link from "next/link";
import DisplayCountdown from "./display-countdown";
import { Button } from "./ui/button";
import useGaeldleStore from "@/stores/gaeldle-store";
import { modesSlice } from "@/stores/modes-slice";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Mode } from "@/types/modes";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { DrawerClose } from "@/components/ui/drawer"
import Placeholders from "@/views/placeholders";

type generateButtonProps = {
  label: string
  description: string
  slug: string
  classNames: string
  isNew: boolean
  buttonKey: string
}

type ModesProps = {
  isInDrawer: boolean
}

export default function Modes({ isInDrawer }: ModesProps) {
  const modesSliceState = useGaeldleStore() as modesSlice;
  const { modes } = modesSliceState;
  const [clickedButton, setClickedButton] = useState<string | null>(null)

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
              {isInDrawer ? (
                <DrawerClose asChild>
                  {buttonMarkup()}
                </DrawerClose>
              ) :
                buttonMarkup()
              }
            </Link>
          </TooltipTrigger>
          <TooltipContent>
            <p>{description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  if (!modes) {
    return <Placeholders />
  }

  return (
    modes &&
    <div className="grid grid-cols-1 gap-6 mt-8 md:grid-cols-3 md:gap-8">
      <div className="relative flex flex-col p-6 bg-white shadow-lg rounded-lg dark:bg-zinc-850 justify-between border-2 border-gael-purple">
        <div className="px-3 py-1 text-lg text-white border-2 border-gael-purple bg-gradient-to-r from-gael-pink to-gael-purple rounded-full inline-block absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          Daily
        </div>
        <div className="mt-5 text-center">
          <ul className="mt-4 space-y-6">
            {modes.filter((mode: Mode) => mode.categoryId === 1).map((mode: Mode, index: number) => {
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
          <div className="mt-5">
            <DisplayCountdown />
          </div>
        </div>
        <div className="mt-6">
        </div>
      </div>
      <div className="relative flex flex-col p-6 bg-white shadow-lg rounded-lg dark:bg-zinc-850 justify-between border-2 border-gael-purple">
        <div className="px-3 py-1 text-lg text-white border-2 border-gael-purple bg-gradient-to-r from-gael-pink to-gael-purple rounded-full inline-block absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          Unlimited
        </div>
        <div className="mt-5 text-center">
          <ul className="mt-4 space-y-6">
            {modes.filter((mode: Mode) => mode.categoryId === 3).map((mode: Mode, index: number) => {
              const buttonKey = generateButtonKey(mode.mode, index)

              return mode.active ? (
                <li key={buttonKey} className="flex items-center">
                  {generateButton({
                    label: mode.label,
                    description: mode.description,
                    slug: mode.mode,
                    classNames: mode.levels.classNames,
                    isNew: mode.isNew,
                    buttonKey: buttonKey
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
        </div>
        <div className="mt-6">
        </div>
      </div>
      <div className="relative flex flex-col p-6 bg-white shadow-lg rounded-lg dark:bg-zinc-850 justify-between border-2 border-gael-purple">
        <div className="px-3 py-1 text-lg text-white border-2 border-gael-purple bg-gradient-to-r from-gael-pink to-gael-purple rounded-full inline-block absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          Specials
        </div>
        <div className="mt-5">
          <ul className="mt-4 space-y-6">
            <li className="flex items-center">
              <Button className="w-full" disabled>
                ?
              </Button>
            </li>
          </ul>
        </div>
        <div className="mt-6">
        </div>
      </div>
    </div>
  )
}
