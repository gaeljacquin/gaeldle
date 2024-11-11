'use client';

import { useEffect, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  arraySwap,
  horizontalListSortingStrategy,
  rectSwappingStrategy,
  SortableContext,
} from '@dnd-kit/sortable';
import { motion } from 'framer-motion';
import { ChevronsUpDown } from 'lucide-react';
import GameCard from '@/components/game-card';
import Hearts from '@/components/hearts';
import LivesLeftComp from '@/components/lives-left';
import ModesHeader from '@/components/modes-header';
import MyBadgeGroup from '@/components/my-badge-group';
import Placeholders from '@/components/placeholders';
import SortableItem from '@/components/sortable-item';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { timelineCheckAnswer } from '@/services/check-answer';
import { Game, Games } from '@/services/games';
import { Mode } from '@/services/modes';
import { setTimelineVal } from '@/services/redis';
import zTimeline from '@/stores/timeline';
import {
  bgCorrect,
  bgOther1,
  bgPartial,
  streakCounters,
  textAlreadyGuessed,
  textStartingPosition,
  textSubmit,
  timelineLegend,
} from '@/utils/client-constants';
import shuffleList from '@/utils/shuffle-list';

type Props = {
  mode: Mode;
  games: Partial<Game>[];
  clientId: string;
  getRandom: (arg0: number, arg1: number) => Promise<unknown>;
};

const container = {
  hidden: { opacity: 1, scale: 0 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      delayChildren: 0.3,
      staggerChildren: 0.2,
    },
  },
};

const spring = {
  type: 'spring',
  damping: 25,
  stiffness: 120,
};

