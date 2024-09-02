'use client';

import Image from "next/image";
import { useCallback, useEffect, useState } from 'react';
import { Check, ChevronsUpDown, Heart } from 'lucide-react';
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import io from 'socket.io-client';
import useGaeldleStore from '@/stores/gaeldle-store';
import useClassicUnlimitedStore, { classicUnlimitedStore } from '@/stores/classic-unlimited-store';
import { gamesSlice } from '@/stores/games-slice';
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import PixelatedImage from '@/components/pixelate-image';
import Placeholders from '@/views/placeholders'
import { Gotd } from '@/types/gotd';
import { victoryText, gameOverText } from '@/lib/constants';
import { modesSlice } from "@/stores/modes-slice";
import { Games } from "@/types/games";
import { comingSoon } from "@/constants/text";
import { UnlimitedStats } from "@/types/unlimited-stats";
import { Mode } from "@/types/modes";
import ComingSoon from "@/components/coming-soon";

type ClassicUnlimitedProps = {
  getRandomGameAction: () => Promise<Gotd>
  getGamesAction: () => Promise<Games>
}

const FormSchema = z.object({
  game: z.object({
    igdbId: z.number({
      required_error: "Please select a game",
    }),
    name: z.string({
      required_error: "Please select a game",
    }),
  })
});
const socket = io(`${process.env.serverUrl}`);

