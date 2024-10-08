"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import zModes from "@/stores/modes";
import zCategories from "@/stores/categories";
import Placeholders from "@/views/placeholders";

const DynamicModes2 = dynamic(() => import("@/components/modes2"), {
  ssr: false,
});

export default function Home() {
  const { modes } = zModes();
  const { categories } = zCategories();
  const readySetGo = modes && categories;

  if (!readySetGo) {
    return <Placeholders />;
  }

  return (
    readySetGo && (
      <div
        role="main"
        className="flex-grow flex flex-col items-center space-y-8 p-4"
      >
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
            clone
          </p>
          <DynamicModes2 />
        </div>
      </div>
    )
  );
}
