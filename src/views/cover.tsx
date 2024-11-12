'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { ChevronsUpDown, Loader2 } from 'lucide-react';
import GamesForm from '@/components/games-form';
import Hearts from '@/components/hearts';
import LivesLeftComp from '@/components/lives-left';
import ModesHeader from '@/components/modes-header';
import MyBadgeGroup from '@/components/my-badge-group';
import PixelatedImage from '@/components/pixelate-image';
import Placeholders from '@/components/placeholders';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { coverCheckAnswer } from '@/services/check-answer';
import { Game, Games } from '@/services/games';
import { Mode } from '@/services/modes';
import { setCoverVal } from '@/services/redis';
import zCover from '@/stores/cover';
import { Guess, Guesses } from '@/types/guesses';
import {
  finitoText,
  GamesFormInit,
  imgAlt,
  imgHeight,
  imgWidth,
  streakCounters,
} from '@/utils/client-constants';

type Props = {
  mode: Mode;
  game: Partial<Game>;
  games: Games;
  clientId: string;
  getOneRandom: (arg0?: number[]) => Promise<unknown>;
};

export default function Cover(props: Props) {
  const { mode, game: initialGame, games, clientId, getOneRandom } = props;
  const { setStreak, getStreak, setBestStreak, getBestStreak } = zCover();
  const [game, setGame] = useState<Partial<Game>>(initialGame);
  const [guessesCollapsibleOpen, setGuessesCollapsibleOpen] = useState(true);
  const [idList, updateIdList] = useState<number[]>([]);
  const [guesses, updateGuesses] = useState<Guesses>([]);
  const [played, setPlayed] = useState<boolean>(false);
  const [won, setWon] = useState<boolean>(false);
  const [finito, setFinito] = useState<boolean>(false);
  const [livesLeft, updateLivesLeft] = useState<number>(mode.lives);
  const [pixelation, setPixelation] = useState<number>(mode.pixelation);
  const [ready, setReady] = useState<boolean>(false);
  const resetGameState = () => {
    setGuessesCollapsibleOpen(true);
    updateGuesses([]);
    setPlayed(false);
    setWon(false);
    updateLivesLeft(mode.lives);
    setPixelation(mode.pixelation);
  };
  const form = GamesFormInit();

  async function continuePlay() {
    form.reset();
    resetGameState();
    const newList = [...idList, game?.igdbId ?? 0];
    updateIdList(newList);

    ('use server');
    const res = await getOneRandom(newList);
    const nextGame = ((await res) as Game[])[0] as Game;

    if (!game) {
      setFinito(true);
    } else {
      setCoverVal(clientId, nextGame);
      const { igdbId, name, ...rest } = nextGame;
      void igdbId, name;
      setGame(rest);
    }
  }

  async function checkAnswer(guess: Guess) {
    ('use server');
    const res = await coverCheckAnswer(clientId, guess.igdbId);
    const { igdbId, name } = res as Partial<Game>;
    const answer = igdbId && name;
    game.igdbId = igdbId;
    game.name = name;

    if (answer) {
      setStreak(true);
      setBestStreak();
      setPlayed(true);
      setWon(true);
      setGame(game);
    } else {
      updateGuesses((prev) => [...prev, guess]);
      setPixelation((prev) => prev - mode.pixelationStep);
      const newLivesLeft = livesLeft - 1;
      updateLivesLeft(newLivesLeft);

      if (newLivesLeft === 0) {
        setPlayed(true);
        setPixelation(0);
        setStreak(false);
        setGame(game);
      }
    }
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

        <div className="grid md:grid-cols-2 gap-8">
          <div className="flex flex-col items-center text-center">
            <Card className="relative rounded-2xl overflow-x-auto shadow-md bg-cyan-50">
              <CardContent className="p-0">
                {!played ? (
                  <PixelatedImage
                    imageUrl={game.imageUrl ?? ''}
                    width={imgWidth}
                    height={imgHeight}
                    pixelationFactor={pixelation}
                    alt={imgAlt(mode.label ?? '')}
                  />
                ) : (
                  <Image
                    placeholder="empty"
                    src={game.imageUrl ?? ''}
                    width={imgWidth}
                    height={imgHeight}
                    className="relative z-10"
                    style={{
                      objectFit: 'contain',
                      width: 'auto',
                      height: 'auto',
                    }}
                    alt={imgAlt(mode.label ?? '')}
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
          </div>

          <div className="flex flex-col items-center text-center p-6 relative">
            {mode.lives > 0 ? (
              <div className="text-lg text-center space-y-1">
                <p className="font-semibold">{played ? `${name}` : `🤔`}</p>
                <div className="flex justify-center space-x-2">
                  <Hearts lives={mode.lives} livesLeft={livesLeft} />
                </div>
                <LivesLeftComp played={played} won={won} livesLeft={livesLeft} lives={mode.lives} />
              </div>
            ) : (
              <div className="text-lg text-center p-8">
                <Loader2 className="flex items-center justify-center h-5 w-5 animate-spin" />
              </div>
            )}

            <GamesForm
              games={games}
              form={form}
              guesses={guesses}
              livesLeft={livesLeft}
              played={played}
              clientId={clientId}
              checkAnswer={checkAnswer}
            />

            {played && (
              <form action={continuePlay} className="mt-2 mb-5">
                {won ? (
                  <Button
                    className="bg-gradient-to-r bg-gradient-to-r from-blue-500 to-teal-400 hover:bg-gradient-to-r hover:from-blue-700 hover:to-teal-600 text-white text-md font-semibold"
                    type="submit"
                    disabled={finito}
                  >
                    {finito ? finitoText : 'Keep playing!'}
                  </Button>
                ) : (
                  <Button className="bg-gradient-to-r from-gael-pink to-gael-purple via-gael-red hover:bg-gradient-to-r hover:from-gael-pink-dark hover:to-gael-purple-dark hover:via-gael-red-dark text-white text-md font-semibold">
                    Play again
                  </Button>
                )}
              </form>
            )}

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
                          {guessesCollapsibleOpen ? 'Hide' : 'Show'} Guesses
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
                          key={(game ? game.igdbId + '-guessed-' : 'skipped-') + index}
                        >
                          <div className="p-2 bg-gael-red text-white rounded-2xl border border-3 w-full text-md font-light">
                            {game ? game.name : 'SKIPPED'}
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
  );
}
