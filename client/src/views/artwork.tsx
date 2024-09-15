'use client';

import Image from "next/image";
import { useEffect, useState, useRef, useCallback } from 'react'
import { Heart } from 'lucide-react'
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import io, { Socket } from 'socket.io-client';
import useGaeldleStore from '@/stores/gaeldle-store';
import useArtworkStore, { artworkStore } from '@/stores/artwork-store';
import { gamesSlice } from '@/stores/games-slice';
import { Button } from "@/components/ui/button"
import PixelatedImage from '@/components/pixelate-image';
import Placeholders from '@/views/placeholders'
import { modesSlice } from "@/stores/modes-slice";
import DisplayCountdown from "@/components/display-countdown";
import { DailyStats } from "@/types/daily-stats";
import { Mode } from "@/types/modes";
import ComingSoon from "@/components/coming-soon";
import LivesLeftComp from "@/components/lives-left";
import GamesForm from "@/components/games-form";
import { GamesFormInit, imgAlt, imgHeight, imgWidth, SocketInit } from "@/lib/constants";
import ModesHeader from "@/components/modes-header";
import gSocket from "@/lib/gsocket";
import Hearts from "@/components/hearts";

export default function Artwork() {
  const artworkSliceState = useArtworkStore() as artworkStore;
  const gamesSliceState = useGaeldleStore() as gamesSlice;
  const modesSliceState = useGaeldleStore() as modesSlice;
  const { livesLeft, lives, updateLivesLeft, updateGuesses, getLivesLeft, getGuesses, gotdId, played, won, guesses, pixelation, imageUrl, setPixelation, removePixelation, markAsPlayed, getPlayed, markAsWon, setGotd, resetPlay, setName, getName } = artworkSliceState;
  const { setGames, games } = gamesSliceState;
  const { modes } = modesSliceState;
  const mode = modes?.find((val: Mode) => val.id === 2); // temporary hard-coding
  const form = GamesFormInit();
  const socket = SocketInit();
  const readySetGo = games && gotdId && mode

  const saveDailyStats = useCallback((data: DailyStats) => {
    socket.emit('daily-stats', data);
  }, [socket]);

  const checkAnswer = useCallback((answer: boolean) => {
    if (answer) {
      markAsWon()
      markAsPlayed()
      removePixelation()
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
      setPixelation();
      updateLivesLeft();

      if (getLivesLeft() === 0) {
        markAsPlayed()
        removePixelation()
        saveDailyStats({
          gotdId,
          modeId: mode!.id,
          attempts: getGuesses().length,
          guesses: getGuesses(),
          found: false,
        })
      }
    }

    form.reset();
  }, [form, markAsWon, markAsPlayed, removePixelation, saveDailyStats, gotdId, mode, getGuesses, lives, guesses, updateGuesses, setPixelation, updateLivesLeft, getLivesLeft])

  useEffect(() => {
    const fetchGotd = async () => {
      try {
        const res = await fetch('/api/artwork');
        const { gotd, newGotd } = await res.json();

        if (newGotd) {
          resetPlay();
          useArtworkStore.persist.clearStorage();
        }

        if (gotd && !getPlayed()) {
          void setGotd(gotd);
        }
      } catch (error) {
        console.error('Failed to set gotd (artwork):', error);
      }
    };

    setGames();
    fetchGotd();
  }, [setGotd, setGames, resetPlay, getPlayed]);

  useEffect(() => {
    if (!getPlayed()) {
      gSocket(socket, 'daily-res-2', 'daily-stats-response', checkAnswer, { setName });
    }
  }, [getPlayed, socket, checkAnswer, setName, mode]);

  if (!readySetGo) {
    return <Placeholders />
  }

  return (
    readySetGo &&
    <>
      <main className="flex-grow flex flex-col items-center space-y-8">
        <ModesHeader mode={mode} />

        <div className="w-full max-w-md flex flex-col items-center space-y-8 mt-4">
          {
            !played ?
              <PixelatedImage
                imageUrl={imageUrl}
                width={imgWidth}
                height={imgHeight}
                pixelationFactor={pixelation}
                alt={imgAlt(mode?.label)}
              />
              :
              <Image
                placeholder='empty'
                src={imageUrl}
                width={imgWidth}
                height={imgHeight}
                style={{ objectFit: "contain", width: "auto", height: "auto" }}
                alt={imgAlt(mode?.label)}
                priority
              />
          }

          <div className="text-lg text-center">
            <p className="mb-5">
              {played ? `${getName()}` : `🤔`}
            </p>

            <LivesLeftComp played={played} won={won} livesLeft={livesLeft} />

            <div className="flex justify-center space-x-2 mt-8">
              <Hearts lives={lives} livesLeft={livesLeft} />
            </div>

            <GamesForm
              form={form}
              guesses={guesses}
              socket={socket}
              getLivesLeft={getLivesLeft}
              played={played}
            />

            <div className="w-full max-w-md flex flex-col">
              <div className="mt-4" aria-live="polite">
                {guesses.map((game, index) => (
                  <div key={(game ? game.igdbId + '-guessed-' : 'skipped-') + index} className="p-2 bg-gael-red text-white rounded border border-3">
                    {game ? game.name : 'SKIPPED'}
                  </div>
                ))}
              </div>
            </div>

            <div>
              {process.env.NODE_ENV === 'development' &&
                <div className="mt-10 mb-5">
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
    </>
  )
}
