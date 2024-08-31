'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import Dev from "@/components/dev"
import { comingSoon } from "@/constants/text"
import DisplayCountdown from "@/components/display-countdown"
import Placeholders from "./placeholders"
import useGaeldleStore from "@/stores/gaeldle-store"
import { modesSlice } from "@/stores/modes-slice"
import { useState } from "react"
import Transition from "@/components/transition"

export default function Home() {
  const modesSliceState = useGaeldleStore() as modesSlice;
  const { modes } = modesSliceState;
  const [transition, setTransition] = useState(false)

  if (!modes) {
    return <Placeholders />
  }

  if (transition) {
    return <Transition />
  }

  return (
    modes && !transition &&
    <main className="flex-grow flex flex-col items-center space-y-8 p-4">
      <div>
        <p className="text-2xl">A Wordle clone inspired by <Link className="text-gael-blue hover:text-gael-blue-dark hover:underline" href="https://gamedle.wtf" target="_blank">Gamedle</Link></p>
      </div>
      <div className="container px-4 md:px-6">
        <div className="grid grid-cols-1 gap-6 mt-8 md:grid-cols-3 md:gap-8">
          <div className="relative flex flex-col p-6 bg-white shadow-lg rounded-lg dark:bg-zinc-850 justify-between border-2 border-gael-purple">
            <div className="px-3 py-1 text-lg text-white border-2 border-gael-purple bg-gradient-to-r from-gael-pink to-gael-purple rounded-full inline-block absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              Daily
            </div>
            <div className="mt-5 text-center">
              <ul className="mt-4 space-y-6">
                {modes.filter((mode) => mode.categoryId === 1).map((mode, index) => {
                  return mode.active ? (
                    <li key={mode + '-' + index} className="flex items-center">
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <Button
                            onClick={() => setTransition(true)}
                            className={`w-full ${mode.levels.classNames} shadow-animate`}
                          >
                            <Link className="w-full" href={`${mode.mode}`}>
                              {mode.label}
                            </Link>
                          </Button>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-80">
                          <div className="flex justify-between space-x-4">
                            <p>{mode.description}</p>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
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
                {modes.filter((mode) => mode.categoryId === 3).map((mode, index) => {
                  return mode.active ? (
                    <li key={mode + '-' + index} className="flex items-center">
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <Button
                            onClick={() => setTransition(true)}
                            className={`w-full ${mode.levels.classNames} shadow-animate`}
                          >
                            <Link className="w-full" href={`${mode.mode}`}>
                              {mode.label}
                            </Link>
                          </Button>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-80">
                          <div className="flex justify-between space-x-4">
                            <p>{mode.description}</p>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
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
        <div className="mt-10 text-center">
          <div className="flex space-x-4 w-full justify-center items-center mb-5">
            <Badge className="text-md bg-gael-green hover:bg-gael-green">Easy</Badge>
            <Badge className="text-md bg-yellow-600 hover:bg-yellow-600">Moderate</Badge>
            <Badge className="text-md bg-gael-red hover:bg-gael-red">Hard</Badge>
          </div>

          <p className="text-xl">{comingSoon}</p>

          <Dev />
        </div>
      </div>
    </main>
  )
}
