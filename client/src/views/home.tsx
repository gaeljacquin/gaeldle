'use client'

import Link from "next/link"
import Placeholders from "./placeholders"
import useGaeldleStore from "@/stores/gaeldle-store"
import { modesSlice } from "@/stores/modes-slice"
import Modes from "@/components/modes"
import Levels from "@/components/levels"
import MainDev from "@/components/dev/main-dev"
import ComingSoon from "@/components/coming-soon"

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
        <p className="text-2xl">
          A Wordle clone inspired by
          {' '}
          <Link className="text-gael-blue hover:text-gael-blue-dark hover:underline" href="https://gamedle.wtf" target="_blank">
            Gamedle
          </Link>
        </p>
      </div>
      <div className="container px-4 md:px-6">
        <Modes isInDrawer={false} />
        <Levels />
        <ComingSoon />
        <MainDev />
      </div>
    </main>
  )
}
