'use client';

import Image from "next/image";
import { usePathname } from 'next/navigation';
import zKeywords, { socket } from '@/stores/keywords';
import zGames from '@/stores/games';
import { Button } from "@/components/ui/button"
import Placeholders from '@/views/placeholders'
import DisplayCountdown from "@/components/display-countdown";
import ComingSoon from "@/components/coming-soon";
import LivesLeftComp from "@/components/lives-left";
import ModesHeader from "@/components/modes-header";
import GamesForm from "@/components/games-form";
import { GamesFormInit, imgAlt, imgHeight, imgWidth } from "~/src/lib/client-constants";
import Hearts from "@/components/hearts";
import zModes from "~/src/stores/modes";

export default function Keywords() {
  const pathname = usePathname();
  const {
    livesLeft, lives, gotdId, played, won, guesses, keywords, imageUrl, numKeywords,
    getLivesLeft, getName,
  } = zKeywords();
  const { games } = zGames();
  const { getModeBySlug } = zModes();
  const mode = getModeBySlug(pathname);
  const form = GamesFormInit();
  const readySetGo = games && gotdId && mode

  if (!readySetGo) {
    return <Placeholders />
  }

  return (
    readySetGo &&
    <>
      <div className="flex flex-col min-h-screen">
        <main className="flex-grow container mx-auto px-4">
          <ModesHeader mode={mode} />

          <div className="grid md:grid-cols-2 gap-8">
            <div className={`flex flex-col items-center text-center p-6 bg-white shadow-sm rounded-lg ${process.env.NODE_ENV === 'development' && "border border-gray-200"}`}>
              {
                played &&
                <Image
                  placeholder='empty'
                  src={imageUrl}
                  width={imgWidth}
                  height={imgHeight}
                  style={{ objectFit: "contain", width: "auto", height: "auto" }}
                  alt={imgAlt(mode?.label)}
                  className="mb-8"
                  priority
                />
              }
              <p className="mb-4 font-md font-light">1 keyword is revealed per attempt. All keywords are revealed on the final attempt.</p>
              <p className="mb-4 font-md font-light">Today&apos;s game has <span className="font-bold">{numKeywords}</span> keywords</p>
              <div className="flex flex-wrap gap-3">
                {keywords.map((keyword, index) => (
                  <span key={keyword + '-' + index} className='bg-gael-purple text-white px-4 py-2 rounded-full text-md'>
                    {keyword}
                  </span>
                ))}
              </div>
              {
                !played &&
                <div
                  style={{ width: imgWidth, height: imgHeight }}
                />
              }
            </div>

            <div className={`flex flex-col items-center text-center p-6 rounded-lg bg-white shadow-sm relative ${process.env.NODE_ENV === 'development' && "border border-gray-200 "}`}>
              <>
                <div className="text-lg text-center">
                  <p className="mb-5">
                    {played ? `${getName()}` : `🤔`}
                  </p>

                  <LivesLeftComp played={played} won={won} livesLeft={livesLeft} lives={lives} />
                </div>

                <div className="flex justify-center space-x-2 mt-8">
                  <Hearts lives={lives} livesLeft={livesLeft} />
                </div>
              </>

              <div className="w-full max-w-md flex flex-col">
                <GamesForm
                  form={form}
                  modeSlug={mode.mode}
                  guesses={guesses}
                  socket={socket}
                  getLivesLeft={getLivesLeft}
                  played={played}
                />
              </div>

              <div className="w-full max-w-md flex flex-col">
                <div className="mt-4" aria-live="polite">
                  {guesses.map((game, index) => (
                    <div key={(game ? game.igdbId + '-guessed-' : 'skipped-') + index} className="p-2 bg-gael-red text-white rounded border border-3">
                      {game ? game.name : 'SKIPPED'}
                    </div>
                  ))}
                </div>
              </div>

              <div className={`absolute bottom-0 left-0 right-0 p-4 rounded-b-lg ${process.env.NODE_ENV === 'development' && "bg-gray-100 border-t border-gray-200"}`}>
                {process.env.NODE_ENV === 'development' &&
                  <div className="mb-5">
                    <Button onClick={() => form.reset()}>Clear Form</Button>
                  </div>
                }

                <div className="max-w-3xl mx-auto mt-10 text-center">
                  <DisplayCountdown />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-20">
            <ComingSoon />
          </div>
        </main>
      </div>
    </>
  )
}
