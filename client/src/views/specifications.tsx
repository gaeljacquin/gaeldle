'use client'

import Image from "next/image";
import { useEffect, useCallback, useState } from 'react'
import useGaeldleStore from '@/stores/gaeldle-store';
import { gamesSlice } from '@/stores/games-slice';
import { Button } from "@/components/ui/button"
import Placeholders from '@/views/placeholders'
import DisplayCountdown from "@/components/display-countdown";
import { DailyStats } from "@/types/daily-stats";
import ComingSoon from "@/components/coming-soon";
import LivesLeftComp from "@/components/lives-left";
import useSpecificationsStore, { specificationsStore } from "@/stores/specifications-store";
import { Specs } from "@/types/games";
import GamesForm from "@/components/games-form";
import Hearts from "@/components/hearts";
import { GamesFormInit, SocketInit } from "@/lib/constants";
import SpecificationsDataTable from "@/components/specifications-data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import SummaryDataTable from "@/components/summary-data-table";

export default function Specifications() {
  const specificationsSliceState = useSpecificationsStore() as specificationsStore;
  const gamesSliceState = useGaeldleStore() as gamesSlice;
  const { name, livesLeft, lives, updateLivesLeft, updateGuesses, getLivesLeft, getGuesses, gotdId, played, won, guesses, imageUrl, getGotdId, setImageUrl, markAsPlayed, getPlayed, markAsWon, setGotd, resetPlay, setName, getName, setSummary, mode } = specificationsSliceState;
  const { setGames, games } = gamesSliceState;
  const [currentTab, setCurrentTab] = useState('guesses')
  const form = GamesFormInit();
  const socket = SocketInit();
  const readySetGo = games && gotdId && mode;

  const saveDailyStats = useCallback((data: DailyStats) => {
    socket.emit('daily-stats', data);
  }, [socket]);

  const checkAnswer = useCallback((answer: boolean, specs: Specs) => {
    if (!form.getValues().game) {
      return null;
    }

    let dsGuesses;

    if (answer) {
      dsGuesses = guesses.map(({ igdbId, name }) => ({ igdbId, name }));
      markAsWon()
      markAsPlayed()
      saveDailyStats({
        gotdId,
        modeId: mode!.id,
        attempts: Math.min(getGuesses().length + 1, lives),
        guesses: dsGuesses,
        found: true,
      })
      setSummary(specs)
    } else {
      const { igdbId, name } = form.getValues().game;
      updateGuesses({
        igdbId,
        name,
        ...specs,
      });
      updateLivesLeft();

      if (getLivesLeft() === 0) {
        dsGuesses = getGuesses().map(({ igdbId, name }) => ({ igdbId, name }));
        markAsPlayed()
        saveDailyStats({
          gotdId,
          modeId: mode!.id,
          attempts: getGuesses().length,
          guesses: dsGuesses,
          found: false,
        })
        setSummary(specs)
      }
    }

    form.reset();
  }, [form, guesses, markAsWon, markAsPlayed, saveDailyStats, gotdId, mode, getGuesses, lives, updateGuesses, updateLivesLeft, getLivesLeft, setSummary])

  useEffect(() => {
    const fetchGotd = async () => {
      try {
        const res = await fetch('/api/specifications');
        const { gotd, newGotd } = await res.json();

        if (newGotd) {
          resetPlay();
          useSpecificationsStore.persist.clearStorage();
        }

        if (gotd && (newGotd || !getGotdId())) {
          void setGotd(gotd);
        }
      } catch (error) {
        console.error('Failed to set gotd (specifications):', error);
      }
    };

    setGames();
    fetchGotd();
  }, [setGotd, setGames, resetPlay, getPlayed, getGotdId]);

  useEffect(() => {
    if (!getPlayed()) {
      socket.on('connect', () => {
        console.info('Connected to WebSocket server');
      });

      socket.on('daily-res-4', (data: { clientId: string, answer: boolean, name: string, imageUrl: string, specs: Specs }) => {
        checkAnswer(data.answer, data.specs);
        setName(data.name);
        setImageUrl(data.imageUrl);
      });

      socket.on('daily-stats-response', (data: { message: string }) => {
        console.info(data.message);
      });

      return () => {
        socket.off('connect');
        socket.off('daily-res-4');
        socket.off('daily-stats-response');
      };
    }
  }, [getPlayed, socket, checkAnswer, setName, mode, setImageUrl]);

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

            <LivesLeftComp played={played} won={won} livesLeft={livesLeft} />

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

        {guesses.length > 0 &&
          <Tabs defaultValue="guesses" onValueChange={(value) => setCurrentTab(value)}>
            <div className="text-center">
              <TabsList>
                <TabsTrigger value="guesses">Guesses</TabsTrigger>
                <TabsTrigger value="summary">Summary</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="guesses">
              <div className="flex flex-col items-center">
                <SpecificationsDataTable guesses={guesses} />
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
