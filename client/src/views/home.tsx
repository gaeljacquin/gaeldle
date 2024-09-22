'use client'

import Link from "next/link"
import Placeholders from "~/src/views/placeholders"
import Levels from "@/components/levels"
import ComingSoon from "@/components/coming-soon"
import zModes from "@/stores/modes"
import dynamic from 'next/dynamic'

const DynamicModes = dynamic(() => import('@/components/modes'), {
  ssr: false,
})

export default function Home() {
  const { modes } = zModes();

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
        <DynamicModes isInDrawer={false} />
        <Levels />
        <ComingSoon />
      </div>
    </main>
  )
}
