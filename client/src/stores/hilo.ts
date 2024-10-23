import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { io } from "socket.io-client";
import { Game } from "@/types/games";
import { Operator, ZHilo } from "~/src/types/zhilo";
import { HiloStats } from "@/types/unlimited-stats";
import { bgCorrect, bgIncorrect } from "@/lib/client-constants";

const modeId = 10;

export const initialState = {
  streak: 0,
  lives: 0,
  livesLeft: -1,
  played: false,
  won: false,
  operator: "=" as Operator,
  timeline: [],
  guesses: [],
  nextGame: null,
  currentGame: null,
};

const initialState2 = {
  bestStreak: 0,
};

type checkAnswerProps = {
  gameCheck: Partial<Game>;
  operator: Omit<Operator, "=">;
};

export const socket = io(`${process.env.serverUrl}`);

const wsConnect = () => {
  const { getState, setState } = zHilo;
  const { timeline, guesses, streak, bestStreak, markAsPlayed, markAsWon } =
    getState();

  socket.on("connect", () => {
    console.info("Connected to WebSocket server");
  });

  socket.on("hilo-check-res", (data: checkAnswerProps) => {
    checkAnswer(data);
  });

  socket.on("hilo-next-res", (data) => {
    const { nextGame } = data;

    if (!nextGame) {
      markAsPlayed();
      markAsWon();
      saveUnlimitedStats({
        modeId,
        found: true,
        info: {
          streak,
          bestStreak,
        },
        attempts: streak,
        guesses,
      });
      setState({ nextGame: null });
    } else {
      setState({
        currentGame: timeline[timeline.length - 1],
        nextGame,
      });
    }
    setState({
      operator: initialState.operator,
    });
  });

  socket.on("hilo-init-res", (data) => {
    const mode = data.mode;
    const currentGame = data.games[0];
    const nextGame = data.games[data.games.length - 1];
    let { lives, lives: livesLeft } = mode;
    timeline.push(currentGame);
    setState({
      lives,
      livesLeft,
      currentGame,
      nextGame,
      timeline,
    });
  });

  socket.on("hilo-stats-res", (data: { message: string }) => {
    console.info(data.message);
  });

  return () => {
    socket.off("connect");
    socket.off("hilo-init-res");
    socket.off("hilo-check-res");
    socket.off("hilo-next-res");
    socket.off("hilo-stats-res");
  };
};

const checkAnswer = (data: checkAnswerProps) => {
  const { gameCheck, operator } = data;
  const { getState, setState } = zHilo;
  const {
    currentGame,
    timeline,
    guesses,
    streak,
    bestStreak,
    updateLivesLeft,
    setStreak,
    setBestStreak,
    markAsPlayed,
  } = getState();
  let rightAnswer = false;
  let bgStatus = bgIncorrect;

  switch (operator) {
    case ">":
      rightAnswer = !!(
        gameCheck.frd &&
        currentGame?.frd &&
        gameCheck.frd >= currentGame.frd
      );
      rightAnswer && (bgStatus = bgCorrect);
      break;
    case "<":
      rightAnswer = !!(
        gameCheck.frd &&
        currentGame?.frd &&
        gameCheck.frd <= currentGame.frd
      );
      rightAnswer && (bgStatus = bgCorrect);
      break;
    default:
      console.error(`Operator ${operator} not supported`);
      break;
  }

  timeline[timeline.length - 1].bgStatus = bgStatus;
  timeline[timeline.length - 1].frd = gameCheck.frd;
  timeline[timeline.length - 1].frdFormatted = gameCheck.frdFormatted;
  guesses.unshift({
    currentGame: currentGame!,
    nextGame: timeline[timeline.length - 1],
    operator,
    rightAnswer,
  });

  if (rightAnswer) {
    setStreak(true);
    setBestStreak();
    socket.emit("hilo-next", {
      timelineIds: timeline.map((game) => game.igdbId),
    });
  } else {
    updateLivesLeft();

    if (getState().livesLeft === 0) {
      // getState().livesLeft gets the updated value
      // const { livesLeft } = getState(); then livesLeft doesn't
      markAsPlayed();
      setBestStreak();
      saveUnlimitedStats({
        modeId,
        found: false,
        info: {
          timeline,
          streak,
          bestStreak,
        },
        attempts: streak,
        guesses,
      });
      setState({ currentGame: timeline[timeline.length - 1], nextGame: null });
    } else {
      socket.emit("hilo-next", {
        timelineIds: timeline.map((game) => game.igdbId),
      });
    }
  }

  setState({
    timeline,
    operator: initialState.operator,
  });
};

const saveUnlimitedStats = (data: HiloStats) => {
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
      getTimeline: () => get().timeline,
      resetPlay: () => {
        set({ ...initialState, timeline: [], guesses: [] });
        console.log(get().guesses, get().timeline);
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
      submitOperator: (operator: Operator) => {
        const { timeline, nextGame } = get();
        timeline.push(nextGame!);
        const emit = { operator };
        socket.emit("hilo-check", emit);
        set({ timeline, operator });
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
