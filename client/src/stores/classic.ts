import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { io } from "socket.io-client";
import { Guess, Guesses } from "@/types/games";
import { Gotd } from "@/types/gotd";
import { DailyStats } from "~/src/types/daily-stats";
import { ZClassic } from "~/src/types/zclassic";
import { absoluteUrl } from "@/lib/client-constants";

const modeId = 1;

export const initialState = {
  gotdId: 0,
  imageUrl: "/placeholder.jpg",
  name: "",
  lives: 0,
  livesLeft: 0,
  guesses: [],
  played: false,
  won: false,
  pixelation: 0,
  pixelationStep: 0,
};

export const socket = io(`${process.env.serverUrl}`);

const wsConnect = () => {
  if (!zClassic.getState().played) {
    socket.on("connect", () => {
      console.info("Connected to WebSocket server");
    });

    socket.on(
      `daily-res-${modeId}`,
      (data: {
        clientId: string;
        answer: boolean;
        name: string;
        guess: Guess;
      }) => {
        checkAnswer(data.answer, data.guess);
        zClassic.setState({ name: data.name });
      }
    );

    socket.on("daily-stats-response", (data: { message: string }) => {
      console.info(data.message);
    });

    return () => {
      socket.off("connect");
      socket.off(`daily-res-${modeId}`);
      socket.off("daily-stats-response");
    };
  }
};

const checkAnswer = (answer: boolean, guess: Guess) => {
  const getState = () => {
    return zClassic.getState();
  };

  if (answer) {
    getState().markAsWon();
    getState().markAsPlayed();
    getState().removePixelation();
    saveDailyStats({
      gotdId: getState().gotdId,
      modeId,
      attempts: Math.min(getState().guesses.length + 1, getState().lives),
      guesses: getState().guesses,
      found: true,
    });
  } else {
    getState().updateGuesses(guess);
    getState().setPixelation();
    getState().updateLivesLeft();

    if (getState().livesLeft === 0) {
      getState().markAsPlayed();
      getState().removePixelation();
      saveDailyStats({
        gotdId: getState().gotdId,
        modeId,
        attempts: getState().guesses.length,
        guesses: getState().guesses,
        found: false,
      });
    }
  }
};

const saveDailyStats = (data: DailyStats) => {
  socket.emit("daily-stats", data);
};

const zClassic = create(
  persist(
    devtools<ZClassic>((set, get) => ({
      ...initialState,
      updateLivesLeft: () => {
        const livesLeft = get().livesLeft;
        set({ livesLeft: livesLeft - 1 });
      },
      updateGuesses: (guess: Guess | null) => {
        const guesses = get().guesses;
        if (guess) {
          set({ guesses: [...guesses, guess] });
        }
      },
      getLivesLeft: () => get().livesLeft,
      getGuesses: () => get().guesses,
      markAsPlayed: () => {
        set({ played: true });
      },
      getPlayed: () => get().played,
      markAsWon: () => {
        set({ won: true });
      },
      setPixelation: () => {
        const pixelation = get().pixelation;
        const pixelationStep = get().pixelationStep;
        set({ pixelation: pixelation - pixelationStep });
      },
      removePixelation: () => {
        set({ pixelation: 0 });
      },
      setGotd: (gotd: Gotd) => {
        const { imageUrl, modes, id } = gotd;
        const { label, lives, pixelation, pixelationStep } = modes;
        set({
          gotdId: id,
          imageUrl,
          name: label,
          lives,
          livesLeft: lives,
          pixelation,
          pixelationStep,
        });
      },
      setName: (name: string) => {
        set({ name });
      },
      getName: () => get().name,
      fetchGotd: async () => {
        try {
          const endpoint = "/api/classic";
          const res = await fetch(endpoint);
          const { gotd } = await res.json();
          const currentGotdId = get().gotdId;

          if (!currentGotdId || currentGotdId !== gotd.id) {
            get().resetPlay();
            get().setGotd(gotd);
          }
        } catch (error) {
          console.error("Failed to set gotd (classic):", error);
        }
      },
      resetPlay: () => {
        set({ ...initialState });
      },
    })),
    { name: "zclassic" }
  )
);

zClassic.getState().fetchGotd();
wsConnect();

export default zClassic;
