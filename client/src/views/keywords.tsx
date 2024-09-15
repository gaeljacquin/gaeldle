'use client';

import Image from "next/image";
import { useEffect, useCallback } from 'react'
import { Heart } from 'lucide-react'
import useGaeldleStore from '@/stores/gaeldle-store';
import useKeywordsStore, { keywordsStore } from '@/stores/keywords-store';
import { gamesSlice } from '@/stores/games-slice';
import { Button } from "@/components/ui/button"
import Placeholders from '@/views/placeholders'
import { modesSlice } from "@/stores/modes-slice";
import DisplayCountdown from "@/components/display-countdown";
import { DailyStats } from "@/types/daily-stats";
import { Mode } from "@/types/modes";
import ComingSoon from "@/components/coming-soon";
import LivesLeftComp from "@/components/lives-left";
import ModesHeader from "@/components/modes-header";
import GamesForm from "@/components/games-form";
import { GamesFormInit, imgAlt, imgHeight, imgWidth, SocketInit } from "@/lib/constants";
import gSocket from "@/lib/gsocket";
import { CheckAnswerType } from "@/types/check-answer";
import Hearts from "@/components/hearts";

export default function Keywords() {
  const keywordsSliceState = useKeywordsStore() as keywordsStore;
  const gamesSliceState = useGaeldleStore() as gamesSlice;
  const modesSliceState = useGaeldleStore() as modesSlice;
  const { livesLeft, lives, updateLivesLeft, updateGuesses, getLivesLeft, getGuesses, gotdId, played, won, guesses, keywords, imageUrl, setImageUrl, numKeywords, updateKeywords, markAsPlayed, getPlayed, markAsWon, setGotd, resetPlay, setName, getName } = keywordsSliceState;
  const { setGames, games } = gamesSliceState;
  const { modes } = modesSliceState;
  const mode = modes?.find((val: Mode) => val.id === 3); // temporary hard-coding
  const form = GamesFormInit();
  const socket = SocketInit();
  const readySetGo = games && gotdId && mode

  const saveDailyStats = useCallback((data: DailyStats) => {
    socket.emit('daily-stats', data);
  }, [socket]);

  const checkAnswer: CheckAnswerType<string> = useCallback((answer: boolean, keyword: string) => {
    if (answer) {
      markAsWon()
      markAsPlayed()
      saveDailyStats({
        gotdId,
        modeId: mode!.id,
        attempts: Math.min(getGuesses().length + 1, lives),
        guesses,
        found: true,
      })
    } else {
      const { igdbId, name } = form.getValues().game;
      updateGuesses({ igdbId, name });
      updateLivesLeft();

      if (getLivesLeft() === 0) {
        markAsPlayed()
        saveDailyStats({
          gotdId,
          modeId: mode!.id,
          attempts: getGuesses().length,
          guesses: getGuesses(),
          found: false,
        })
      } else {
        updateKeywords(keyword);
      }
    }

    form.reset();
  }, [form, markAsWon, markAsPlayed, saveDailyStats, gotdId, mode, getGuesses, lives, guesses, updateGuesses, updateLivesLeft, getLivesLeft, updateKeywords])

  useEffect(() => {
    const fetchGotd = async () => {
      try {
        const res = await fetch('/api/keywords');
        const { gotd, newGotd } = await res.json();

        if (newGotd) {
          resetPlay();
          useKeywordsStore.persist.clearStorage();
        }

        if (gotd && !getPlayed()) {
          void setGotd(gotd);
        }
      } catch (error) {
        console.error('Failed to set gotd (keywords):', error);
      }
    };

    setGames();
    fetchGotd();
  }, [setGotd, setGames, resetPlay, getPlayed]);

  useEffect(() => {
    if (!getPlayed()) {
      gSocket(socket, 'daily-res-1', 'daily-stats-response', checkAnswer, { setName, setImageUrl })
    }
  }, [getPlayed, socket, checkAnswer, setName, mode, setImageUrl]);

  if (!readySetGo) {
    return <Placeholders />
  }

  return (
    readySetGo &&
    <>
      <div className="flex flex-col min-h-screen">
        <main className="flex-grow container mx-auto px-4">
          <ModesHeader mode={mode} />

          <div className="grid md:grid-cols-2 gap-8">
            <div className={`flex flex-col items-center text-center p-6 bg-white shadow-sm rounded-lg ${process.env.NODE_ENV === 'development' && "border border-gray-200 "}`}>
              {
                played &&
                <Image
                  placeholder='empty'
                  src={imageUrl}
                  width={imgWidth}
                  height={imgHeight}
                  style={{ objectFit: "contain", width: "auto", height: "auto" }}
                  alt={imgAlt(mode?.label)}
                  className="mb-8"
                  priority
                />
              }
              <p className="mb-4 font-md font-light">1 keyword is revealed per guess. All keywords are revealed on the last guess.</p>
              <p className="mb-4 font-md font-light">Today&apos;s game has <span className="font-bold">{numKeywords}</span> keywords</p>
              <div className="flex flex-wrap gap-3">
                {keywords.map((keyword, index) => (
                  <span key={keyword + '-' + index} className='bg-gael-purple text-white px-4 py-2 rounded-full text-md'>
                    {keyword}
                  </span>
                ))}
              </div>
              {
                !played &&
                <div
                  style={{ width: imgWidth, height: imgHeight }}
                />
              }
            </div>

            <div className={`flex flex-col items-center text-center p-6 rounded-lg bg-white shadow-sm relative ${process.env.NODE_ENV === 'development' && "border border-gray-200 "}`}>
              <>
                <div className="text-lg text-center">
                  <p className="mb-5">
                    {played ? `${getName()}` : `🤔`}
                  </p>

                  <LivesLeftComp played={played} won={won} livesLeft={livesLeft} />
                </div>

                <div className="flex justify-center space-x-2 mt-8">
                  <Hearts lives={lives} livesLeft={livesLeft} />
                </div>
              </>

              <div className="w-full max-w-md flex flex-col">
                <GamesForm
                  form={form}
                  guesses={guesses}
                  socket={socket}
                  getLivesLeft={getLivesLeft}
                  played={played}
                />
              </div>

              <div className="w-full max-w-md flex flex-col">
                <div className="mt-4" aria-live="polite">
                  {guesses.map((game, index) => (
                    <div key={(game ? game.igdbId + '-guessed-' : 'skipped-') + index} className="p-2 bg-gael-red text-white rounded border border-3">
                      {game ? game.name : 'SKIPPED'}
                    </div>
                  ))}
                </div>
              </div>

              <div className={`absolute bottom-0 left-0 right-0 p-4 rounded-b-lg ${process.env.NODE_ENV === 'development' && "bg-gray-100 border-t border-gray-200"}`}>
                {process.env.NODE_ENV === 'development' &&
                  <div className="mb-5">
                    <Button onClick={() => form.reset()}>Clear Form</Button>
                  </div>
                }

                <div className="max-w-3xl mx-auto mt-10 text-center">
                  <DisplayCountdown />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-20">
            <ComingSoon />
          </div>
        </main>
      </div>
    </>
  )
}