export default function Timeline(props: Props) {
  const { mode, games, clientId, getRandom } = props;
  const { dragSwitch, setStreak, getStreak, setBestStreak, getBestStreak, setDragSwitch } =
    zTimeline();
  const [timeline, updateTimeline] = useState<Partial<Game>[]>(games);
  const [livesLeft, updateLivesLeft] = useState<number>(mode.lives);
  const [guesses, updateGuesses] = useState<Array<Partial<Game>[]>>([]);
  const [won, setWon] = useState<boolean>(false);
  const [played, setPlayed] = useState<boolean>(false);
  const [timelineOnLoad, updateTimelineOnLoad] = useState(games);
  const [goodTimeline, updateGoodTimeline] = useState<Games>([]);
  const [alreadyGuessed, setAlreadyGuessed] = useState(false);
  const [dummyOnLoad, setDummyOnLoad] = useState(true);
  const [submitButtonText, setSubmitButtonText] = useState(textSubmit);
  const [attemptsCollapsibleOpen, setAttemptsCollapsibleOpen] = useState(false);
  const [activeId, setActiveId] = useState(0); // id = igdbId in this context
  const mouseSensor = useSensor(MouseSensor);
  const touchSensor = useSensor(TouchSensor);
  const sensors = useSensors(mouseSensor, touchSensor);
  const gameOver = played && !won;
  const [ready, setReady] = useState<boolean>(false);
  const correctIgdbs =
    timeline?.filter((game) => game.bgStatus === bgCorrect).map((game) => game.igdbId) ?? [];
  const resetGameState = () => {
    updateLivesLeft(mode.lives);
    updateGuesses([]);
    setWon(false);
    setPlayed(false);
    setAlreadyGuessed(false);
    setDummyOnLoad(true);
    setSubmitButtonText(textSubmit);
  };

  function setLastGuess() {
    const lastGuess = guesses[0];
    updateTimeline(lastGuess);
    setAlreadyGuessed(true);
  }

  async function checkAnswer() {
    setDummyOnLoad(true);

    ('use server');
    const answerPlus = await timelineCheckAnswer(clientId, timeline, livesLeft - 1);
    const { answer, updatedTimeline, goodTimeline } = answerPlus;
    updateScore(goodTimeline, updatedTimeline, answer);
  }

  function updateScore(goodTimeline: Games, updatedTimeline: Partial<Game>[], answer: boolean) {
    if (answer) {
      setPlayed(true);
      setWon(true);
      setStreak(true);
      setBestStreak();
      updateGoodTimeline(goodTimeline);
    } else {
      updateGuesses((prev) => [updatedTimeline, ...prev]);
      const newLivesLeft = livesLeft - 1;
      updateLivesLeft(newLivesLeft);

      if (newLivesLeft === 0) {
        setPlayed(true);
        updateGoodTimeline(goodTimeline);
      }

      setBestStreak();
      setStreak(false);
      updateTimeline(updatedTimeline);
    }

    setBestStreak();
  }

  async function continuePlay() {
    resetGameState();

    ('use server');
    const games = (await getRandom(mode.pixelationStep, mode.pixelation)) as Games;
    setTimelineVal(clientId, games);
    let reshuffledGames = shuffleList(games) as Partial<Game>[];
    reshuffledGames = reshuffledGames.map((game: Partial<Game>) => {
      const { frd, frdFormatted, ...rest } = game;
      void frd, frdFormatted;

      return { ...rest, bgStatus: bgOther1 };
    });

    updateTimeline(reshuffledGames);
    updateTimelineOnLoad(reshuffledGames);
  }

  function handleDragStart(e: DragStartEvent) {
    if (!(e.active && e.active.id && typeof e.active.id === 'number')) {
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

      const newTimelineIds = newTimeline.map((game) => game.igdbId);
      const timelineOnLoadIds = timelineOnLoad.map((game) => game.igdbId);

      if (dummyOnLoad) {
        setDummyOnLoad(false);
      }

      if (alreadyGuessed) {
        setAlreadyGuessed(false);
        setSubmitButtonText(textSubmit);
      }

      if (
        newTimelineIds.length === timelineOnLoadIds.length &&
        newTimelineIds.every((id, index) => id === timelineOnLoadIds[index])
      ) {
        setAlreadyGuessed(true);
        setSubmitButtonText(textStartingPosition);
      }

      guesses.some((guess) => {
        const guessIds = guess.map((game) => game?.igdbId ?? 0);

        if (
          newTimelineIds.length === guessIds.length &&
          newTimelineIds.every((id, index) => id === guessIds[index])
        ) {
          setAlreadyGuessed(true);
          setSubmitButtonText(textAlreadyGuessed);
          return true;
        }
      });

      newTimeline = newTimeline.map((game, index) => {
        if (game.igdbId !== timeline[index].igdbId && game.bgStatus === bgCorrect) {
          return {
            ...game,
            bgStatus: bgPartial,
          };
        } else if (
          game.correctIndex &&
          index === game.correctIndex &&
          game.bgStatus === bgPartial
        ) {
          return {
            ...game,
            bgStatus: bgCorrect,
          };
        }

        return game;
      });

      updateTimeline(newTimeline);
      setActiveId(0);
    }
  }

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) {
    return <Placeholders />;
  }

  return (
    <>
      <DndContext onDragEnd={handleDragEnd} onDragStart={handleDragStart} sensors={sensors}>
        <div className="flex flex-col min-h-screen">
          <ModesHeader mode={mode} />

          <div className="flex flex-col mb-5 justify-center">
            <div className="flex justify-center mb-6">
              <div className="flex flex-col md:flex-row justify-between items-center space-y-8 md:space-y-0 space-x-0 md:space-x-20 mb-7">
                <div className="mb-4 md:mb-0 space-y-4">
                  <div className="flex justify-center md:justify-start space-x-2">
                    <Hearts lives={mode.lives} livesLeft={livesLeft} size={'md'} />
                  </div>
                  <div className="flex justify-center space-x-2">
                    <LivesLeftComp
                      played={played}
                      won={won}
                      livesLeft={livesLeft}
                      lives={mode.lives}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-center space-x-4 md:space-x-2 space-y-4 md:space-y-0">
                  {gameOver || won ? (
                    <MyBadgeGroup group={streakCounters(getStreak(), getBestStreak())} />
                  ) : (
                    <MyBadgeGroup group={timelineLegend} />
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
            </div>
          </div>

          <div className="flex flex-col mb-5 justify-center">
            <div className="flex justify-center mb-6">
              <div
                className={`px-4 py-8 rounded-lg bg-white shadow-sm border-dashed border-4 ${dragSwitch ? 'border-gael-green-dark' : 'border-gael-red-dark'} overflow-x-auto`}
              >
                {!(gameOver || won) && (
                  <motion.div
                    className="flex justify-start p-0 space-x-4"
                    variants={container}
                    initial="hidden"
                    animate="visible"
                  >
                    <SortableContext
                      items={timeline.map((card) => card?.igdbId ?? 0)}
                      strategy={dragSwitch ? horizontalListSortingStrategy : rectSwappingStrategy}
                    >
                      {timeline.map((card: Partial<Game>, index) => (
                        <motion.div key={card.igdbId} className="item" variants={spring}>
                          <SortableItem
                            id={card.igdbId ?? 0}
                            disabled={correctIgdbs.includes(card?.igdbId ?? 0)}
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
                        </motion.div>
                      ))}
                    </SortableContext>
                  </motion.div>
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
                        {goodTimeline &&
                          (goodTimeline as []).map((card: Partial<Game>, index) => (
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

            <div className="flex justify-center mt-2 mb-7">
              <MyBadgeGroup
                group={streakCounters(getStreak(), getBestStreak())}
                textColor="black"
              />
            </div>

            <div className="flex justify-center mt-2">
              {!(played || won) ? (
                <div className="flex justify-start p-0 space-x-8">
                  <Button
                    onClick={checkAnswer}
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
                            dummyOnLoad ||
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
                  onClick={continuePlay}
                  className="bg-gradient-to-r from-gael-pink to-gael-purple via-gael-red hover:bg-gradient-to-r hover:from-gael-pink-dark hover:to-gael-purple-dark hover:via-gael-red-dark text-white text-md font-semibold tracking-sm"
                >
                  Play again
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-col p-5 justify-center">
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
                        {attemptsCollapsibleOpen ? 'Hide' : 'Show'} Attempts
                      </p>
                      <Button variant="ghost" size="sm" className="w-9 p-0">
                        <ChevronsUpDown className="h-4 w-4" />
                        <span className="sr-only">Toggle</span>
                      </Button>
                    </div>
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent>
                  {guesses.map((timeline, index) => {
                    const showBar = false;

                    return (
                      <div key={index} className="mb-8 p-0">
                        <div className="flex justify-center space-x-2 mt-2">
                          <Badge className="text-sm bg-red-100 hover:bg-red-100 text-red-800 border-red-400 text-center font-semibold">
                            {guesses.length - index}
                          </Badge>
                        </div>
                        <div className="flex justify-center mt-5">
                          <div
                            className={`flex flex-row justify-start px-2 space-x-4 overflow-x-auto ${
                              !showBar && 'grayscale hover:grayscale-0'
                            }`}
                          >
                            <div className="flex justify-start p-0 space-x-4">
                              {timeline.map((card: Partial<Game>) => (
                                <GameCard
                                  key={card.igdbId}
                                  card={card}
                                  showBar={false}
                                  showTooltip={false}
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
  );
}
