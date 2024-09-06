'use client';

import Image from "next/image";
import { useEffect, useState } from 'react'
import { Check, ChevronsUpDown, Heart } from 'lucide-react'
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
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
import { cn } from "@/lib/utils"
import PixelatedImage from '@/components/pixelate-image';
import Placeholders from '@/views/placeholders'
import { victoryText, gameOverText } from '@/lib/constants';
import { modesSlice } from "@/stores/modes-slice";
import DisplayCountdown from "@/components/display-countdown";
import { DailyStats } from "@/types/daily-stats";
import { Mode } from "@/types/modes";
import ComingSoon from "@/components/coming-soon";
import { useChannel } from 'ably/react';

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

export default function Classic() {
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
  const channelName = "dailyStats";
  const imgAlt = `Game of the Day - ${mode?.label}`;
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });
  const { channel } = useChannel(channelName, (message) => {
    console.info(message)
  });
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
        const res = await fetch('/api/games');
        const games = await res.json()
        setGames(games);
      } catch (error) {
        console.error('Failed to fetch games:', error);
      }
    };

    const fetchGotd = async () => {
      try {
        const res = await fetch('/api/gotd-classic');
        const { gotd, newGotd } = await res.json()
        if (newGotd) {
          resetPlay();
          useClassicStore.persist.clearStorage();
        }

        if (gotd) {
          void setGotd(gotd);
        }
      } catch (error) {
        console.error('Failed to set gotd (classic):', error);
      }
    };

    fetchGames();
    fetchGotd();
  }, [setGotd, setGames, resetPlay]);

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

  if (!(games && gotdId && mode)) {
    return <Placeholders />
  }

  return (
    games && gotdId && mode &&
    <>
      <div className="flex flex-col min-h-screen">
        <main className="flex-grow container mx-auto px-4">
          <div className="mb-8 text-xl text-center font-semibold">
            <p>{mode.label}</p>
            <p>{mode.description}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className={`flex flex-col items-center text-center p-6 bg-white shadow-sm rounded-lg ${process.env.NODE_ENV === 'development' && "border border-gray-200 "}`}>
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
                    placeholder='empty'
                    src={imageUrl}
                    width={imgWidth}
                    height={imgHeight}
                    style={{ objectFit: "contain", width: "auto", height: "auto" }}
                    alt={imgAlt}
                    priority
                  />
              }
            </div>

            <div className={`flex flex-col items-center text-center p-6 rounded-lg bg-white shadow-sm relative ${process.env.NODE_ENV === 'development' && "border border-gray-200 "}`}>
              <>
                <div className="text-lg text-center">
                  <p className="mb-5">
                    {played ? `${name}` : `🤔`}
                  </p>
                  {_()}
                </div>

                <div className="flex justify-center space-x-2 mt-8">
                  {Array.from({ length: lives }).map((_, index) => (
                    <Heart
                      key={index}
                      className={`w-6 h-6 ${index < livesLeft ? 'text-red-600' : ''}`}
                      fill={index < livesLeft ? 'currentColor' : 'none'}
                    />
                  ))}
                </div>
              </>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col items-center space-y-4 mt-8">
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
                          <PopoverContent className="w-[420px] p-0" side="bottom" align="start">
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

              <div className="w-full max-w-md flex flex-col">
                <div className="mt-4" aria-live="polite">
                  {guesses.map((game, index) => (
                    <div key={(game ? game.igdbId + '-guessed-' : 'skipped-') + index} className="p-2 bg-gael-red text-white rounded border border-3">
                      {game ? game.name : 'SKIPPED'}
                    </div>
                  ))}
                </div>
              </div>

              <div className={`absolute bottom-0 left-0 right-0 p-4 rounded-b-lg ${process.env.NODE_ENV === 'development' && "bg-gray-100 border-t border-gray-200"}`}>
                {process.env.NODE_ENV === 'development' &&
                  <div className="mb-5">
                    <Button onClick={() => form.reset()}>Clear Form</Button>
                  </div>
                }

                <div className="max-w-3xl mx-auto mt-10 text-center">
                  <DisplayCountdown />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-20">
            <ComingSoon />
          </div>
        </main>
      </div>
    </>
  )
}
