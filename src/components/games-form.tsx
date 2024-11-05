'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
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
import { cn } from '@/lib/utils';
import { coverCheckAnswer } from '@/services/check-answer';
import { Games } from '@/services/games';
import { Guess, Guesses } from '@/types/guesses';
import { FormSchema, textAlreadyGuessed } from '@/utils/client-constants';

type GamesFormProps = {
  games: Games;
  form: UseFormReturn<{ game: Guess }, unknown, undefined>;
  guesses: Guesses;
  livesLeft: number;
  played: boolean;
  summaryTab?: boolean;
  clientId: string;
  updateScore: (arg0: Guess, arg1: boolean) => void;
};

export default function GamesForm({ ...props }: GamesFormProps) {
  const { games, form, guesses, played, summaryTab, livesLeft, clientId, updateScore } = props;
  const [search, setSearch] = useState('');

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    if (guesses.some((guess) => guess && guess.igdbId == data.game.igdbId)) {
      form.setError('game', { type: 'custom', message: textAlreadyGuessed });
      return false;
    }
    const { game } = form.getValues();
    const { name, igdbId } = game;
    const guess = { name, igdbId };
    form.reset();
    setSearch('');

    ('use server');
    const answer = await coverCheckAnswer(clientId, guess);
    updateScore(guess, answer);
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
                filter={(gameName: string, searchTerm: string) => {
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
                  disabled={played || summaryTab || livesLeft === 0}
                />
                <CommandList className="w-full mt-2 h-72">
                  <CommandEmpty>No game found</CommandEmpty>
                  <CommandGroup>
                    {games.map((game) => {
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
                          disabled={alreadyGuessed || played || summaryTab || livesLeft === 0}
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
            disabled={played || summaryTab || livesLeft === 0}
          >
            Guess
          </Button>
          <Button
            className="text-md font-semibold"
            onClick={(e) => {
              e.preventDefault();
              form.reset();
            }}
            disabled={played || summaryTab || livesLeft === 0}
          >
            Clear
          </Button>
        </div>
      </form>
    </Form>
  );
}
