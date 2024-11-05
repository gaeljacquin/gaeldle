'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { Socket } from 'socket.io-client';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { FormSchema, textAlreadyGuessed } from '@/lib/client-constants';
import zGames from '@/stores/games';
import { Game, Guess, Guesses } from '@/types/games';
import { cn } from '@/utils/format-date';

type GamesFormProps = {
  form: UseFormReturn<{ game: Guess }, any, undefined>;
  modeSlug: string;
  guesses: Guesses;
  socket: Socket;
  getLivesLeft: () => number;
  played: boolean;
  summaryTab?: boolean;
  additionalButton?: React.ReactNode;
};

export default function GamesForm({ ...props }: GamesFormProps) {
  const { games } = zGames();
  const { form, modeSlug, guesses, socket, played, summaryTab, additionalButton, getLivesLeft } =
    props;
  const [search, setSearch] = useState('');

  function onSubmit(data: z.infer<typeof FormSchema>) {
    if (guesses.some((guess) => guess && guess.igdbId == data.game.igdbId)) {
      form.setError('game', { type: 'custom', message: textAlreadyGuessed });
      return false;
    }

    socket.emit(modeSlug, { game: data.game, livesLeft: getLivesLeft() - 1 });
    form.reset();
    setSearch('');
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col items-center mt-2 w-full"
      >
        <FormField
          control={form.control}
          name="game"
          render={({ field }) => (
            <FormItem className="flex flex-col border border-gray-100 rounded-md p-4 w-full">
              <Command
                onClick={() => {
                  form.clearErrors('game');
                }}
                className={`rounded-md p-4 w-full border ${
                  form.formState.errors.game ? 'border-red-300' : 'border-gray-300'
                }`}
                filter={(gameName, searchTerm) => {
                  return Number(
                    gameName.toLocaleLowerCase().includes(searchTerm.toLocaleLowerCase())
                  );
                }}
              >
                <CommandInput
                  placeholder="Search"
                  className="w-full text-md"
                  value={search}
                  onValueChange={setSearch}
                  disabled={played || summaryTab || getLivesLeft() === 0}
                />
                <CommandList className="w-full mt-2 h-72">
                  <CommandEmpty>No game found</CommandEmpty>
                  <CommandGroup>
                    {games.map((game: Game) => {
                      const alreadyGuessed = guesses.some((guess) => guess?.igdbId === game.igdbId);

                      return (
                        <CommandItem
                          key={game.igdbId}
                          value={game.name}
                          onSelect={() => {
                            if (game.igdbId === field.value?.igdbId) {
                              form.reset();
                            } else {
                              form.setValue('game', game);
                            }
                          }}
                          disabled={alreadyGuessed || played || summaryTab || getLivesLeft() === 0}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              field.value?.igdbId && game.igdbId === field.value.igdbId
                                ? 'opacity-100'
                                : 'opacity-0'
                            )}
                          />
                          <span className={`text-lg ${alreadyGuessed ? 'line-through' : ''}`}>
                            {game.name}
                          </span>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
              <FormLabel className="flex items-center justify-center w-full text-center text-md border border-2 border-dotted border-gray-400 bg-gray-200 rounded-md">
                {field.value?.igdbId ? field.value?.name : <>&nbsp;</>}
                <FormMessage />
              </FormLabel>
            </FormItem>
          )}
        />
        <div className="flex space-x-2 w-full p-4 justify-center items-center">
          <Button
            type="submit"
            className="bg-gael-green hover:bg-gael-green-dark w-full text-md font-semibold"
            disabled={played || summaryTab || getLivesLeft() === 0}
          >
            Guess
          </Button>
          {additionalButton}
        </div>
      </form>
    </Form>
  );
}
