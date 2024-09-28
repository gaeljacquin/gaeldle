'use client'

import Image from "next/image";
import { usePathname } from 'next/navigation';
import { useState } from 'react'
import { Button } from "@/components/ui/button"
import Placeholders from '@/views/placeholders'
import DisplayCountdown from "@/components/display-countdown";
import ComingSoon from "@/components/coming-soon";
import LivesLeftComp from "@/components/lives-left";
import zSpecs, { socket } from "@/stores/specifications";
import GamesForm from "@/components/games-form";
import Hearts from "@/components/hearts";
import SpecificationsDataTable from "@/components/specifications-data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SummaryDataTable from "@/components/summary-data-table";
import zGames from "~/src/stores/games";
import zModes from "~/src/stores/modes";
import { GamesFormInit } from "~/src/lib/client-constants";

export default function Specifications() {
  const pathname = usePathname();
  const {
    name, livesLeft, lives, gotdId, played, won, guesses, imageUrl,
    getLivesLeft, getName,
  } = zSpecs();
  const { games } = zGames();
  const { getModeBySlug } = zModes();
  const mode = getModeBySlug(pathname);
  const [currentTab, setCurrentTab] = useState('guesses');
  const form = GamesFormInit();
  const readySetGo = games && gotdId && mode;

  if (!readySetGo) {
    return <Placeholders />
  }

  return (
    readySetGo &&
    <>
      <main className="flex-grow flex flex-col items-center space-y-8">
        <div className="mb-4 text-xl text-center font-semibold">
          <p>{mode.label}</p>
          <p>{mode.description}</p>
        </div>
        {
          played &&
          <div className="w-full max-w-md flex flex-col items-center space-y-8 mt-4 border-2">
            <Image
              placeholder='empty'
              src={imageUrl}
              width={600}
              height={600}
              style={{ objectFit: "contain", width: "auto", height: "auto" }}
              alt={name}
              priority
            />
          </div>
        }

        <div className="grid md:grid-cols-2 gap-8 relative">
          <div className={`flex flex-col items-center text-center p-6 bg-white shadow-sm rounded-lg ${process.env.NODE_ENV === 'development' && "border border-gray-200 "}`}>
            <p className="mb-5">
              {played ? `${getName()}` : `🤔`}
            </p>

            <LivesLeftComp played={played} won={won} livesLeft={livesLeft} lives={lives} />

            <div className="flex justify-center space-x-2 mt-8">
              <Hearts lives={lives} livesLeft={livesLeft} />
            </div>
          </div>

          <div className={`flex flex-col items-center text-center p-6 bg-white shadow-sm rounded-lg ${process.env.NODE_ENV === 'development' && "border border-gray-200 "}`}>
            <GamesForm
              form={form}
              modeSlug={mode.mode}
              guesses={guesses}
              socket={socket}
              getLivesLeft={getLivesLeft}
              played={played}
              summaryTab={currentTab === "summary"}
            />
          </div>
        </div>

        {(guesses.length > 0 || won) &&
          <Tabs defaultValue="guesses" onValueChange={(value) => setCurrentTab(value)}>
            <div className="text-center">
              <TabsList>
                <TabsTrigger value="guesses">Guesses</TabsTrigger>
                <TabsTrigger value="summary">Summary</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="guesses">
              <div className="flex flex-col items-center">
                {guesses.length > 0 ?
                  <SpecificationsDataTable guesses={guesses} />
                  : <p className="font-sm font-semibold mt-8">Flawless victory! 😎</p>
                }
              </div>
            </TabsContent>
            <TabsContent value="summary">
              <div className="flex flex-col items-center">
                <SummaryDataTable />
              </div>
            </TabsContent>
          </Tabs>
        }

        <div className="text-center">
          {process.env.NODE_ENV === 'development' &&
            <div className="mt-10 mb-5">
              <Button onClick={() => form.reset()}>Clear Form</Button>
            </div>
          }

          <div className="max-w-3xl mx-auto mt-10">
            <DisplayCountdown />
          </div>
        </div>

        <div className="mt-20">
          <ComingSoon />
        </div>
      </main >
    </>
  )
}