export default function ClassicUnlimited({ getRandomGameAction, getGamesAction }: ClassicUnlimitedProps) {
  const classicUnlimitedSliceState = useClassicUnlimitedStore() as classicUnlimitedStore;
  const gamesSliceState = useGaeldleStore() as gamesSlice;
  const modesSliceState = useGaeldleStore() as modesSlice;
  const { livesLeft, lives, updateLivesLeft, updateGuesses, getLivesLeft, getGuesses, name, igdbId, played, won, guesses, pixelation, imageUrl, setPixelation, removePixelation, markAsPlayed, markAsWon, setRandomGame } = classicUnlimitedSliceState;
  const { setGames, games } = gamesSliceState;
  const { modes } = modesSliceState;
  const [gameMenuOpen, setGameMenuOpen] = useState(false);
  const [skipPopoverOpen, setSkipPopoverOpen] = useState(false);
  const [skipGamePopoverOpen, setSkipGamePopoverOpen] = useState(false);
  const mode = modes?.find((val: Mode) => val.id === 5); // temporary hard-coding
  const imgWidth = 600;
  const imgHeight = 600;
  const imgAlt = mode ? mode.label : 'Random cover';
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });

  const _ = () => {
    let text = ""
    let classes = "-mt-3 -mb-7"

    if (!played) {
      text = `${livesLeft} `;

      if (livesLeft == 1) {
        text += 'life'
      } else {
        text += 'lives'
      }

      text += ' remaining'
    } else {
      if (won) {
        text = victoryText
      } else {
        text = gameOverText
      }

      classes += " text-xl font-semibold"
    }

    return <p className={classes}>{text}</p>
  }

  function saveUnlimitedStats(data: UnlimitedStats) {
    socket.emit('saveUnlimitedStats', data);
  }

  function onSkip() {
    updateGuesses(null)
    updateLivesLeft()
    setPixelation()

    if (getLivesLeft() === 0) {
      markAsPlayed()
      removePixelation()
      saveUnlimitedStats({
        igdbId,
        modeId: mode!.id,
        attempts: getGuesses().length,
        guesses: getGuesses(),
        found: false,
      })
    }
  }

  function onSubmit(data: z.infer<typeof FormSchema>) {
    if (guesses.some(guess => guess && guess.igdbId == data.game.igdbId)) {
      form.setError('game', { type: 'custom', message: `Already guessed` });
      return false;
    }

    if (data.game.igdbId === igdbId) {
      markAsWon()
      markAsPlayed()
      removePixelation()
      saveUnlimitedStats({
        igdbId,
        modeId: mode!.id,
        attempts: Math.min(guesses.length + 1, lives),
        guesses: getGuesses(),
        found: true,
      })
    } else {
      updateLivesLeft()
      updateGuesses(data.game)
      setPixelation()

      if (getLivesLeft() === 0) {
        markAsPlayed()
        removePixelation()
        saveUnlimitedStats({
          igdbId,
          modeId: mode!.id,
          attempts: getGuesses().length,
          guesses: getGuesses(),
          found: false,
        })
      }
    }

    form.reset();
  }

  const fetchRandomGame = useCallback(async () => {
    try {
      const game = await getRandomGameAction();
      setRandomGame(game);
    } catch (error) {
      console.error('Failed to fetch game:', error);
    }
  }, [getRandomGameAction, setRandomGame]);

  const fetchGames = useCallback(async () => {
    try {
      const games = await getGamesAction();
      setGames(games);
    } catch (error) {
      console.error('Failed to fetch games:', error);
    }
  }, [getGamesAction, setGames]);

  async function newGame() {
    form.reset();
    fetchRandomGame();
  }

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  useEffect(() => {
    fetchRandomGame();
  }, [fetchRandomGame]);

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to server');
    });

    socket.on('message', (message: string) => {
      console.log('Message from server:', message);
    });

    socket.on('error', (message: string) => {
      console.log('Message from server:', message);
    });

    return () => {
      socket.off('connect');
      socket.off('message');
    };

  }, []);

  if (!(games && igdbId)) {
    return <Placeholders />
  }

  return (
    games && igdbId &&
    <>
      <main className="flex-grow flex flex-col items-center space-y-8 p-4">
        <div className="max-w-3xl mx-auto -mt-5 text-center">
          {mode &&
            <>
              <p className="text-xl font-semibold">{mode.label}</p>
              <p className="text-xl font-semibold">{mode.description}</p>
            </>
          }
        </div>

        <div className="w-full max-w-md flex flex-col items-center space-y-8 mt-4">
          {
            !played ?
              <PixelatedImage
                imageUrl={imageUrl}
                width={imgWidth}
                height={imgHeight}
                pixelationFactor={pixelation}
                alt={imgAlt}
              />
              :
              <Image
                src={imageUrl}
                width={imgWidth}
                height={imgHeight}
                alt={imgAlt}
                priority
              />
          }

          <div className="text-lg text-center">
            <p className="text-lg -mt-2 mb-5">
              {played ? `${name}` : `🤔`}
            </p>
            {_()}
          </div>

          <div className="flex justify-center space-x-2">
            {Array.from({ length: lives }).map((_, index) => (
              <Heart
                key={index}
                className={`w-6 h-6 ${index < livesLeft ? 'text-red-600' : ''}`}
                fill={index < livesLeft ? 'currentColor' : 'none'}
              />
            ))}
          </div>

          {played ? (
            <Button
              onClick={() => newGame()}
              className="flex-1 bg-gael-purple hover:bg-gael-purple-dark"
            >
              New Game
            </Button>
          ) : (
            <Popover open={skipGamePopoverOpen} onOpenChange={setSkipGamePopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  className="flex-1 bg-gael-purple hover:bg-gael-purple-dark"
                >
                  Skip Game
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] text-center">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Are you sure?</h4>
                </div>
                <div className="space-y-2 mt-3">
                  <Button
                    onClick={() => { newGame(); setSkipGamePopoverOpen(false) }}
                    className="w-full bg-gael-purple hover:bg-gael-purple-dark"
                  >
                    Yes
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          )}


          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col items-center space-y-4">
              <FormField
                control={form.control}
                name="game"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <Popover open={gameMenuOpen} onOpenChange={() => { setGameMenuOpen(!gameMenuOpen); form.clearErrors("game") }} >
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-[420px] justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={played}
                          >
                            {field.value
                              ? games.find(
                                (game) => game.igdbId === field.value.igdbId
                              )?.name
                              : "Select game"
                            }
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[420px] p-0" side="top" align="start">
                        <Command onClick={() => { form.clearErrors("game") }}>
                          <CommandInput placeholder="Search game..." />
                          <CommandList>
                            <CommandEmpty>No game found</CommandEmpty>
                            <CommandGroup>
                              {games.map((game) => (
                                <CommandItem
                                  key={game.igdbId}
                                  value={game.name}
                                  onSelect={(selectedIgdbId) => {
                                    if (parseInt(selectedIgdbId, 10) === field.value?.igdbId) {
                                      form.reset();
                                    } else {
                                      form.setValue("game", game);
                                      setGameMenuOpen(false);
                                    }
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      field.value?.igdbId && game.igdbId === field.value.igdbId
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {game.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex space-x-4 w-full">
                <Popover open={skipPopoverOpen} onOpenChange={setSkipPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      className="flex-1 bg-gael-blue hover:bg-gael-blue-dark"
                      disabled={played}
                    >
                      Skip
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] text-center">
                    <div className="space-y-2">
                      <h4 className="font-medium leading-none">Are you sure?</h4>
                    </div>
                    <div className="space-y-2 mt-3">
                      <Button
                        onClick={(e) => { e.preventDefault(); onSkip(); setSkipPopoverOpen(false) }}
                        className="w-full bg-gael-blue hover:bg-gael-blue-dark"
                      >
                        Yes
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
                <Button
                  type="submit"
                  className="flex-1 bg-gael-green hover:bg-gael-green-dark"
                  disabled={played}
                >
                  Guess
                </Button>
              </div>
            </form>
          </Form>
        </div>

        <div className="w-full max-w-md flex flex-col">
          <div className="mt-2" aria-live="polite">
            {guesses.map((game, index) => (
              <div key={(game ? game.igdbId + '-guessed-' : 'skipped-') + index} className="p-2 bg-gael-red text-white rounded border border-3">
                {game ? game.name : 'SKIPPED'}
              </div>
            ))}
          </div>
        </div>

        <ComingSoon />
      </main >
    </>
  )
}
