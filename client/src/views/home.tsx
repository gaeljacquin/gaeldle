"use client";

import Link from "next/link";
import zModes from "@/stores/modes";
import zCategories from "@/stores/categories";
import Placeholders from "@/views/placeholders";
import { Button } from "../components/ui/button";

export default function Home() {
  const { modes } = zModes();
  const { categories } = zCategories();
  const readySetGo = modes && categories;

  if (!readySetGo) {
    return <Placeholders />;
  }

  return (
    readySetGo && (
      <main className="flex-grow flex flex-col items-center space-y-8 p-4">
        <div className="w-full space-y-4 text-center">
          <p className="text-2xl justify-center text-center">
            A gaming-themed{" "}
            <Link
              className="text-gael-blue hover:text-gael-blue-dark hover:underline"
              href="https://www.nytimes.com/games/wordle"
              target="_blank"
            >
              Wordle
            </Link>{" "}
            clone inspired by{" "}
            <Link
              className="text-gael-blue hover:text-gael-blue-dark hover:underline"
              href="https://wikitrivia.tomjwatson.com/"
              target="_blank"
            >
              Wiki Trivia
            </Link>
          </p>
          <div className="flex justify-center">
            <Link href="/triviary" className="max-w-xs w-full mt-5">
              <Button className="bg-gradient-to-r from-gael-pink to-gael-purple via-gael-red hover:bg-gradient-to-r hover:from-gael-pink-dark hover:to-gael-purple-dark hover:via-gael-red-dark text-white text-md font-semibold tracking-sm max-w-xs w-full">
                Play
              </Button>
            </Link>
          </div>
        </div>
      </main>
    )
  );
}
