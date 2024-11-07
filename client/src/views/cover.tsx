'use client';

import { useState } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ChevronsUpDown, Loader2 } from 'lucide-react';
import GamesForm from '@/components/games-form';
import LivesLeftComp from '@/components/lives-left';
import ModesHeader from '@/components/modes-header';
import MyBadgeGroup from '@/components/my-badge-group';
import PixelatedImage from '@/components/pixelate-image';
// import Placeholders from '@/components/placeholders';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Game, Games } from '@/services/games';
import { Mode } from '@/services/modes';
import {
  GamesFormInit,
  imgAlt,
  imgHeight,
  imgWidth,
  streakCounters,
} from '@/utils/client-constants';

type Props = {
  mode: Mode;
  game: Game;
  games: Games;
};

export default function Cover(props: Props) {
  const { mode, game, games } = props;

  const pathname = usePathname();
  const [guessesCollapsibleOpen, setGuessesCollapsibleOpen] = useState(true);
  const form = GamesFormInit();

  const renderButton = () => {
    // if (livesLeft === 0 && getLives() > 0) {
    //   return (
    //     <Button
    //       className="bg-gradient-to-r from-gael-pink to-gael-purple via-gael-red hover:bg-gradient-to-r hover:from-gael-pink-dark hover:to-gael-purple-dark hover:via-gael-red-dark text-white text-md font-semibold"
    //       onClick={(e) => {
    //         e.preventDefault();
    //         form.reset();
    //         resetPlay();
    //       }}
    //     >
    //       Play again
    //     </Button>
    //   );
    // }

    // if (won) {
    //   return (
    //     <Button
    //       className="bg-gradient-to-r bg-gradient-to-r from-blue-500 to-teal-400 hover:bg-gradient-to-r hover:from-blue-700 hover:to-teal-600 text-white text-md font-semibold"
    //       onClick={(e) => {
    //         e.preventDefault();
    //         form.reset();
    //         continuePlay();
    //       }}
    //       disabled={finito}
    //     >
    //       {finito ? 'All done! 🤩' : 'Keep playing!'}
    //     </Button>
    //   );
    // }

    return (
      <Button
        className="text-md font-semibold"
        onClick={(e) => {
          e.preventDefault();
          form.reset();
        }}
      >
        Clear
      </Button>
    );
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-grow container mx-auto px-4">
        <div className="flex justify-center">
          <ModesHeader mode={mode} />
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="flex flex-col items-center text-center">
            {/* <Card className="relative rounded-2xl overflow-x-auto shadow-md bg-cyan-50">
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
                      objectFit: 'contain',
                      width: 'auto',
                      height: 'auto',
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
            </Card> */}
          </div>

          <div className="flex flex-col items-center text-center p-6 relative">
            {/* {getLives() > 0 ? (
              <div className="text-lg text-center space-y-1">
                <p className="font-semibold">{played ? `${name}` : `🤔`}</p>
                <div className="flex justify-center space-x-2">
                  <Hearts lives={lives} livesLeft={livesLeft} />
                </div>
                <LivesLeftComp played={played} won={won} livesLeft={livesLeft} lives={lives} />
              </div>
            ) : (
              <div className="text-lg text-center p-8">
                <Loader2 className="flex items-center justify-center h-5 w-5 animate-spin" />
              </div>
            )} */}

            {/* <GamesForm
              form={form}
              modeSlug={mode.mode}
              guesses={guesses}
              socket={socket}
              getLivesLeft={getLivesLeft}
              played={played}
              additionalButton={renderButton()}
            /> */}

            <div className="flex flex-col p-5 w-full justify-center -mt-4 mb-8">
              {/* {guesses.length > 0 && ( */}
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
                    {/* {guesses.map((game, index) => (
                        <div
                          className="flex w-full space-x-2"
                          key={(game ? game.igdbId + '-guessed-' : 'skipped-') + index}
                        >
                          <div className="p-2 bg-gael-red text-white rounded-2xl border border-3 w-full text-md font-light">
                            {game ? game.name : 'SKIPPED'}
                          </div>
                        </div>
                      ))} */}
                  </div>
                </CollapsibleContent>
              </Collapsible>
              {/* )} */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
