import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { io } from "socket.io-client";
import { Game } from "@/types/games";
import { ZHilo } from "~/src/types/zhilo";
import { UnlimitedStats } from "@/types/unlimited-stats";
import { bgCorrect, bgIncorrect } from "@/lib/client-constants";

const modeId = 9;

export const initialState = {
  attempts: 0,
  streak: 0,
  lives: 0,
  livesLeft: -1,
  played: false,
  won: false,
  nextGame: null,
};

const initialState2 = {
  bestStreak: 0,
};

type checkAnswerProps = {
  gameCheck: Partial<Game>;
  insertIndex: number;
};

export const socket = io(`${process.env.serverUrl}`);

const wsConnect = () => {
  const { getState, setState } = zHilo;

  socket.on("connect", () => {
    console.info("Connected to WebSocket server");
  });

  socket.on("hilo-check-res", (data: checkAnswerProps) => {
    checkAnswer(data);
  });

  socket.on("hilo-next-res", (data) => {
    const { nextGame } = data;

    if (!nextGame) {
      getState().markAsPlayed();
      getState().markAsWon();
      saveUnlimitedStats({
        modeId,
        found: true,
        info: {
          streak: getState().streak,
          bestStreak: getState().bestStreak,
        },
        attempts: getState().attempts,
      });
    } else {
      setState({
        nextGame,
      });
    }
  });

  socket.on("hilo-init-res", (data) => {
    const mode = data.mode;
    const timelineGame = data.games[0];
    const nextGame = data.games[data.games.length - 1];
    let { lives, lives: livesLeft } = mode;
    setState({
      lives,
      livesLeft,
      nextGame,
    });
  });

  socket.on("hilo-stats-res", (data: { message: string }) => {
    console.info(data.message);
  });

  return () => {
    socket.off("connect");
    socket.off(`hilo-init-res`);
    socket.off(`hilo-check-res`);
    socket.off(`hilo-next-res`);
    socket.off("hilo-stats-res");
  };
};

const checkAnswer = (data: checkAnswerProps) => {
  const { insertIndex, gameCheck } = data;
  const { getState, setState } = zHilo;

  if (true) {
    getState().setStreak(true);
    getState().setBestStreak();
    socket.emit("hilo-next", {
      timelineIds: timeline.map((game) => game.igdbId),
    });
  } else {
    getState().updateLivesLeft();

    if (getState().livesLeft === 0) {
      getState().markAsPlayed();
      getState().setBestStreak();
      saveUnlimitedStats({
        modeId,
        found: false,
        info: {
          timeline,
          streak: getState().streak,
          bestStreak: getState().bestStreak,
        },
        attempts: getState().attempts,
      });
    } else {
      socket.emit("hilo-next", {
        timelineIds: timeline.map((game) => game.igdbId),
      });
    }
  }

  setState({
    timeline,
    containers: {
      ...containers,
      timeline: timeline?.map((game) => game?.igdbId ?? 0) ?? [0],
    },
    shadowContainers: {
      ...containers,
      timeline: timeline?.map((game) => game?.igdbId ?? 0) ?? [0],
    },
  });
};

const saveUnlimitedStats = (data: UnlimitedStats) => {
  socket.emit("hilo-stats", data);
};

const zHilo = create(
  persist(
    devtools<ZHilo>((set, get) => ({
      ...initialState,
      ...initialState2,
      updateLivesLeft: () => {
        const livesLeft = get().livesLeft;
        set({ livesLeft: livesLeft - 1 });
      },
      getLivesLeft: () => get().livesLeft,
      markAsPlayed: () => {
        set({ played: true });
      },
      markAsWon: () => {
        set({ won: true });
      },
      getPlayed: () => get().played,
      getStreak: () => get().streak,
      getBestStreak: () => get().bestStreak,
      getNextGame: () => get().nextGame,
      resetPlay: () => {
        set({ ...initialState });
        socket.emit("hilo-init");
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
      name: "zhilo",
      partialize: (state) => {
        const { lives, bestStreak, ...rest } = state;
        void rest;

        return { lives, bestStreak };
      },
    }
  )
);

wsConnect();

export default zHilo;
