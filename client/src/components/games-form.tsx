"use client";

import { Socket } from "socket.io-client";
import { Check, ChevronsUpDown } from "lucide-react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { FormSchema, textAlreadyGuessed } from "~/src/lib/client-constants";
import zGames from "@/stores/games";
import { Game, Guess, Guesses } from "@/types/games";
import { UseFormReturn } from "react-hook-form";
import { useState } from "react";

type GamesFormProps = {
  form: UseFormReturn<{ game: Guess }, any, undefined>;
  modeSlug: string;
  guesses: Guesses;
  socket: Socket;
  getLivesLeft: () => number;
  played: boolean;
  summaryTab?: boolean;
};

export default function GamesForm({
  form,
  modeSlug,
  guesses,
  socket,
  getLivesLeft,
  played,
  summaryTab,
}: GamesFormProps) {
  const { games } = zGames();

  function onSubmit(data: z.infer<typeof FormSchema>) {
    if (guesses.some((guess) => guess && guess.igdbId == data.game.igdbId)) {
      form.setError("game", { type: "custom", message: textAlreadyGuessed });
      return false;
    }

    socket.emit(modeSlug, { game: data.game, livesLeft: getLivesLeft() - 1 });
    form.reset();
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col items-center space-y-4 mt-2 w-full"
      >
        <FormField
          control={form.control}
          name="game"
          render={({ field }) => (
            <FormItem className="flex flex-col border border-gray-100 rounded-md p-4 w-full">
              <Command
                onClick={() => {
                  form.clearErrors("game");
                }}
                className="border border-gray-300 rounded-md p-4 w-full"
              >
                <CommandInput placeholder="Search game..." className="w-full" />
                <CommandList className="w-full">
                  <CommandEmpty>No game found</CommandEmpty>
                  <CommandGroup>
                    {games.map((game: Game) => {
                      const alreadyGuessed = guesses.some(
                        (guess) => guess?.igdbId === game.igdbId
                      );

                      return (
                        <CommandItem
                          key={game.igdbId}
                          value={game.name}
                          onSelect={(selectedIgdbId) => {
                            if (
                              parseInt(selectedIgdbId, 10) ===
                              field.value?.igdbId
                            ) {
                              form.reset();
                            } else {
                              form.setValue("game", game);
                            }
                          }}
                          disabled={alreadyGuessed}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              field.value?.igdbId &&
                                game.igdbId === field.value.igdbId
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          <span
                            className={alreadyGuessed ? "line-through" : ""}
                          >
                            {game.name}
                          </span>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex w-full">
          <Button
            type="submit"
            className="flex-1 bg-gael-green hover:bg-gael-green-dark mb-5"
            disabled={played || summaryTab}
          >
            Guess
          </Button>
        </div>
      </form>
    </Form>
  );
}
