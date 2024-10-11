"use client";

import { useState } from "react";
import { Socket } from "socket.io-client";
import { Check } from "lucide-react";
import { z } from "zod";
import { UseFormReturn } from "react-hook-form";
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
  const {
    form,
    modeSlug,
    guesses,
    socket,
    played,
    summaryTab,
    additionalButton,
    getLivesLeft,
  } = props;
  const [search, setSearch] = useState("");

  function onSubmit(data: z.infer<typeof FormSchema>) {
    if (guesses.some((guess) => guess && guess.igdbId == data.game.igdbId)) {
      form.setError("game", { type: "custom", message: textAlreadyGuessed });
      return false;
    }

    socket.emit(modeSlug, { game: data.game, livesLeft: getLivesLeft() - 1 });
    form.reset();
    setSearch("");
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
                  form.clearErrors("game");
                }}
                className="border border-gray-300 rounded-md p-4 w-full"
                filter={(gameName, searchTerm) => {
                  return Number(
                    gameName
                      .toLocaleLowerCase()
                      .includes(searchTerm.toLocaleLowerCase())
                  );
                }}
              >
                <CommandInput
                  placeholder="Search game..."
                  className="w-full"
                  value={search}
                  onValueChange={setSearch}
                  disabled={played || summaryTab}
                />
                <CommandList className="w-full mt-2 h-72">
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
                          disabled={alreadyGuessed || played || summaryTab}
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
        <div className="flex space-x-2 w-full p-4 justify-center items-center">
          <Button
            type="submit"
            className="bg-gael-green hover:bg-gael-green-dark w-full text-md font-semibold"
            disabled={played || summaryTab}
          >
            Guess
          </Button>
          {additionalButton}
        </div>
      </form>
    </Form>
  );
}
