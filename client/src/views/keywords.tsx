'use client';

import Image from "next/image";
import { useEffect, useState, useRef, useCallback } from 'react'
import { Check, ChevronsUpDown, Heart } from 'lucide-react'
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import io, { Socket } from 'socket.io-client';
import useGaeldleStore from '@/stores/gaeldle-store';
import useKeywordsStore, { keywordsStore } from '@/stores/keywords-store';
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
import Placeholders from '@/views/placeholders'
import { modesSlice } from "@/stores/modes-slice";
import DisplayCountdown from "@/components/display-countdown";
import { DailyStats } from "@/types/daily-stats";
import { Mode } from "@/types/modes";
import ComingSoon from "@/components/coming-soon";
import LivesLeftComp from "@/components/lives-left";

const FormSchema = z.object({
  game: z.object({
    igdbId: z.number({
      required_error: "Please select a game",
    }),
    name: z.string({
      required_error: "Please select a game",
    }),
  }),
});

export default function Keywords() {
  const keywordsSliceState = useKeywordsStore() as keywordsStore;
  const gamesSliceState = useGaeldleStore() as gamesSlice;
  const modesSliceState = useGaeldleStore() as modesSlice;
  const { livesLeft, lives, updateLivesLeft, updateGuesses, getLivesLeft, getGuesses, gotdId, played, won, guesses, keywords, imageUrl, setImageUrl, numKeywords, updateKeywords, markAsPlayed, getPlayed, markAsWon, setGotd, resetPlay, setName, getName } = keywordsSliceState;
  const { setGames, games } = gamesSliceState;
  const { modes } = modesSliceState;
  const mode = modes?.find((val: Mode) => val.id === 3); // temporary hard-coding
  const imgWidth = 600;
  const imgHeight = 600;
  const imgAlt = `Game of the Day - ${mode?.label}`;
  const [gameMenuOpen, setGameMenuOpen] = useState(false);
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });
  const socketRef = useRef<Socket | null>(null);

  if (!socketRef.current) {
    socketRef.current = io(`${process.env.serverUrl}`);
  }

  const socket = socketRef.current!;
  const saveDailyStats = useCallback((data: DailyStats) => {
    socket.emit('daily-stats', data);
  }, [socket]);

  function onSubmit(data: z.infer<typeof FormSchema>) {
    if (guesses.some(guess => guess && guess.igdbId == data.game.igdbId)) {
      form.setError('game', { type: 'custom', message: `Already guessed` });
      return false;
    }

    socket.emit('keywords', { game: data.game, livesLeft: getLivesLeft() - 1 });
  }

  const checkAnswer = useCallback((answer: boolean, keyword: string) => {
    if (answer) {
      markAsWon()
      markAsPlayed()
      saveDailyStats({
        gotdId,
        modeId: mode!.id,
        attempts: Math.min(getGuesses().length + 1, lives),
        guesses,
        found: true,
      })
    } else {
      const { igdbId, name } = form.getValues().game;
      updateGuesses({ igdbId, name });
      updateLivesLeft();

      if (getLivesLeft() === 0) {
        markAsPlayed()
        saveDailyStats({
          gotdId,
          modeId: mode!.id,
          attempts: getGuesses().length,
          guesses: getGuesses(),
          found: false,
        })
      } else {
        updateKeywords(keyword);
      }
    }

    form.reset();
  }, [form, markAsWon, markAsPlayed, saveDailyStats, gotdId, mode, getGuesses, lives, guesses, updateGuesses, updateLivesLeft, getLivesLeft, updateKeywords])

  useEffect(() => {
    const fetchGotd = async () => {
      try {
        const res = await fetch('/api/keywords');
        const { gotd, newGotd } = await res.json();

        if (newGotd) {
          resetPlay();
          useKeywordsStore.persist.clearStorage();
        }

        if (gotd && !getPlayed()) {
          void setGotd(gotd);
        }
      } catch (error) {
        console.error('Failed to set gotd (keywords):', error);
      }
    };

    setGames();
    fetchGotd();
  }, [setGotd, setGames, resetPlay, getPlayed]);

  useEffect(() => {
    if (!getPlayed()) {
      socket.on('connect', () => {
        console.info('Connected to WebSocket server');
      });

      socket.on('daily-res-3', (data: { clientId: string, answer: boolean, name: string, keyword: string, imageUrl: string }) => {
        checkAnswer(data.answer, data.keyword);
        setName(data.name);
        setImageUrl(data.imageUrl);
      });

      socket.on('daily-stats-response', (data: { message: string }) => {
        console.info(data.message);
      });

      return () => {
        socket.off('connect');
        socket.off('daily-res-3');
        socket.off('daily-stats-response');
      };
    }
  }, [getPlayed, socket, checkAnswer, setName, mode, setImageUrl]);

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
                played &&
                <Image
                  placeholder='empty'
                  src={imageUrl}
                  width={imgWidth}
                  height={imgHeight}
                  style={{ objectFit: "contain", width: "auto", height: "auto" }}
                  alt={imgAlt}
                  className="mb-8"
                  priority
                />
              }
              <p className="mb-4 font-md font-light">1 keyword is revealed per guess. All keywords are revealed on the last guess.</p>
              <p className="mb-4 font-md font-light">Today&apos;s game has <span className="font-bold">{numKeywords}</span> keywords</p>
              <div className="flex flex-wrap gap-3">
                {keywords.map((keyword, index) => (
                  <span key={keyword + '-' + index} className='bg-gael-purple text-white px-4 py-2 rounded-full text-md'>
                    {keyword}
                  </span>
                ))}
              </div>
              {
                !played &&
                <div
                  style={{ width: imgWidth, height: imgHeight }}
                />
              }
            </div>

            <div className={`flex flex-col items-center text-center p-6 rounded-lg bg-white shadow-sm relative ${process.env.NODE_ENV === 'development' && "border border-gray-200 "}`}>
              <>
                <div className="text-lg text-center">
                  <p className="mb-5">
                    {played ? `${getName()}` : `🤔`}
                  </p>

                  <LivesLeftComp played={played} won={won} livesLeft={livesLeft} />
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

              <div className="w-full max-w-md flex flex-col">
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
                      <Button
                        type="submit"
                        className="flex-1 bg-gael-green hover:bg-gael-green-dark mt-5 mb-5"
                        disabled={played}
                      >
                        Guess
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>

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
