'use client'

import Link from "next/link"
import MyBadgeGroup from "~/src/components/my-badge-group"
import { levels } from '~/src/lib/client-constants'
import ComingSoon from "@/components/coming-soon"
import Modes from "@/components/modes"
import zModes from "@/stores/modes"
import zCategories from "@/stores/categories"
import Placeholders from "@/views/placeholders"

export default function Home() {
  const { modes } = zModes();
  const { categories } = zCategories();
  const readySetGo = modes && categories;

  if (!readySetGo) {
    return <Placeholders />;
  }

  return readySetGo && (
    <main className="flex-grow flex flex-col items-center space-y-8 p-4">
      <p className="text-2xl justify-center text-center">
        A
        {' '}
        <Link
          className="text-gael-blue hover:text-gael-blue-dark hover:underline"
          href="https://www.nytimes.com/games/wordle"
          target="_blank"
        >
          Wordle
        </Link>
        {' '}
        clone inspired by
        {' '}
        <Link
          className="text-gael-blue hover:text-gael-blue-dark hover:underline"
          href="https://gamedle.wtf"
          target="_blank"
        >
          Gamedle
        </Link>
      </p>

      <div className="container px-4 md:px-6">
        <Modes />
        <MyBadgeGroup group={levels} />
        <ComingSoon />
      </div>
    </main>
  )
}
