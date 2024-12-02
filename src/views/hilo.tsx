'use client';

import { useEffect, useState } from 'react';
import { ToastAction } from '@radix-ui/react-toast';
import { ChevronsUpDown, Loader2 } from 'lucide-react';
import Fade from '@/components/fade';
import GameCard from '@/components/game-card';
import Hearts from '@/components/hearts';
import LivesLeftComp from '@/components/lives-left';
import ModesHeader from '@/components/modes-header';
import MyBadgeGroup from '@/components/my-badge-group';
import PlaceholderCard from '@/components/placeholder-card';
import Placeholders from '@/components/placeholders';
import { SessionTimeoutAlertDialog } from '@/components/session-timeout-alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { confettiEmoji } from '@/services/confetti';
import { Game } from '@/services/games';
import { Mode } from '@/services/modes';
import { setHiloVal } from '@/services/redis';
import zHilo from '@/stores/hilo';
import { GuessHilo, Operator, OperatorEqual } from '@/types/zhilo';
import {
  bgCorrect,
  bgIncorrect,
  finitoText,
  timeline2Legend as hiloLegend,
  streakCounters,
} from '@/utils/client-constants';

type Props = {
  mode: Mode;
  games: Partial<Game>[];
  clientId: string;
};

export default function Hilo(props: Props) {
  const { mode, games, clientId } = props;
  const [initialCurrentGame, initialNextGame] = games;
  const { setStreak, getStreak, setBestStreak, getBestStreak } = zHilo();
  const [currentGame, setCurrentGame] = useState<Game>(initialCurrentGame as Game);
  const [nextGame, setNextGame] = useState<Partial<Game> | null>(initialNextGame);
  const [playedGameIds, updatePlayedGameIds] = useState<number[]>([initialCurrentGame.igdbId ?? 0]);
  const [played, setPlayed] = useState<boolean>(false);
  const [won, setWon] = useState<boolean>(false);
  const [finito, setFinito] = useState<boolean>(false);
  const [guesses, updateGuesses] = useState<GuessHilo[]>([]);
  const [timeline, updateTimeline] = useState<Partial<Game>[]>([]);
  const [livesLeft, updateLivesLeft] = useState<number>(mode.lives);
  const [tgCollapsibleOpen, setTgCollapsibleOpen] = useState(false);
  const [operator, setOperator] = useState<OperatorEqual>('=');
  const gameOver = played && !won;
  const buttonDisabled = played || livesLeft === 0 || !nextGame || operator !== '=' || finito;
  const [ready, setReady] = useState<boolean>(false);
  const [discard, setDiscard] = useState<boolean>(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const resetGameState = (newList: number[]) => {
    setTgCollapsibleOpen(false);
    updateGuesses([]);
    setPlayed(false);
    setWon(false);
    updateLivesLeft(mode.lives);
    updatePlayedGameIds(newList);
    updateTimeline([]);
  };
  const { toast } = useToast();

  async function resetPlay() {
    const newList = [currentGame.igdbId ?? 0];
    resetGameState(newList);
    const res = await fetch('/api/random-one', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newList),
    });
    const game = ((await res.json()) as Game[])[0] as Game;

    if (!game) {
      setFinito(true);
    } else {
      setHiloVal(clientId, game);
      const { frd, frdFormatted, ...rest } = game;
      void frd, frdFormatted;
      setNextGame(rest);
      setOperator('=');
    }
  }

  async function continuePlay() {
    setNextGame(null);
    const newList = [...playedGameIds, nextGame?.igdbId ?? 0];
    updatePlayedGameIds(newList);
    const res = await fetch('/api/random-one', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newList),
    });
    const game = ((await res.json()) as Game[])[0] as Game;

    if (!game) {
      setFinito(true);
    } else {
      const data = { clientId, game, action: 'set-answer' };
      void (await fetch('/api/hilo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }));
      const { frd, frdFormatted, ...rest } = game;
      void frd, frdFormatted;
      setNextGame(rest);
      setOperator('=');
    }
  }

  async function checkAnswer(operator: Operator) {
    setOperator(operator);
    setDiscard(true);
    const data = { key: clientId, game: currentGame, operator, action: 'check-answer' };
    const res = await fetch('/api/hilo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    const answerPlusFrd = await res.json();

    if (!answerPlusFrd) {
      setAlertOpen(true);

      return;
    }

    const { answer, frd, frdFormatted, bgStatus } = answerPlusFrd;
    const newCurrentGame = { frd, frdFormatted, ...nextGame } as Game;
    const firstAttempt = guesses.length === 0;
    newCurrentGame.bgStatus = bgStatus;
    timeline.push(newCurrentGame);
    updateTimeline(timeline);
    guesses.unshift({
      currentGame,
      nextGame: newCurrentGame,
      operator,
      rightAnswer: answer,
    });

    if (answer) {
      setStreak(true);
      setBestStreak();
      setCurrentGame(newCurrentGame);
      continuePlay();

      if (currentGame.bgStatus === bgIncorrect || firstAttempt) {
        confettiEmoji('🤩');
      } else {
        confettiEmoji('✅');
      }
    } else {
      setCurrentGame(newCurrentGame);
      const newLivesLeft = livesLeft - 1;
      updateLivesLeft(newLivesLeft);

      if (newLivesLeft === 0) {
        setPlayed(true);
        setStreak(false);
        setNextGame(null);
        confettiEmoji('❌');
      } else {
        if (currentGame.bgStatus === bgCorrect || firstAttempt) {
          confettiEmoji('❌');
        } else {
          toast({
            variant: 'destructive',
            description: 'Incorrect 😭',
            action: <ToastAction altText="Click to close">Close</ToastAction>,
          });
        }

        continuePlay();
      }
    }

    setDiscard(false);
  }

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) {
    return <Placeholders />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-grow container mx-auto px-4">
        <div className="flex justify-center">
          <ModesHeader mode={mode} />
        </div>
        <SessionTimeoutAlertDialog isOpen={alertOpen} setIsOpen={setAlertOpen} />
        <div className="grid md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center text-center">
            {nextGame ? (
              <Fade isActive={!discard}>
                <GameCard card={nextGame} />
              </Fade>
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
            {mode.lives > 0 ? (
              <div className="text-lg text-center space-y-1">
                <div className="flex justify-center space-x-2">
                  <Hearts lives={mode.lives} livesLeft={livesLeft} size={'md'} />
                </div>
                <LivesLeftComp played={played} won={won} livesLeft={livesLeft} lives={mode.lives} />
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
                  onClick={() => checkAnswer('<')}
                >
                  {operator === '<' && livesLeft > 0 && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Released Before
                </Button>
                <Button
                  type="button"
                  className="bg-sky-700 hover:bg-sky-800 w-full text-md font-semibold"
                  disabled={buttonDisabled}
                  onClick={() => checkAnswer('>')}
                >
                  {operator === '>' && livesLeft > 0 && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Released After
                </Button>
              </div>
              <small className="font-semibold">NB: Ties are always marked as correct</small>
              {finito && <small className="font-semibold">{finitoText}</small>}
            </div>
          </div>

          <div className="flex flex-col items-center text-center">
            {currentGame ? (
              <Fade isActive={!discard}>
                <GameCard card={currentGame} />
              </Fade>
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
        {timeline.length > 0 && guesses.length > 0 && (
          <Collapsible
            open={tgCollapsibleOpen || (gameOver && !tgCollapsibleOpen)}
            onOpenChange={setTgCollapsibleOpen}
            className="items-center mt-5 md:mt-0"
          >
            <div
              className={`flex items-center justify-center space-x-4 px-4 ${gameOver && 'hidden'}`}
            >
              <CollapsibleTrigger asChild>
                <div
                  className="flex items-center justify-center space-x-2 border border-gray-200 rounded-lg px-2 py-1"
                  role="button"
                >
                  <p className="text-md font-semibold w-full">
                    {tgCollapsibleOpen ? 'Hide' : 'Show'} Timeline & Guesses
                  </p>
                  <Button variant="ghost" size="sm" className="w-9 p-0">
                    <ChevronsUpDown className="h-4 w-4" />
                    <span className="sr-only">Toggle</span>
                  </Button>
                </div>
              </CollapsibleTrigger>
            </div>
            {gameOver && (
              <div className="flex items-center justify-center space-x-4 px-2 py-1">
                <form action={resetPlay} className="mt-2 mb-5">
                  <Button
                    className="bg-gradient-to-r from-gael-pink to-gael-purple via-gael-red hover:bg-gradient-to-r hover:from-gael-pink-dark hover:to-gael-purple-dark hover:via-gael-red-dark text-white text-md font-semibold"
                    type="submit"
                  >
                    Play again
                  </Button>
                </form>
              </div>
            )}
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
                        {' '}
                        {timeline.map((game: Partial<Game>, index: number) => (
                          <GameCard key={game.igdbId + '-' + index} card={game} />
                          // TODO: look into why a game shows up more than once; fixing duplicate key for now
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="guesses">
                  {guesses.map((guess: GuessHilo, index: number) => {
                    const { currentGame, nextGame, operator, rightAnswer } = guess;
                    const badgeClass =
                      'text-sm text-center font-semibold ' +
                      (rightAnswer
                        ? 'bg-green-100 hover:bg-green-100 text-green-800 border-green-400'
                        : 'bg-red-100 hover:bg-red-100 text-red-800 border-red-400');
                    const operatorClass = rightAnswer ? 'text-green-600' : 'text-red-600';

                    return (
                      <div key={index} className="mt-4 mb-4 p-0">
                        <div className="flex justify-center space-x-2 mt-2">
                          <Badge className={`${badgeClass}`}>{guesses.length - index}</Badge>
                        </div>
                        <div className="flex justify-center mt-5">
                          <div className="flex flex-row justify-start px-2 space-x-4 overflow-x-auto">
                            <div className="flex justify-start p-0 space-x-4">
                              <GameCard key={nextGame.igdbId} card={nextGame} />
                              <p className={`my-auto text-4xl font-semibold ${operatorClass}`}>
                                {operator}=
                              </p>
                              <GameCard key={currentGame.igdbId} card={currentGame} />
                            </div>
                          </div>
                        </div>
                        {guesses.length - index > 1 && <hr className="mt-8" />}
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
  );
}
