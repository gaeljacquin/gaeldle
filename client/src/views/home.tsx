'use client'

import Link from "next/link";
import useGaeldleStore from "@/stores/gaeldle-store";
import { modesSlice } from "@/stores/modes-slice";
import Placeholders from "./placeholders";
import { Button } from "@/components/ui/button";

export default function Home() {
  const modesSliceState = useGaeldleStore() as modesSlice;
  const { modes } = modesSliceState;

  if (!modes) {
    return <Placeholders />
  }

  return (
    modes &&
    <>
      <main className="flex-grow flex flex-col items-center space-y-8 p-4">
        <div className="relative w-full max-w-md">
          <div className="grid grid-cols-1 gap-4 p-4">
            {modes.map((mode, index) => (
              mode.active
                ? <Link
                  key={mode.mode + '-' + index}
                  href={`/${mode.mode}`}
                  className={`inline-flex items-center justify-center rounded-md bg-gael-green hover:bg-gael-green-dark px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50`}
                  prefetch={false}
                >
                  {mode.label}
                </Link>
                : <Button
                  key={mode.mode + '-' + index}
                  className="bg-gray-900"
                  disabled
                >
                  {mode.label}
                </Button>
            ))}
          </div>
        </div>
      </main>
    </>
  )
}
