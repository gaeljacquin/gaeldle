'use client';

import Image from "next/image";
import { useEffect, useState, useRef, useCallback } from 'react'
import { Check, ChevronsUpDown, Heart } from 'lucide-react'
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import io, { Socket } from 'socket.io-client';
import useGaeldleStore from '@/stores/gaeldle-store';
import useArtworkStore, { artworkStore } from '@/stores/artwork-store';
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

export default function Artwork() {
  const artworkSliceState = useArtworkStore() as artworkStore;
  const gamesSliceState = useGaeldleStore() as gamesSlice;
  const modesSliceState = useGaeldleStore() as modesSlice;
  const { livesLeft, lives, updateLivesLeft, updateGuesses, getLivesLeft, getGuesses, gotdId, played, won, guesses, pixelation, imageUrl, setPixelation, removePixelation, markAsPlayed, getPlayed, markAsWon, setGotd, resetPlay, setName, getName } = artworkSliceState;
  const { setGames, games } = gamesSliceState;
  const { modes } = modesSliceState;
  const [gameMenuOpen, setGameMenuOpen] = useState(false);
  const mode = modes?.find((val: Mode) => val.id === 2); // temporary hard-coding
  const imgWidth = 600;
  const imgHeight = 600;
  const imgAlt = `Game of the Day - ${mode?.label}`;
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

    socket.emit('artwork', { game: data.game, livesLeft: getLivesLeft() - 1 });
  }

  const checkAnswer = useCallback((answer: boolean) => {
    if (answer) {
      markAsWon()
      markAsPlayed()
      removePixelation()
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
      setPixelation();
      updateLivesLeft();

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
  }, [form, markAsWon, markAsPlayed, removePixelation, saveDailyStats, gotdId, mode, getGuesses, lives, guesses, updateGuesses, setPixelation, updateLivesLeft, getLivesLeft])

  useEffect(() => {
    const fetchGotd = async () => {
      try {
        const res = await fetch('/api/artwork');
        const { gotd, newGotd } = await res.json();

        if (newGotd) {
          resetPlay();
          useArtworkStore.persist.clearStorage();
        }

        if (gotd && !getPlayed()) {
          void setGotd(gotd);
        }
      } catch (error) {
        console.error('Failed to set gotd (artwork):', error);
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

      socket.on('daily-res-2', (data: { clientId: string, answer: boolean, name: string }) => {
        checkAnswer(data.answer);
        setName(data.name);
      });

      socket.on('daily-stats-response', (data: { message: string }) => {
        console.info(data.message);
      });

      return () => {
        socket.off('connect');
        socket.off('daily-res-2');
        socket.off('daily-stats-response');
      };
    }
  }, [getPlayed, socket, checkAnswer, setName, mode]);

  if (!(games && gotdId && mode)) {
    return <Placeholders />
  }

  return (
    games && gotdId && mode &&
    <>
      <main className="flex-grow flex flex-col items-center space-y-8">
        <div className="mb-8 text-xl text-center font-semibold">
          <p>{mode.label}</p>
          <p>{mode.description}</p>
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
                placeholder='empty'
                src={imageUrl}
                width={imgWidth}
                height={imgHeight}
                style={{ objectFit: "contain", width: "auto", height: "auto" }}
                alt={imgAlt}
                priority
              />
          }

          <div className="text-lg text-center">
            <p className="mb-5">
              {played ? `${getName()}` : `🤔`}
            </p>

            <LivesLeftComp played={played} won={won} livesLeft={livesLeft} />

            <div className="flex justify-center space-x-2 mt-8">
              {Array.from({ length: lives }).map((_, index) => (
                <Heart
                  key={index}
                  className={`w-6 h-6 ${index < livesLeft ? 'text-red-600' : ''}`}
                  fill={index < livesLeft ? 'currentColor' : 'none'}
                />
              ))}
            </div>

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

            <div className="w-full max-w-md flex flex-col">
              <div className="mt-4" aria-live="polite">
                {guesses.map((game, index) => (
                  <div key={(game ? game.igdbId + '-guessed-' : 'skipped-') + index} className="p-2 bg-gael-red text-white rounded border border-3">
                    {game ? game.name : 'SKIPPED'}
                  </div>
                ))}
              </div>
            </div>

            <div>
              {process.env.NODE_ENV === 'development' &&
                <div className="mt-10 mb-5">
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
    </>
  )
}
