import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { io } from "socket.io-client";
import { Guess } from "@/types/games";
import { CoverStats } from "~/src/types/unlimited-stats";
import { ZCover } from "~/src/types/zcover";
import { placeholderImage } from "../lib/client-constants";

const modeId = 5;

const initialState = {
  igdbId: 0,
  imageUrl: placeholderImage.url,
  name: "",
  lives: 0,
  livesLeft: 0,
  streak: 0,
  guesses: [],
  skipIgdbIds: [],
  played: false,
  won: false,
  finito: false,
  pixelation: 0,
  pixelationStep: 0,
};

const initialState2 = {
  bestStreak: 0,
};

type checkAnswerProps = {
  answer: boolean;
  guess: Guess;
  igdbId: number;
  name: string;
};

export const socket = io(`${process.env.serverUrl}`);

const wsConnect = () => {
  const { getState, setState } = zCover;

  socket.on("connect", () => {
    console.info("Connected to WebSocket server");
  });

  socket.on("cover-res", (data) => {
    checkAnswer(data);
  });

  socket.on("cover-next-res", (data) => {
    const { nextGame, mode } = data;

    if (!nextGame) {
      getState().markAsPlayed();
      setState({ finito: true });
    } else {
      const { lives, pixelation, pixelationStep } = mode;
      const { imageUrl } = nextGame;
      const { streak, ...rest } = initialState;
      setState({ ...rest });
      setState({
        imageUrl,
        lives,
        livesLeft: lives,
        pixelation,
        pixelationStep,
      });
    }
  });

  socket.on("cover-init-res", (data) => {
    const { nextGame, mode } = data;
    const { lives, pixelation, pixelationStep } = mode;

    if (!nextGame) {
      getState().markAsPlayed();
      getState().markAsWon();
    } else {
      const { imageUrl } = nextGame;
      setState({ ...initialState });
      setState({
        imageUrl,
        lives,
        livesLeft: lives,
        pixelation,
        pixelationStep,
      });
    }
  });

  socket.on("cover-stats-res", (data: { message: string }) => {
    console.info(data.message);
  });

  return () => {
    socket.off("connect");
    socket.off(`cover-init-res`);
    socket.off(`cover-res`);
    socket.off(`cover-next-res`);
    socket.off("cover-stats-res");
  };
};

const checkAnswer = ({ answer, ...props }: checkAnswerProps) => {
  const { getState, setState } = zCover;
  const { guess, igdbId } = props;

  if (answer) {
    getState().markAsWon();
    getState().markAsPlayed();
    getState().removePixelation();
    getState().setStreak(true);
    getState().setBestStreak();
    const skipIgdbIds = getState().skipIgdbIds;
    skipIgdbIds.push(guess.igdbId);
    saveCoverStats({
      igdbId,
      modeId,
      found: true,
      attempts: Math.min(getState().guesses.length + 1, getState().lives),
      guesses: getState().guesses,
      info: {
        streak: getState().streak,
        bestStreak: getState().bestStreak,
        skipIgdbIds,
      },
    });
    setState({ skipIgdbIds });
  } else {
    getState().updateGuesses(guess);
    getState().setPixelation();
    getState().updateLivesLeft();

    if (getState().livesLeft === 0) {
      getState().markAsPlayed();
      getState().removePixelation();
      getState().setBestStreak();
      saveCoverStats({
        igdbId,
        modeId,
        found: false,
        attempts: getState().guesses.length,
        guesses: getState().guesses,
        info: {
          streak: getState().streak,
          bestStreak: getState().bestStreak,
        },
      });
    }
  }
};

const saveCoverStats = (data: CoverStats) => {
  socket.emit("timeline2-stats", data);
};

const zCover = create(
  persist(
    devtools<ZCover>((set, get) => ({
      ...initialState,
      ...initialState2,
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
      getStreak: () => get().streak,
      getBestStreak: () => get().bestStreak,
      setName: (name: string) => {
        set({ name });
      },
      getName: () => get().name,
      resetPlay: () => {
        set({ ...initialState });
        socket.emit("cover-init");
      },
      continuePlay: () => {
        const emit = { skipIgdbIds: get().skipIgdbIds };
        socket.emit("cover-next", emit);
      },
      setStreak: (won: boolean) => {
        const streak = won ? get().streak + 1 : 0;
        set({ streak });
      },
      setBestStreak: () => {
        const bestStreak = Math.max(get().bestStreak, get().streak);
        set({ bestStreak });
      },
    })),
    {
      name: "zcover",
      partialize: (state) => {
        const { lives, streak, bestStreak, ...rest } = state;
        void rest;

        return { lives, streak, bestStreak };
      },
    }
  )
);

wsConnect();

export default zCover;
