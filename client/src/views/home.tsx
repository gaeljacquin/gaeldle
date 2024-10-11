"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import zModes from "@/stores/modes";
import zCategories from "@/stores/categories";
import Placeholders from "@/views/placeholders";
import TextSpecial from "@/components/text-special";
import { appinfo } from "@/lib/server-constants";

const DynamicModes2 = dynamic(() => import("@/components/modes2"), {
  ssr: false,
});

export default function Home() {
  const { modes } = zModes();
  const { categories } = zCategories();
  const readySetGo = modes && categories;
  const titleFirstHalf = appinfo.title.slice(0, appinfo.title.length / 2 + 1);
  const titleSecondHalf = appinfo.title.slice(appinfo.title.length / 2 + 1);

  if (!readySetGo) {
    return <Placeholders />;
  }

  return (
    readySetGo && (
      <div
        role="main"
        className="flex-grow flex flex-col items-center space-y-8 p-4"
      >
        <div className="text-center mt-10">
          <div className="max-w-3xl mx-auto mb-2">
            <h1 className="text-5xl md:text-6xl font-extrabold mb-5">
              <TextSpecial
                term1={`${titleFirstHalf}`}
                term2={`${titleSecondHalf}`}
                space={false}
              />
            </h1>
            <p className="text-2xl justify-center text-center">
              {appinfo.description.split("Wordle")[0]}{" "}
              <Link
                className="text-gael-blue hover:text-gael-blue-dark hover:underline"
                href="https://www.nytimes.com/games/wordle"
                target="_blank"
              >
                Wordle
              </Link>{" "}
              {appinfo.description.split("Wordle")[1]}
            </p>
          </div>
          <DynamicModes2 />
        </div>
      </div>
    )
  );
}
