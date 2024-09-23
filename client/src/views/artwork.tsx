'use client';

import Image from "next/image";
import zArtwork, { socket } from '@/stores/artwork';
import { Button } from "@/components/ui/button"
import PixelatedImage from '@/components/pixelate-image';
import Placeholders from '@/views/placeholders'
import DisplayCountdown from "@/components/display-countdown";
import ComingSoon from "@/components/coming-soon";
import LivesLeftComp from "@/components/lives-left";
import GamesForm from "@/components/games-form";
import { GamesFormInit, imgAlt, imgHeight, imgWidth } from "@/lib/constants";
import ModesHeader from "@/components/modes-header";
import Hearts from "@/components/hearts";
import zGames from "~/src/stores/games";
import zModes from "~/src/stores/modes";

export default function Artwork() {
  const {
    livesLeft, lives, gotdId, played, won, guesses, pixelation, artworkUrl, imageUrl,
    getLivesLeft, getName,
  } = zArtwork();
  const { games } = zGames();
  const { getMode } = zModes();
  const mode = getMode(2);
  const form = GamesFormInit();
  const readySetGo = games && gotdId && mode

  if (!readySetGo) {
    return <Placeholders />
  }

  return (
    readySetGo &&
    <>
      <main className="flex-grow flex flex-col items-center space-y-8">
        <ModesHeader mode={mode} />

        <div className="w-full max-w-md flex flex-col items-center space-y-8 mt-4">
          {
            !played ?
              <PixelatedImage
                imageUrl={artworkUrl}
                width={imgWidth}
                height={imgHeight}
                pixelationFactor={pixelation}
                alt={imgAlt(mode?.label)}
              />
              :
              <div className="relative">
                <Image
                  placeholder='empty'
                  src={artworkUrl}
                  width={imgWidth}
                  height={imgHeight}
                  style={{ objectFit: "contain", width: "auto", height: "auto" }}
                  alt={imgAlt(mode?.label)}
                  priority
                />
                <div className="absolute -bottom-8 -left-8 transform rotate-12">
                  <Image
                    placeholder='empty'
                    src={imageUrl}
                    width={128}
                    height={128}
                    alt={imgAlt(mode?.label) + ' (Cover)'}
                    className="rounded-md border-4 border-white shadow-lg"
                    priority
                  />
                </div>
              </div>
          }

          <div className="text-lg text-center">
            <p className="mb-5">
              {played ? `${getName()}` : `🤔`}
            </p>

            <LivesLeftComp played={played} won={won} livesLeft={livesLeft} />

            <div className="flex justify-center space-x-2 mt-8">
              <Hearts lives={lives} livesLeft={livesLeft} />
            </div>

            <GamesForm
              form={form}
              modeSlug={mode.mode}
              guesses={guesses}
              socket={socket}
              getLivesLeft={getLivesLeft}
              played={played}
            />

            <div className="w-full max-w-md flex flex-col">
              <div className="mt-4" aria-live="polite">
                {guesses.map((game, index) => (
                  <div key={(game ? game.igdbId + '-guessed-' : 'skipped-') + index} className="p-2 bg-gael-red text-white rounded border border-3">
                    {game ? game.name : 'SKIPPED'}
                  </div>
                ))}
              </div>
            </div>

            <div>
              {process.env.NODE_ENV === 'development' &&
                <div className="mt-10 mb-5">
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
    </>
  )
}
