'use client'

import { usePathname } from 'next/navigation';
import { useState } from "react"
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { ChevronsUpDown } from "lucide-react"
import ComingSoon from "@/components/coming-soon";
import { Game, Games } from "~/src/types/games";
import zModes from "~/src/stores/modes";
import Placeholders from "~/src/views/placeholders";
import ModesHeader from "~/src/components/modes-header";
import Hearts from "~/src/components/hearts";
import zTriviary from "@/stores/triviary";
import { SortableItem } from "@/components/sortable-item";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import GameCard from "@/components/game-card";
import MyBadgeGroup from "~/src/components/my-badge-group"
import { triviaryLegend } from '~/src/lib/client-constants'
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import LivesLeftComp from '@/components/lives-left';

export default function Triviary() {
  const pathname = usePathname();
  const {
    timeline, livesLeft, lives, played, won, goodTimeline, guesses, alreadyGuessed, submitButtonText, dummyOnLoad,
    updateTimeline, submitAnswer, setLastGuess, resetPlay,
  } = zTriviary();
  const { getModeBySlug } = zModes();
  const mode = getModeBySlug(pathname);
  const [attemptsCollapsibleOpen, setAttemptsCollapsibleOpen] = useState(false)
  const readySetGo = mode && timeline.length > 0;
  const gameOver = played && !won;
  const mouseSensor = useSensor(MouseSensor);
  const touchSensor = useSensor(TouchSensor);
  const sensors = useSensors(mouseSensor, touchSensor);

  if (!readySetGo) {
    return <Placeholders />
  }

  return (
    readySetGo &&
    <>
      <DndContext
        onDragEnd={handleDragEnd}
        sensors={sensors}
      >
        <div className="flex flex-col min-h-screen">
          <main className="mx-auto px-4">
            <ModesHeader mode={mode} />

            <div className={`flex flex-col p-4 mt-5 mb-5 justify-center bg-white shadow-sm ${process.env.NODE_ENV === 'development' && "border border-gray-200"}`}>
              <div className="flex justify-center space-x-2">
                <Hearts lives={lives} livesLeft={livesLeft} size={'md'} />
              </div>
              <div className="flex justify-center space-x-2 mt-5">
                <LivesLeftComp played={played} won={won} livesLeft={livesLeft} lives={lives} />
              </div>
              <div className="flex justify-center space-x-2 -mt-2">
                <MyBadgeGroup group={triviaryLegend} />
              </div>

              <div className="flex justify-center mt-5">
                <div className="flex flex-col p-2 rounded-lg bg-white shadow-sm border-dashed border-2 border-gray-600 p-4">
                  {!(gameOver || won) &&
                    <div className="flex justify-start p-2 space-x-4">
                      <SortableContext
                        items={timeline.map(card => card?.igdbId ?? 0)}
                        strategy={horizontalListSortingStrategy}
                      >
                        {timeline.map((card: Partial<Game>) => (
                          <SortableItem
                            key={card.igdbId}
                            id={card.igdbId ?? 0}
                          >
                            <GameCard card={card} showBar={!gameOver} />
                          </SortableItem>
                        ))}
                      </SortableContext>
                    </div>}

                  {won &&
                    <>
                      {/* <div className="flex justify-center">
                        <Badge className="text-md bg-indigo-100 hover:bg-indigo-100 text-indigo-800 border-indigo-400 text-center font-semibold">
                          Answer
                        </Badge>
                      </div> */}
                      <div className="flex flex-col rounded-lg bg-white">
                        <div className="flex justify-start p-2 space-x-4">
                          {timeline.map((card: Partial<Game>) => (
                            <GameCard key={card.igdbId} card={card} showBar={won} />
                          ))}
                        </div>
                      </div>
                    </>
                  }

                  {gameOver &&
                    <>
                      {/* <div className="flex justify-center">
                        <Badge className="text-md bg-indigo-100 hover:bg-indigo-100 text-indigo-800 border-indigo-400 text-center font-semibold">
                          Answer
                        </Badge>
                      </div> */}
                      <div className="flex flex-col rounded-lg bg-white">
                        <div className="flex justify-start p-2 space-x-4">
                          {goodTimeline.map((card: Partial<Game>) => (
                            <GameCard key={card.igdbId} card={card} showBar={true} />
                          ))}
                        </div>
                      </div>
                    </>
                  }
                </div>
              </div>

              <div className="flex justify-center mt-7">
                {!(played || won) ?
                  <div className="flex justify-start p-2 space-x-8">
                    <Button
                      onClick={submitAnswer}
                      className="bg-gradient-to-r from-gael-pink to-gael-purple via-gael-red hover:bg-gradient-to-r hover:from-gael-pink-dark hover:to-gael-purple-dark hover:via-gael-red-dark text-white text-md font-semibold tracking-sm"
                      disabled={dummyOnLoad || played || alreadyGuessed}
                    >
                      {submitButtonText}
                    </Button>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={setLastGuess}
                            className="bg-gradient-to-r from-gael-blue to-gael-green via-teal-700 hover:bg-gradient-to-r hover:from-gael-blue-dark hover:to-gael-green-dark hover:via-teal-900 text-white text-md font-semibold tracking-sm"
                            disabled={guesses.length === 0 || (guesses.length > 0 && alreadyGuessed) || played}
                          >
                            Reset
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Rearrange cards in their last submitted order</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  : <Button
                    onClick={resetPlay}
                    className="bg-gradient-to-r from-gael-pink to-gael-purple via-gael-red hover:bg-gradient-to-r hover:from-gael-pink-dark hover:to-gael-purple-dark hover:via-gael-red-dark text-white text-md font-semibold tracking-sm"
                  >
                    Play again
                  </Button>
                }
              </div>
            </div>

            <div className={`flex flex-col p-5 justify-center bg-white shadow-sm ${process.env.NODE_ENV === 'development' && "border border-gray-200"}`}>
              {guesses.length > 0 &&
                <Collapsible
                  open={attemptsCollapsibleOpen}
                  onOpenChange={setAttemptsCollapsibleOpen}
                  className="items-center"
                >
                  <div className="flex items-center justify-center space-x-4 px-4 mb-4">
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-center space-x-2 border border-gray-200 rounded-lg px-2 py-1">
                        <h4 className="text-sm font-semibold pl-4">
                          {attemptsCollapsibleOpen ? 'Hide' : 'Show'} Attempts
                        </h4>
                        <Button variant="ghost" size="sm" className="w-9 p-0">
                          <ChevronsUpDown className="h-4 w-4" />
                          <span className="sr-only">Toggle</span>
                        </Button>
                      </div>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent>
                    {
                      guesses.map((timeline: Games, index: number) => {
                        const showBar = false;

                        return (
                          <div key={index} className="mb-8">
                            <div className="flex justify-center space-x-2 mt-2 mb-2">
                              <Badge className="text-sm bg-red-100 hover:bg-red-100 text-red-800 border-red-400 text-center font-semibold">
                                {guesses.length - index}
                              </Badge>
                            </div>
                            <div className={`flex justify-start p-2 space-x-4 ${!showBar && "grayscale hover:grayscale-0"}`}>
                              {timeline.map((card: Partial<Game>) => (
                                <GameCard key={card.igdbId} card={card} showBar={false} />
                              ))}
                            </div>
                          </div>
                        )
                      })
                    }
                  </CollapsibleContent>
                </Collapsible>
              }
            </div>
          </main>

          <div className="mt-20">
            <ComingSoon />
          </div>
        </div >
      </DndContext >
    </>
  )

  function handleDragEnd(e: DragEndEvent) {
    if (!e.over) {
      return;
    }

    if (e.active.id !== e.over.id) {
      const oldIdx = timeline.findIndex(card => card.igdbId === e.active.id);
      const newIdx = timeline.findIndex(card => card.igdbId === e.over!.id);
      const newTimeline = arrayMove(timeline, oldIdx, newIdx);
      updateTimeline(newTimeline);
    }
  }
}
