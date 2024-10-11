"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import zCover, { socket } from "@/stores/cover";
import zGames from "@/stores/games";
import { Button } from "@/components/ui/button";
import PixelatedImage from "@/components/pixelate-image";
import Placeholders from "@/views/placeholders";
import LivesLeftComp from "@/components/lives-left";
import GamesForm from "@/components/games-form";
import {
  GamesFormInit,
  imgAlt,
  imgHeight,
  imgWidth,
  streakCounters,
} from "~/src/lib/client-constants";
import ModesHeader from "@/components/modes-header";
import Hearts from "@/components/hearts";
import zModes from "~/src/stores/modes";
import MyBadgeGroup from "../components/my-badge-group";
import { Card, CardContent } from "../components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../components/ui/collapsible";
import { ChevronsUpDown } from "lucide-react";
import { useState } from "react";

export default function Cover() {
  const pathname = usePathname();
  const [guessesCollapsibleOpen, setGuessesCollapsibleOpen] = useState(true);
  const {
    livesLeft,
    lives,
    played,
    won,
    guesses,
    pixelation,
    imageUrl,
    finito,
    getStreak,
    getBestStreak,
    getLivesLeft,
    getName,
    resetPlay,
    continuePlay,
  } = zCover();
  const { games } = zGames();
  const { getModeBySlug } = zModes();
  const mode = getModeBySlug(pathname);
  const form = GamesFormInit();
  const readySetGo = games && imageUrl && mode;

  const renderButton = () => {
    if (livesLeft === 0) {
      return (
        <Button
          className="bg-gradient-to-r from-gael-pink to-gael-purple via-gael-red hover:bg-gradient-to-r hover:from-gael-pink-dark hover:to-gael-purple-dark hover:via-gael-red-dark text-white text-md font-semibold"
          onClick={(e) => {
            e.preventDefault();
            form.reset();
            resetPlay();
          }}
        >
          Play again
        </Button>
      );
    }

    if (won) {
      return (
        <Button
          className="bg-gradient-to-r bg-gradient-to-r from-blue-500 to-teal-400 hover:bg-gradient-to-r hover:from-blue-700 hover:to-teal-600 text-white text-md font-semibold"
          onClick={(e) => {
            e.preventDefault();
            form.reset();
            continuePlay();
          }}
          disabled={finito}
        >
          {finito ? "All done! 🤩" : "Keep playing!"}
        </Button>
      );
    }
  };

  if (!readySetGo) {
    return <Placeholders />;
  }

  return (
    readySetGo && (
      <div className="flex flex-col min-h-screen">
        <div className="flex-grow container mx-auto px-4">
          <div className="flex justify-center">
            <ModesHeader mode={mode} />
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex flex-col items-center text-center">
              <Card className="relative rounded-2xl overflow-x-auto shadow-md bg-cyan-50">
                <CardContent className="p-0">
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
                      className="relative z-10"
                      style={{
                        objectFit: "contain",
                        width: "auto",
                        height: "auto",
                      }}
                      alt={imgAlt(mode.label)}
                      loading="lazy"
                    />
                  )}
                  <div className="relative z-10 items-center justify-center my-4 p-2">
                    <MyBadgeGroup
                      group={streakCounters(getStreak(), getBestStreak())}
                      textColor="black"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gray-200/30 backdrop-blur-sm"></div>
                </CardContent>
              </Card>

              {process.env.NODE_ENV === "development" && (
                <div className="w-full rounded-lg bg-gray-100 border border-2 border-red-400 mt-8">
                  <Button onClick={() => form.reset()}>Clear Form</Button>
                </div>
              )}
            </div>

            <div className="flex flex-col items-center text-center p-6 relative">
              <div className="text-lg text-center space-y-1">
                <p>{played ? `${getName()}` : `🤔`}</p>
                <div className="flex justify-center space-x-2">
                  <Hearts lives={lives} livesLeft={livesLeft} />
                </div>
                <LivesLeftComp
                  played={played}
                  won={won}
                  livesLeft={livesLeft}
                  lives={lives}
                />
              </div>

              <GamesForm
                form={form}
                modeSlug={mode.mode}
                guesses={guesses}
                socket={socket}
                getLivesLeft={getLivesLeft}
                played={played}
                additionalButton={renderButton()}
              />

              <div className="flex flex-col p-5 w-full justify-center -mt-4 mb-8">
                {guesses.length > 0 && (
                  <Collapsible
                    open={guessesCollapsibleOpen}
                    onOpenChange={setGuessesCollapsibleOpen}
                    className="items-center"
                  >
                    <div className="flex items-center justify-center space-x-4 px-4">
                      <CollapsibleTrigger asChild>
                        <div
                          className="flex items-center justify-center space-x-2 border border-gray-200 rounded-lg px-2 py-1"
                          role="button"
                        >
                          <p className="text-md font-semibold w-full">
                            {guessesCollapsibleOpen ? "Hide" : "Show"} Guesses
                          </p>
                          <Button variant="ghost" size="sm" className="w-9 p-0">
                            <ChevronsUpDown className="h-4 w-4" />
                            <span className="sr-only">Toggle</span>
                          </Button>
                        </div>
                      </CollapsibleTrigger>
                    </div>
                    <CollapsibleContent>
                      <div className="space-y-2 w-full mt-4">
                        {guesses.map((game, index) => (
                          <div
                            className="flex w-full space-x-2"
                            key={
                              (game ? game.igdbId + "-guessed-" : "skipped-") +
                              index
                            }
                          >
                            <div className="p-2 bg-gael-red text-white rounded-2xl border border-3 w-full">
                              {game ? game.name : "SKIPPED"}
                            </div>
                            {/* <div className="p-2 bg-gael-blue text-white rounded-2xl border border-3 w-full">
                              TBD
                            </div> */}
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  );
}
