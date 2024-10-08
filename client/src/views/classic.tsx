"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import zClassic, { socket } from "@/stores/classic";
import zGames from "@/stores/games";
import { Button } from "@/components/ui/button";
import PixelatedImage from "@/components/pixelate-image";
import Placeholders from "@/views/placeholders";
import DisplayCountdown from "@/components/display-countdown";
import LivesLeftComp from "@/components/lives-left";
import GamesForm from "@/components/games-form";
import {
  GamesFormInit,
  imgAlt,
  imgHeight,
  imgWidth,
} from "~/src/lib/client-constants";
import ModesHeader from "@/components/modes-header";
import Hearts from "@/components/hearts";
import zModes from "~/src/stores/modes";

export default function Classic() {
  const pathname = usePathname();
  const {
    livesLeft,
    lives,
    gotdId,
    played,
    won,
    guesses,
    pixelation,
    imageUrl,
    getLivesLeft,
    getName,
  } = zClassic();
  const { games } = zGames();
  const { getModeBySlug } = zModes();
  const mode = getModeBySlug(pathname);
  const form = GamesFormInit();
  const readySetGo = games && gotdId && mode;

  if (!readySetGo) {
    return <Placeholders />;
  }

  return (
    readySetGo && (
      <>
        <div className="flex flex-col min-h-screen">
          <div className="flex-grow container mx-auto px-4">
            <ModesHeader mode={mode} />

            <div className="grid md:grid-cols-2 gap-8">
              <div
                className={`flex flex-col items-center text-center p-6 bg-white shadow-sm rounded-lg ${process.env.NODE_ENV === "development" && "border border-gray-200 "}`}
              >
                {!played ? (
                  <PixelatedImage
                    imageUrl={imageUrl}
                    width={imgWidth}
                    height={imgHeight}
                    pixelationFactor={pixelation}
                    alt={imgAlt(mode.label)}
                  />
                ) : (
                  <Image
                    placeholder="empty"
                    src={imageUrl}
                    width={imgWidth}
                    height={imgHeight}
                    style={{
                      objectFit: "contain",
                      width: "auto",
                      height: "auto",
                    }}
                    alt={imgAlt(mode.label)}
                    priority
                  />
                )}
              </div>

              <div
                className={`flex flex-col items-center text-center p-6 rounded-lg bg-white shadow-sm relative ${process.env.NODE_ENV === "development" && "border border-gray-200 "}`}
              >
                <>
                  <div className="text-lg text-center">
                    <p className="mb-5">{played ? `${getName()}` : `🤔`}</p>

                    <LivesLeftComp
                      played={played}
                      won={won}
                      livesLeft={livesLeft}
                      lives={lives}
                    />
                  </div>

                  <div className="flex justify-center space-x-2 mt-8">
                    <Hearts lives={lives} livesLeft={livesLeft} />
                  </div>
                </>

                <GamesForm
                  form={form}
                  modeSlug={mode.mode}
                  guesses={guesses}
                  socket={socket}
                  getLivesLeft={getLivesLeft}
                  played={played}
                />

                <div className="w-full flex flex-col">
                  <div className="mt-4" aria-live="polite">
                    {guesses.map((game, index) => (
                      <div
                        key={
                          (game ? game.igdbId + "-guessed-" : "skipped-") +
                          index
                        }
                        className="p-2 bg-gael-red text-white rounded border border-3"
                      >
                        {game ? game.name : "SKIPPED"}
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  className={`absolute bottom-0 left-0 right-0 p-4 rounded-b-lg ${process.env.NODE_ENV === "development" && "bg-gray-100 border-t border-gray-200"}`}
                >
                  {process.env.NODE_ENV === "development" && (
                    <div className="mb-5">
                      <Button onClick={() => form.reset()}>Clear Form</Button>
                    </div>
                  )}

                  <div className="max-w-3xl mx-auto mt-10 text-center">
                    <DisplayCountdown />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  );
}
