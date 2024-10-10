"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  rectSwappingStrategy,
  arrayMove,
  arraySwap,
} from "@dnd-kit/sortable";
import { ChevronsUpDown } from "lucide-react";
import { Game, Games } from "~/src/types/games";
import zModes from "~/src/stores/modes";
import Placeholders from "~/src/views/placeholders";
import ModesHeader from "~/src/components/modes-header";
import Hearts from "~/src/components/hearts";
import zTriviary from "@/stores/triviary";
import SortableItem from "@/components/sortable-item";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import GameCard from "@/components/game-card";
import MyBadgeGroup from "~/src/components/my-badge-group";
import {
  bgCorrect,
  bgPartial,
  streakCounters,
  triviaryLegend,
} from "~/src/lib/client-constants";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import LivesLeftComp from "@/components/lives-left";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";

export default function Triviary() {
  const pathname = usePathname();
  const {
    timeline,
    livesLeft,
    lives,
    played,
    won,
    goodTimeline,
    guesses,
    alreadyGuessed,
    submitButtonText,
    dummyOnLoad,
    dragSwitch,
    updateTimeline,
    submitAnswer,
    setLastGuess,
    resetPlay,
    getStreak,
    getBestStreak,
    setDragSwitch,
  } = zTriviary();
  const { getModeBySlug } = zModes();
  const mode = getModeBySlug(pathname);
  const [attemptsCollapsibleOpen, setAttemptsCollapsibleOpen] = useState(false);
  const [activeId, setActiveId] = useState(0); // id = igdbId in this context
  const mouseSensor = useSensor(MouseSensor);
  const touchSensor = useSensor(TouchSensor);
  const sensors = useSensors(mouseSensor, touchSensor);
  const readySetGo = mode && timeline.length > 0;
  const gameOver = played && !won;
  const correctIgdbs =
    timeline
      ?.filter((game) => game.bgStatus === bgCorrect)
      .map((game) => game.igdbId) ?? [];

  if (!readySetGo) {
    return <Placeholders />;
  }

  return (
    readySetGo && (
      <>
        <DndContext
          onDragEnd={handleDragEnd}
          onDragStart={handleDragStart}
          sensors={sensors}
        >
          <div className="flex flex-col min-h-screen">
            <ModesHeader mode={mode} />

            <div
              className={`flex flex-col mb-5 justify-center bg-white shadow-sm ${
                process.env.NODE_ENV === "development" &&
                "border border-gray-200"
              }`}
            >
              <div className="flex justify-center">
                <div
                  className={`px-4 py-8 rounded-lg bg-white shadow-sm border-dashed border-4 ${dragSwitch ? "border-gael-green-dark" : "border-gael-red-dark"} overflow-x-auto`}
                >
                  <div className="flex flex-col md:flex-row justify-between items-center space-y-8 md:space-y-0 mb-7">
                    <div className="mb-4 md:mb-0 space-y-4">
                      <div className="flex justify-center md:justify-start space-x-2">
                        <Hearts
                          lives={lives}
                          livesLeft={livesLeft}
                          size={"md"}
                        />
                      </div>
                      <div className="flex justify-center space-x-2">
                        <LivesLeftComp
                          played={played}
                          won={won}
                          livesLeft={livesLeft}
                          lives={lives}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-center space-x-4 md:space-x-2 space-y-4 md:space-y-0">
                      {gameOver || won ? (
                        <MyBadgeGroup
                          group={streakCounters(getStreak(), getBestStreak())}
                        />
                      ) : (
                        <MyBadgeGroup group={triviaryLegend} />
                      )}
                    </div>

                    <div className="flex justify-center md:justify-end items-center space-x-4 md:space-x-2 mb-8 md:mb-0">
                      <Label htmlFor="drag-type">Swap</Label>
                      <Switch
                        id="drag-type"
                        defaultChecked={dragSwitch}
                        onCheckedChange={setDragSwitch}
                        className={`data-[state=checked]:bg-gael-green-dark data-[state=unchecked]:bg-gael-red-dark relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
                      />
                      <Label htmlFor="drag-type">Normal</Label>
                    </div>
                  </div>

                  {!(gameOver || won) && (
                    <div className="flex justify-start p-0 space-x-4">
                      <SortableContext
                        items={timeline.map((card) => card?.igdbId ?? 0)}
                        strategy={
                          dragSwitch
                            ? horizontalListSortingStrategy
                            : rectSwappingStrategy
                        }
                      >
                        {timeline.map((card: Partial<Game>, index) => (
                          <div key={card.igdbId}>
                            <SortableItem
                              id={card.igdbId ?? 0}
                              disabled={correctIgdbs.includes(
                                card?.igdbId ?? 0
                              )}
                            >
                              <GameCard
                                card={card}
                                showBar={!gameOver}
                                showPos={true}
                                showTooltip={!activeId}
                              />
                            </SortableItem>
                            <Badge className="flex items-center justify-center bg-sky-700 hover:bg-sky-800 text-white text-sm font-semibold px-2 py-2 mt-4">
                              {index + 1}
                            </Badge>
                          </div>
                        ))}
                      </SortableContext>
                    </div>
                  )}

                  {won && (
                    <>
                      {/* <div className="flex justify-center">
                        <Badge className="text-md bg-indigo-100 hover:bg-indigo-100 text-indigo-800 border-indigo-400 text-center font-semibold">
                          Answer
                        </Badge>
                      </div> */}
                      <div className="flex flex-col rounded-lg bg-white">
                        <div className="flex justify-start p-0 space-x-4 overflow-x-auto">
                          {timeline.map((card: Partial<Game>, index) => (
                            <div key={card.igdbId}>
                              <GameCard card={card} showBar={won} />
                              <Badge className="flex items-center justify-center bg-sky-700 hover:bg-sky-800 text-white text-sm font-semibold px-2 py-2 mt-4">
                                {index + 1}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {gameOver && (
                    <>
                      {/* <div className="flex justify-center">
                        <Badge className="text-md bg-indigo-100 hover:bg-indigo-100 text-indigo-800 border-indigo-400 text-center font-semibold">
                          Answer
                        </Badge>
                      </div> */}
                      <div className="flex flex-col rounded-lg bg-white">
                        <div className="flex justify-start p-0 space-x-4 overflow-x-auto">
                          {goodTimeline.map((card: Partial<Game>, index) => (
                            <div key={card.igdbId}>
                              <GameCard card={card} showBar={true} />
                              <Badge className="flex items-center justify-center bg-sky-700 hover:bg-sky-800 text-white text-sm font-semibold px-2 py-2 mt-4">
                                {index + 1}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex justify-center mt-2">
                {!(played || won) ? (
                  <div className="flex justify-start p-0 space-x-8">
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
                            disabled={
                              guesses.length === 0 ||
                              (guesses.length > 0 && alreadyGuessed) ||
                              played
                            }
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
                ) : (
                  <Button
                    onClick={resetPlay}
                    className="bg-gradient-to-r from-gael-pink to-gael-purple via-gael-red hover:bg-gradient-to-r hover:from-gael-pink-dark hover:to-gael-purple-dark hover:via-gael-red-dark text-white text-md font-semibold tracking-sm"
                  >
                    Play again
                  </Button>
                )}
              </div>
            </div>

            <div
              className={`flex flex-col p-5 justify-center bg-white shadow-sm ${
                process.env.NODE_ENV === "development" &&
                "border border-gray-200"
              }`}
            >
              {guesses.length > 0 && (
                <Collapsible
                  open={attemptsCollapsibleOpen}
                  onOpenChange={setAttemptsCollapsibleOpen}
                  className="items-center"
                >
                  <div className="flex items-center justify-center space-x-4 px-4 mb-4">
                    <CollapsibleTrigger asChild>
                      <div
                        className="flex items-center justify-center space-x-2 border border-gray-200 rounded-lg px-2 py-1"
                        role="button"
                      >
                        <p className="text-md font-semibold pl-4">
                          {attemptsCollapsibleOpen ? "Hide" : "Show"} Attempts
                        </p>
                        <Button variant="ghost" size="sm" className="w-9 p-0">
                          <ChevronsUpDown className="h-4 w-4" />
                          <span className="sr-only">Toggle</span>
                        </Button>
                      </div>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent>
                    {guesses.map((timeline: Games, index: number) => {
                      const showBar = false;

                      return (
                        <div key={index} className="mb-8 p-0">
                          <div className="flex justify-center space-x-2 mt-2 mb-">
                            <Badge className="text-sm bg-red-100 hover:bg-red-100 text-red-800 border-red-400 text-center font-semibold">
                              {guesses.length - index}
                            </Badge>
                          </div>
                          <div className="flex justify-center mt-5">
                            <div
                              className={`flex flex-row justify-start px-2 space-x-4 overflow-x-auto ${
                                !showBar && "grayscale hover:grayscale-0"
                              }`}
                            >
                              <div className="flex justify-start p-0 space-x-4">
                                {timeline.map((card: Partial<Game>) => (
                                  <GameCard
                                    key={card.igdbId}
                                    card={card}
                                    showBar={false}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          </div>
        </DndContext>
      </>
    )
  );

  function handleDragStart(e: DragStartEvent) {
    if (!(e.active && e.active.id && typeof e.active.id === "number")) {
      return;
    }

    setActiveId(e.active.id);
  }

  function handleDragEnd(e: DragEndEvent) {
    if (!e.over) {
      return;
    }

    if (e.active.id !== e.over.id) {
      const oldIdx = timeline.findIndex((card) => card.igdbId === e.active.id);
      const newIdx = timeline.findIndex((card) => card.igdbId === e.over!.id);
      let newTimeline;

      if (correctIgdbs.includes(timeline[newIdx].igdbId)) {
        return;
      }

      if (dragSwitch) {
        newTimeline = arrayMove(timeline, oldIdx, newIdx);
      } else {
        newTimeline = arraySwap(timeline, oldIdx, newIdx);
      }

      updateTimeline(newTimeline);
      setActiveId(0);
    }
  }
}
