import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { io } from "socket.io-client";
import { Game } from "@/types/games";
import {
  setContainersDragEndProps,
  setContainersDragOverProps,
  ZTriviary2,
} from "~/src/types/ztriviary2";
import { Triviary2Stats } from "@/types/unlimited-stats";
import { bgCorrect, bgIncorrect, textSubmit } from "@/lib/client-constants";

const modeId = 9;

export const initialState = {
  streak: 0,
  containers: {
    nextGame: [0],
    timeline: [-1],
  },
  shadowContainers: {
    nextGame: [0],
    timeline: [-1],
  },
  lives: 0,
  livesLeft: -1,
  timeline: [],
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
  const { getState, setState } = zTriviary2;

  socket.on("connect", () => {
    console.info("Connected to WebSocket server");
  });

  socket.on("triviary2-check-res", (data: checkAnswerProps) => {
    checkAnswer(data);
  });

  socket.on("triviary2-next-res", (data) => {
    const { nextGame } = data;
    const containers = getState().containers;

    if (!nextGame) {
      getState().markAsPlayed();
      getState().markAsWon();
      saveTriviary2Stats({
        modeId,
        found: true,
        info: {
          timeline: getState().timeline,
          streak: getState().streak,
          bestStreak: getState().bestStreak,
        },
      });
    } else {
      setState({
        nextGame,
        containers: {
          ...containers,
          nextGame: [nextGame.igdbId],
        },
        shadowContainers: {
          ...containers,
          nextGame: [nextGame.igdbId],
        },
      });
    }
  });

  socket.on("triviary2-init-res", (data) => {
    const mode = data.mode;
    const timelineGame = data.games[0];
    const nextGame = data.games[data.games.length - 1];
    let { lives, lives: livesLeft } = mode;
    setState({
      timeline: [timelineGame],
      lives,
      livesLeft,
      nextGame,
      containers: {
        nextGame: [nextGame.igdbId],
        timeline: [timelineGame.igdbId],
      },
      shadowContainers: {
        nextGame: [nextGame.igdbId],
        timeline: [timelineGame.igdbId],
      },
    });
  });

  socket.on("triviary2-stats-res", (data: { message: string }) => {
    console.info(data.message);
  });

  return () => {
    socket.off("connect");
    socket.off(`triviary2-init-res`);
    socket.off(`triviary2-check-res`);
    socket.off(`triviary2-next-res`);
    socket.off("triviary2-stats-res");
  };
};

