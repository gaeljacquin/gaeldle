import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { io } from "socket.io-client";
import { Games } from "@/types/games";
import { ZTriviaryVer2 } from "@/types/ztriviary-ver2";
import { TriviaryStats } from "@/types/unlimited-stats";
import {
  bgCorrect,
  bgPartial,
  textSubmit,
  textTryAgain,
} from "@/lib/client-constants";

const modeId = 9;

export const initialState = {
  lives: 0,
  livesLeft: 0,
  cards: 0,
  cardsLeft: 0,
  timeline: [],
  goodTimeline: [],
  timelineOnLoad: [],
  guesses: [],
  alreadyGuessed: false,
  submitButtonText: textSubmit,
  played: false,
  won: false,
  dummyOnLoad: true,
  nextGame: {},
};

const initialState2 = {
  streak: 0,
  maxStreak: 0,
};

type checkAnswerProps = {
  answer: boolean;
  timeline: Games;
  goodTimeline?: Games;
};

export const socket = io(`${process.env.serverUrl}`);

const wsConnect = () => {
  const { getState, setState } = zTriviaryVer2;

  socket.on("connect", () => {
    console.info("Connected to WebSocket server");
  });

  socket.on("triviary-ver2-res", (data: checkAnswerProps) => {
    checkAnswer(data);
  });

  socket.on("triviary-ver2-init", (data) => {
    const mode = data.mode;
    let { lives, lives: livesLeft } = mode;
    setState({
      timeline: [data.games[0]],
      lives,
      livesLeft,
      nextGame: data.games[data.games.length - 1],
    });
  });

  socket.on("triviary-ver2-stats-res", (data: { message: string }) => {
    console.info(data.message);
  });

  return () => {
    socket.off("connect");
    socket.off(`triviary-ver2-res`);
    socket.off(`triviary-ver2-init`);
    socket.off("triviary-ver2-stats-res");
  };
};

const checkAnswer = (data: checkAnswerProps) => {
  const { answer, timeline } = data;
  const { getState, setState } = zTriviaryVer2;
  setState({ timeline, submitButtonText: textTryAgain });

  if (answer) {
    getState().markAsPlayed();
    getState().markAsWon();
    getState().setStreak(true);
    saveTriviaryStats({
      modeId,
      attempts: 0,
      guesses: [],
      found: true,
      info: { answer: timeline },
    });
  } else {
    getState().updateLivesLeft();

    if (getState().livesLeft === 0) {
      getState().markAsPlayed();
      getState().setStreak(false);
      saveTriviaryStats({
        modeId,
        attempts: 0,
        guesses: [],
        found: false,
        info: { answer: null },
      });
    }
  }

  getState().setMaxStreak();
};

const saveTriviaryStats = (data: TriviaryStats) => {
  socket.emit("triviary-ver2-stats", data);
};

const zTriviaryVer2 = create(
  persist(
    devtools<ZTriviaryVer2>((set, get) => ({
      ...initialState,
      ...initialState2,
      updateLivesLeft: () => {
        const livesLeft = get().livesLeft;
        set({ livesLeft: livesLeft - 1 });
      },
      updateTimeline: (newTimeline: Games) => {
        const timeline = get().timeline;
        const dummyOnLoad = get().dummyOnLoad;

        if (dummyOnLoad) {
          set({ dummyOnLoad: false });
        }

        newTimeline = newTimeline.map((game, index) => {
          if (
            game.igdbId !== timeline[index].igdbId &&
            game.bgStatus === bgCorrect
          ) {
            return {
              ...game,
              bgStatus: bgPartial,
            };
          } else if (
            game.correctIndex &&
            index === game.correctIndex &&
            game.bgStatus === bgPartial
          ) {
            return {
              ...game,
              bgStatus: bgCorrect,
            };
          }

          return game;
        });

        set({ timeline: newTimeline });
      },
      getLivesLeft: () => get().livesLeft,
      getTimeline: () => get().timeline,
      markAsPlayed: () => {
        set({ played: true });
      },
      markAsWon: () => {
        set({ won: true });
      },
      getPlayed: () => get().played,
      getStreak: () => get().streak,
      getMaxStreak: () => get().maxStreak,
      resetPlay: () => {
        set({ ...initialState });
        socket.emit("init-triviary-ver2");
      },
      submitAnswer: () => {
        const timeline = get().timeline;
        const livesLeft = get().livesLeft - 1;
        const emit = { timeline, livesLeft };
        socket.emit("triviary-ver2", emit);
      },
      setStreak: (won: boolean) => {
        const streak = won ? get().streak + 1 : 0;
        set({ streak });
      },
      setMaxStreak: () => {
        const maxStreak = Math.max(get().maxStreak, get().streak);
        set({ maxStreak });
      },
    })),
    {
      name: "ztriviary-ver2",
      partialize: (state) => {
        const { lives, streak, maxStreak, ...rest } = state;
        void rest;

        return { lives, streak, maxStreak };
      },
    }
  )
);

wsConnect();

export default zTriviaryVer2;
