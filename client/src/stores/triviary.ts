import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { io } from "socket.io-client";
import { Game, Games, Guess } from "@/types/games";
import { ZTriviary } from "@/types/ztriviary";
import { TriviaryStats } from "@/types/unlimited-stats";
import {
  bgCorrect,
  bgPartial,
  textAlreadyGuessed,
  textStartingPosition,
  textSubmit,
  textTryAgain,
} from "../lib/constants";
import { time } from "console";

const modeId = 8;

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
};

type checkAnswerProps = {
  answer: boolean;
  timeline: Games;
  goodTimeline?: Games;
};

export const socket = io(`${process.env.serverUrl}`);

const wsConnect = () => {
  const { getState, setState } = zTriviary;

  socket.on("connect", () => {
    console.info("Connected to WebSocket server");
  });

  socket.on("triviary-res", (data: checkAnswerProps) => {
    checkAnswer(data);
  });

  socket.on("triviary-init", (data) => {
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
    socket.off(`triviary-init`);
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
};

const saveTriviaryStats = (data: TriviaryStats) => {
  socket.emit("triviary-stats", data);
};

const zTriviary = create(
  persist(
    devtools<ZTriviary>((set, get) => ({
      ...initialState,
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
      resetPlay: () => {
        set({ ...initialState });
        socket.emit("init-triviary");
      },
      submitAnswer: () => {
        const timeline = get().timeline;
        const livesLeft = get().livesLeft - 1;
        const emit = { timeline, livesLeft };
        socket.emit("triviary", emit);
      },
      setLastGuess: () => {
        console.log("set last guess");
        const guesses = get().guesses;
        set({ timeline: guesses[0], alreadyGuessed: true });
      },
    })),
    {
      name: "ztriviary",
      partialize: (state) => {
        const { lives, ...rest } = state;
        void rest;

        return { lives };
      },
    }
  )
);

wsConnect();

export default zTriviary;