const checkAnswer = (data: checkAnswerProps) => {
  const { insertIndex, gameCheck } = data;
  const { getState, setState } = zTriviary2;
  const timeline = getState().timeline;
  const containers = getState().containers;
  timeline[insertIndex].frd = gameCheck.frd;
  timeline[insertIndex].frdFormatted = gameCheck.frdFormatted;
  const isTimelineSorted = timeline.every((item, index, array) => {
    return index === 0 || (array[index - 1].frd ?? 0) <= (item.frd ?? 0);
  });

  if (isTimelineSorted) {
    timeline[insertIndex].bgStatus = bgCorrect;
    getState().setStreak(true);
    getState().setBestStreak();
    socket.emit("triviary2-next", {
      timelineIds: timeline.map((game) => game.igdbId),
    });
  } else {
    timeline[insertIndex].bgStatus = bgIncorrect;
    timeline.sort((a, b) => {
      return (a.frd ?? 0) - (b.frd ?? 0);
    });
    getState().updateLivesLeft();

    if (getState().livesLeft === 0) {
      getState().markAsPlayed();
      getState().setBestStreak();
      getState().setStreak(false);
      saveTriviary2Stats({
        modeId,
        found: false,
        info: {
          timeline,
          streak: getState().streak,
          bestStreak: getState().bestStreak,
        },
      });
    } else {
      socket.emit("triviary2-next", {
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

const saveTriviary2Stats = (data: Triviary2Stats) => {
  socket.emit("triviary2-stats", data);
};

const zTriviary2 = create(
  persist(
    devtools<ZTriviary2>((set, get) => ({
      ...initialState,
      ...initialState2,
      updateLivesLeft: () => {
        const livesLeft = get().livesLeft;
        set({ livesLeft: livesLeft - 1 });
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
      getNextGame: () => get().nextGame,
      resetPlay: () => {
        set({ ...initialState });
        socket.emit("triviary2-init");
      },
      setStreak: (won: boolean) => {
        const streak = won ? get().streak + 1 : 0;
        set({ streak });
      },
      setBestStreak: () => {
        const bestStreak = Math.max(get().bestStreak, get().streak);
        set({ bestStreak });
      },
      getContainers: () => get().containers,
      setContainersDragEnd: (props: setContainersDragEndProps) => {
        const { overContainer, activeIndex, overIndex, arrayMove } = props;
        const containers = get().containers;
        const timeline = get().timeline;
        const nextGame = get().nextGame;
        const emit = { insertIndex: overIndex };

        if (overIndex === 0) {
          timeline.unshift(nextGame!);
        } else {
          timeline.splice(overIndex, 0, nextGame!);
        }

        set({
          containers: {
            ...containers,
            [overContainer]: arrayMove(
              containers[overContainer as keyof typeof containers],
              activeIndex,
              overIndex
            ),
          },
          shadowContainers: containers,
          timeline,
          nextGame: null,
        });
        socket.emit("triviary2-check", emit);
      },
      setContainersDragOver: (props: setContainersDragOverProps) => {
        const {
          activeContainer,
          overContainer,
          activeId,
          overId,
          draggingRect,
          overRect,
          over,
          containers,
        } = props;
        const activeItems =
          containers[activeContainer as keyof typeof containers];
        const overItems = containers[overContainer as keyof typeof containers];
        const activeIndex = activeItems.indexOf(activeId);
        const overIndex = overItems.indexOf(overId);
        let newIndex;
        if (overId in containers) {
          newIndex = overItems.length + 1;
        } else {
          // const isLeftOfFirstItem =
          //   over &&
          //   overIndex === 0 &&
          //   draggingRect &&
          //   overRect &&
          //   draggingRect.left < overRect.left - overRect.width;
          // const modifier = isLeftOfFirstItem ? 1 : 0;
          // newIndex =
          //   overIndex >= 0 ? overIndex + modifier : overItems.length + 1;

          const isLeftOfFirstItem =
            over &&
            overIndex === 0 &&
            draggingRect &&
            overRect &&
            draggingRect.left < overRect.left - overRect.width;

          const isRightOfLastItem =
            over &&
            overIndex === overItems.length - 1 && // Check if overIndex is the last item
            draggingRect &&
            overRect &&
            draggingRect.right > overRect.right + overRect.width; // Check if draggingRect is to the right of the last item's right edge

          const modifier = isLeftOfFirstItem ? 1 : isRightOfLastItem ? 0 : 0;
          newIndex =
            overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
        }

        set({
          containers: {
            ...containers,
            [activeContainer]: [
              ...containers[activeContainer as keyof typeof containers].filter(
                (item) => item !== activeId
              ),
            ],
            [overContainer]: [
              ...containers[overContainer as keyof typeof containers].slice(
                0,
                newIndex
              ),
              containers[activeContainer as keyof typeof containers][
                activeIndex
              ],
              ...containers[overContainer as keyof typeof containers].slice(
                newIndex,
                containers[overContainer as keyof typeof containers].length
              ),
            ],
          },
        });
      },
      setContainersDragCancel: () => {
        const shadowContainers = get().shadowContainers;
        set({ containers: shadowContainers });
      },
    })),
    {
      name: "ztriviary2",
      partialize: (state) => {
        const { lives, bestStreak, ...rest } = state;
        void rest;

        return { lives, bestStreak };
      },
    }
  )
);

wsConnect();

export default zTriviary2;
