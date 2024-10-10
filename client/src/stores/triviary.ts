import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { io } from "socket.io-client";
import { Games } from "@/types/games";
import { ZTriviary } from "@/types/ztriviary";
import { TriviaryStats } from "@/types/unlimited-stats";
import {
  bgCorrect,
  bgPartial,
  textAlreadyGuessed,
  textStartingPosition,
  textSubmit,
  textTryAgain,
} from "@/lib/client-constants";

const modeId = 8;

export const initialState = {
  lives: 0,
  livesLeft: 0,
  timeline: [],
  goodTimeline: [],
  timelineOnLoad: [],
  guesses: [],
  alreadyGuessed: false,
  submitButtonText: textSubmit,
  played: false,
  won: false,
  dummyOnLoad: true,
};

const initialState2 = {
  streak: 0,
  bestStreak: 0,
  dragSwitch: true,
};

type checkAnswerProps = {
  answer: boolean;
  timeline: Games;
  goodTimeline?: Games;
};

export const socket = io(`${process.env.serverUrl}`);

const wsConnect = () => {
  const { setState } = zTriviary;

  socket.on("connect", () => {
    console.info("Connected to WebSocket server");
  });

  socket.on("triviary-res", (data: checkAnswerProps) => {
    checkAnswer(data);
  });

  socket.on("triviary-init-res", (data) => {
    const mode = data.mode;
    let { lives, lives: livesLeft } = mode;
    setState({
      timeline: data.games,
      lives,
      livesLeft,
      timelineOnLoad: data.games,
    });
  });

  socket.on("triviary-stats-res", (data: { message: string }) => {
    console.info(data.message);
  });

  return () => {
    socket.off("connect");
    socket.off(`triviary-res`);
    socket.off(`triviary-init-res`);
    socket.off("triviary-stats-res");
  };
};

const checkAnswer = (data: checkAnswerProps) => {
  const { answer, timeline, goodTimeline } = data;
  const { getState, setState } = zTriviary;
  setState({ timeline, submitButtonText: textTryAgain, alreadyGuessed: true });

  if (answer) {
    getState().markAsPlayed();
    getState().markAsWon();
    getState().setStreak(true);
    getState().setBestStreak();
    saveTriviaryStats({
      modeId,
      attempts: Math.min(getState().guesses.length + 1, getState().lives),
      guesses: getState().guesses,
      found: true,
      info: { answer: timeline },
    });
  } else {
    getState().updateGuesses(timeline);
    getState().updateLivesLeft();
    getState().setBestStreak();
    getState().setStreak(false);

    if (getState().livesLeft === 0) {
      getState().markAsPlayed();
      setState({ goodTimeline });
      saveTriviaryStats({
        modeId,
        attempts: getState().guesses.length,
        guesses: getState().guesses,
        found: false,
        info: { answer: goodTimeline },
      });
    }
  }

  getState().setBestStreak();
};

const saveTriviaryStats = (data: TriviaryStats) => {
  socket.emit("triviary-stats", data);
};

const zTriviary = create(
  persist(
    devtools<ZTriviary>((set, get) => ({
      ...initialState,
      ...initialState2,
      updateLivesLeft: () => {
        const livesLeft = get().livesLeft;
        set({ livesLeft: livesLeft - 1 });
      },
      updateTimeline: (newTimeline: Games) => {
        const timeline = get().timeline;
        let alreadyGuessed = get().alreadyGuessed;
        const guesses = get().guesses;
        const dummyOnLoad = get().dummyOnLoad;
        const newTimelineIds = newTimeline.map((game) => game.igdbId);
        const timelineOnLoad = get().timelineOnLoad;
        const timelineOnLoadIds = timelineOnLoad.map((game) => game.igdbId);

        if (dummyOnLoad) {
          set({ dummyOnLoad: false });
        }

        if (alreadyGuessed) {
          set({
            alreadyGuessed: false,
            submitButtonText: initialState.submitButtonText,
          });
        }

        if (
          newTimelineIds.length === timelineOnLoadIds.length &&
          newTimelineIds.every((id, index) => id === timelineOnLoadIds[index])
        ) {
          alreadyGuessed = true;
          set({ alreadyGuessed, submitButtonText: textStartingPosition });
        }

        guesses.some((guess) => {
          const guessIds = guess.map((game) => game.igdbId);

          if (
            newTimelineIds.length === guessIds.length &&
            newTimelineIds.every((id, index) => id === guessIds[index])
          ) {
            alreadyGuessed = true;
            set({ alreadyGuessed, submitButtonText: textAlreadyGuessed });
            return true;
          }
        });

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
      updateGuesses: (timeline: Games) => {
        const guesses = get().guesses;
        set({ guesses: [timeline, ...guesses] });
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
      getBestStreak: () => get().bestStreak,
      resetPlay: () => {
        set({ ...initialState });
        socket.emit("triviary-init");
      },
      submitAnswer: () => {
        const timeline = get().timeline;
        const livesLeft = get().livesLeft - 1;
        const emit = { timeline, livesLeft };
        socket.emit("triviary", emit);
      },
      setLastGuess: () => {
        const guesses = get().guesses;
        set({ timeline: guesses[0], alreadyGuessed: true });
      },
      setStreak: (won: boolean) => {
        const streak = won ? get().streak + 1 : 0;
        set({ streak });
      },
      setBestStreak: () => {
        const bestStreak = Math.max(get().bestStreak, get().streak);
        set({ bestStreak });
      },
      setDragSwitch: () => {
        const dragSwitch = get().dragSwitch;
        set({ dragSwitch: !dragSwitch });
      },
    })),
    {
      name: "ztriviary",
      partialize: (state) => {
        const { lives, streak, bestStreak, dragSwitch, ...rest } = state;
        void rest;

        return { lives, streak, bestStreak, dragSwitch };
      },
    }
  )
);

wsConnect();

export default zTriviary;
