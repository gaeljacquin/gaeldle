'use client'

import Link from "next/link"
import Dev from "@/components/dev"
import { comingSoon } from "@/constants/text"
import Placeholders from "./placeholders"
import useGaeldleStore from "@/stores/gaeldle-store"
import { modesSlice } from "@/stores/modes-slice"
import Modes from "@/components/modes"
import Levels from "@/components/levels"

export default function Home() {
  const modesSliceState = useGaeldleStore() as modesSlice;
  const { modes } = modesSliceState;

  if (!modes) {
    return <Placeholders />
  }

  return (
    modes &&
    <main className="flex-grow flex flex-col items-center space-y-8 p-4">
      <div>
        <p className="text-2xl">A Wordle clone inspired by <Link className="text-gael-blue hover:text-gael-blue-dark hover:underline" href="https://gamedle.wtf" target="_blank">Gamedle</Link></p>
      </div>
      <div className="container px-4 md:px-6">
        <Modes />
        <Levels />
        <div className="mt-10 text-center">
          <p className="text-xl">{comingSoon}</p>

          <Dev />
        </div>
      </div>
    </main>
  )
}
