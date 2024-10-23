"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronsUpDown, Loader2 } from "lucide-react";
import zModes from "@/stores/modes";
import ModesHeader from "@/components/modes-header";
import Placeholders from "@/views/placeholders";
import Hearts from "@/components/hearts";
import LivesLeftComp from "@/components/lives-left";
import zHilo from "@/stores/hilo";
import MyBadgeGroup from "@/components/my-badge-group";
import {
  streakCounters,
  timeline2Legend as hiloLegend,
} from "@/lib/client-constants";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import PlaceholderCard from "@/components/placeholder-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GameCard from "@/components/game-card";
import { Game } from "@/types/games";
import { Badge } from "@/components/ui/badge";
import { GuessHilo } from "@/types/zhilo";

export default function Hilo() {
  const pathname = usePathname();
  const {
    timeline,
    guesses,
    livesLeft,
    lives,
    played,
    won,
    nextGame,
    currentGame,
    operator,
    getStreak,
    getBestStreak,
    submitOperator,
    resetPlay,
  } = zHilo();
  const { getModeBySlug } = zModes();
  const [tgCollapsibleOpen, setTgCollapsibleOpen] = useState(false);
  const mode = getModeBySlug(pathname);
  const gameOver = played && !won;
  const buttonDisabled =
    played || livesLeft === 0 || !nextGame || operator !== "=";
  const readySetGo = !!mode;

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

          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center">
              {nextGame ? (
                <GameCard card={nextGame} />
              ) : (
                <div className="mb-4">
                  <PlaceholderCard />
                </div>
              )}
              <div className="flex flex-col items-center mt-7">
                <MyBadgeGroup
                  group={streakCounters(getStreak(), getBestStreak())}
                  textColor="black"
                />
              </div>
            </div>

            <div className="flex flex-col items-center text-center">
              {lives > 0 ? (
                <div className="text-lg text-center space-y-1">
                  <div className="flex justify-center space-x-2">
                    <Hearts lives={lives} livesLeft={livesLeft} size={"md"} />
                  </div>
                  <LivesLeftComp
                    played={played}
                    won={won}
                    livesLeft={livesLeft}
                    lives={lives}
                  />
                </div>
              ) : (
                <div className="text-lg text-center p-8">
                  <Loader2 className="flex items-center justify-center h-5 w-5 animate-spin" />
                </div>
              )}
              <div className="border border-2 border-dashed border-black rounded-md p-4 mt-5">
                <div className="flex space-x-2 w-full p-4 justify-center items-center">
                  <Button
                    type="button"
                    className="bg-rose-700 hover:bg-rose-800 w-full text-md font-semibold"
                    disabled={buttonDisabled}
                    onClick={() => submitOperator("<")}
                  >
                    {operator === "<" && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Released Before
                  </Button>
                  <Button
                    type="button"
                    className="bg-sky-700 hover:bg-sky-800 w-full text-md font-semibold"
                    disabled={buttonDisabled}
                    onClick={() => submitOperator(">")}
                  >
                    {operator === ">" && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Released After
                  </Button>
                </div>
                <small className="font-semibold">
                  NB: Ties are marked as correct either way
                </small>
              </div>
            </div>

            <div className="flex flex-col items-center text-center">
              {currentGame ? (
                <GameCard card={currentGame} />
              ) : (
                <div className="mb-4">
                  <PlaceholderCard />
                </div>
              )}
              <div className="flex flex-col items-center mt-7">
                <MyBadgeGroup group={hiloLegend} />
              </div>
            </div>
          </div>
          {timeline.length > 1 && guesses.length > 0 && (
            <Collapsible
              open={tgCollapsibleOpen || (gameOver && !tgCollapsibleOpen)}
              onOpenChange={setTgCollapsibleOpen}
              className="items-center mt-5 md:mt-0"
            >
              <div
                className={`flex items-center justify-center space-x-4 px-4 ${gameOver && "hidden"}`}
              >
                <CollapsibleTrigger asChild>
                  <div
                    className="flex items-center justify-center space-x-2 border border-gray-200 rounded-lg px-2 py-1"
                    role="button"
                  >
                    <p className="text-md font-semibold w-full">
                      {tgCollapsibleOpen ? "Hide" : "Show"} Timeline & Guesses
                    </p>
                    <Button variant="ghost" size="sm" className="w-9 p-0">
                      <ChevronsUpDown className="h-4 w-4" />
                      <span className="sr-only">Toggle</span>
                    </Button>
                  </div>
                </CollapsibleTrigger>
              </div>
              <div
                className={`flex items-center justify-center space-x-4 px-2 py-1 ${!gameOver && "hidden"}`}
              >
                <Button
                  className="bg-gradient-to-r from-gael-pink to-gael-purple via-gael-red hover:bg-gradient-to-r hover:from-gael-pink-dark hover:to-gael-purple-dark hover:via-gael-red-dark text-white text-md font-semibold"
                  onClick={() => {
                    resetPlay();
                  }}
                >
                  Play again
                </Button>
              </div>
              <CollapsibleContent>
                <Tabs defaultValue="timeline" className="mt-5">
                  <TabsList className="grid grid-cols-2">
                    <TabsTrigger value="timeline" className="font-semibold">
                      Timeline
                    </TabsTrigger>
                    <TabsTrigger value="guesses" className="font-semibold">
                      Guesses
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="timeline">
                    <div className="flex justify-center mt-5 rounded-lg border-dashed border-2 border-black overflow-x-auto px-8 py-8">
                      <div className="flex flex-row justify-start px-2 space-x-4 overflow-x-auto">
                        <div className="flex justify-start p-0 space-x-4">
                          {" "}
                          {timeline.map((game: Partial<Game>) => (
                            <GameCard key={game.igdbId} card={game} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="guesses">
                    {guesses.map((guess: GuessHilo, index: number) => {
                      const { currentGame, nextGame, operator, rightAnswer } =
                        guess;
                      const badgeClass =
                        "text-sm text-center font-semibold " +
                        (rightAnswer
                          ? "bg-green-100 hover:bg-green-100 text-green-800 border-green-400"
                          : "bg-red-100 hover:bg-red-100 text-red-800 border-red-400");
                      const operatorClass = rightAnswer
                        ? "text-green-600"
                        : "text-red-600";

                      return (
                        <div key={index} className="mt-4 mb-4 p-0">
                          <div className="flex justify-center space-x-2 mt-2">
                            <Badge className={`${badgeClass}`}>
                              {guesses.length - index}
                            </Badge>
                          </div>
                          <div className="flex justify-center mt-5">
                            <div className="flex flex-row justify-start px-2 space-x-4 overflow-x-auto">
                              <div className="flex justify-start p-0 space-x-4">
                                <GameCard
                                  key={nextGame.igdbId}
                                  card={nextGame}
                                />
                                <p
                                  className={`my-auto text-4xl font-semibold ${operatorClass}`}
                                >
                                  {operator}=
                                </p>
                                <GameCard
                                  key={currentGame.igdbId}
                                  card={currentGame}
                                />
                              </div>
                            </div>
                          </div>
                          {guesses.length - index > 1 && (
                            <hr className="mt-8" />
                          )}
                        </div>
                      );
                    })}
                  </TabsContent>
                </Tabs>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </div>
    )
  );
}
