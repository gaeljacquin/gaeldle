'use client';

import { useState } from 'react';
import { Socket } from 'socket.io-client';
import { Check, ChevronsUpDown } from 'lucide-react'
import { z } from "zod"
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { FormSchema } from '@/lib/constants';
import useGaeldleStore from '@/stores/gaeldle-store';
import { gamesSlice } from '@/stores/games-slice';
import { Guess, Guesses } from '@/types/games';
import { UseFormReturn } from 'react-hook-form';

type GamesFormProps = {
  form: UseFormReturn<{ game: Guess }, any, undefined>
  modeSlug: string
  guesses: Guesses
  socket: Socket
  getLivesLeft: () => number
  played: boolean
}

export default function GamesForm({ form, modeSlug, guesses, socket, getLivesLeft, played }: GamesFormProps) {
  const gamesSliceState = useGaeldleStore() as gamesSlice;
  const { games } = gamesSliceState;
  const [gameMenuOpen, setGameMenuOpen] = useState(false);

  function onSubmit(data: z.infer<typeof FormSchema>) {
    if (guesses.some(guess => guess && guess.igdbId == data.game.igdbId)) {
      form.setError('game', { type: 'custom', message: `Already guessed` });
      return false;
    }

    socket.emit(modeSlug, { game: data.game, livesLeft: getLivesLeft() - 1 });
  }

  return (
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
  )
}
