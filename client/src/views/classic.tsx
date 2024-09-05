'use client';

import Image from "next/image";
import { useEffect, useState } from 'react'
import { Check, ChevronsUpDown, Heart } from 'lucide-react'
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import Ably from 'ably';
import useGaeldleStore from '@/stores/gaeldle-store';
import useClassicStore, { classicStore } from '@/stores/classic-store';
import { gamesSlice } from '@/stores/games-slice';
import { Button } from "@/components/ui/button"
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
import { cn, myhostname } from "@/lib/utils"
import PixelatedImage from '@/components/pixelate-image';
import Placeholders from '@/views/placeholders'
import { Gotd } from '@/types/gotd';
import { victoryText, gameOverText } from '@/lib/constants';
import { modesSlice } from "@/stores/modes-slice";
import { Games } from "@/types/games";
import DisplayCountdown from "@/components/display-countdown";
import { DailyStats } from "@/types/daily-stats";
import { Mode } from "@/types/modes";
import ComingSoon from "@/components/coming-soon";

type ClassicProps = {
  gotd: Gotd
  getGamesAction: () => Promise<Games>
  newGotd: boolean
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

export default function Classic({ gotd, getGamesAction, newGotd }: ClassicProps) {
  const classicSliceState = useClassicStore() as classicStore;
  const gamesSliceState = useGaeldleStore() as gamesSlice;
  const modesSliceState = useGaeldleStore() as modesSlice;
  const { livesLeft, lives, updateLivesLeft, updateGuesses, getLivesLeft, getGuesses, name, igdbId, gotdId, played, won, guesses, pixelation, imageUrl, setPixelation, removePixelation, markAsPlayed, getPlayed, markAsWon, setGotd, resetPlay } = classicSliceState;
  const { setGames, games } = gamesSliceState;
  const { modes } = modesSliceState;
  const [gameMenuOpen, setGameMenuOpen] = useState(false);
  const [skipPopoverOpen, setSkipPopoverOpen] = useState(false);
  const mode = modes?.find((val: Mode) => val.id === 1); // temporary hard-coding
  const imgWidth = 600;
  const imgHeight = 600;
  const imgAlt = `Game of the Day - ${mode?.label}`;
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });
  const hostname = myhostname();
  const ably = new Ably.Realtime({ authUrl: `${hostname}/api/ably`, authMethod: 'GET' });
  const channel = ably.channels.get('dailyStats');
  const _ = () => {
    let text = ""
    let classes = "-mt-3 -mb-7"

    if (!played) {
      text = `${livesLeft} `;

      if (livesLeft === 1) {
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


  function saveDailyStats(data: DailyStats) {
    channel.publish('saveDailyStats', data);
  }

  function onSkip() {
    updateGuesses(null)
    updateLivesLeft()
    setPixelation()

    if (getLivesLeft() === 0) {
      markAsPlayed()
      removePixelation()
      saveDailyStats({
        gotdId,
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
      saveDailyStats({
        gotdId,
        modeId: mode!.id,
        attempts: Math.min(guesses.length + 1, lives),
        guesses,
        found: true,
      })
    } else {
      updateLivesLeft()
      updateGuesses(data.game)
      setPixelation()

      if (getLivesLeft() === 0) {
        markAsPlayed()
        removePixelation()
        saveDailyStats({
          gotdId,
          modeId: mode!.id,
          attempts: getGuesses().length,
          guesses: getGuesses(),
          found: false,
        })
      }
    }

    form.reset();
  }

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const games = await getGamesAction();
        setGames(games);
      } catch (error) {
        console.error('Failed to fetch games:', error);
      }
    };

    fetchGames();

    if (newGotd) {
      resetPlay();
      useClassicStore.persist.clearStorage();
    }

    if (gotd) {
      void setGotd(gotd);
    }
  }, [gotd, setGotd, setGames, getGamesAction, newGotd, resetPlay]);

  useEffect(() => {
    if (!getPlayed()) {
      channel.subscribe('dailyStatsSaved', (message) => {
        console.info('Received data:', message.data);
      });

      return () => {
        channel.unsubscribe();
      };
    }
  }, [getPlayed, channel]);

  if (!(games && gotd)) {
    return <Placeholders />
  }

  return (
    games && gotd &&
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

        <div className="max-w-3xl mx-auto -mt-5 text-center">
          <DisplayCountdown />
        </div>

        <ComingSoon />

        {process.env.NODE_ENV === 'development' &&
          <>
            <Button onClick={() => form.reset()}>Clear Form</Button>
          </>
        }
      </main >
    </>
  )
}
