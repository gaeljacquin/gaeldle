import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { io } from "socket.io-client";
import { Guess } from "@/types/games";
import { Gotd } from "@/types/gotd";
import getIt from "~/src/lib/get-it";
import { ZKeywords } from "~/src/types/zkeywords";
import { DailyStats } from "~/src/types/daily-stats";

const modeId = 3;

export const initialState = {
  gotdId: 0,
  imageUrl: "/placeholder.jpg",
  keywords: [],
  name: "",
  lives: 0,
  livesLeft: 0,
  guesses: [],
  played: false,
  won: false,
  numKeywords: 0,
};

export const socket = io(`${process.env.serverUrl}`);

const wsConnect = () => {
  if (!zKeywords.getState().played) {
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
        [key: string]: unknown;
      }) => {
        checkAnswer(data.answer, data.guess, data.keyword as string);
        zKeywords.setState({ name: data.name });
        zKeywords.setState({ imageUrl: data.imageUrl as string });
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

const checkAnswer = (answer: boolean, guess: Guess, keyword: string) => {
  const getState = () => {
    return zKeywords.getState();
  };

  if (answer) {
    getState().markAsWon();
    getState().markAsPlayed();
    saveDailyStats({
      gotdId: getState().gotdId,
      modeId,
      attempts: Math.min(getState().guesses.length + 1, getState().lives),
      guesses: getState().guesses,
      found: true,
    });
  } else {
    getState().updateGuesses(guess);
    getState().updateLivesLeft();

    if (getState().livesLeft === 0) {
      getState().markAsPlayed();
      saveDailyStats({
        gotdId: getState().gotdId,
        modeId,
        attempts: getState().guesses.length,
        guesses: getState().guesses,
        found: false,
      });
    } else {
      getState().updateKeywords(keyword);
    }
  }
};

const saveDailyStats = (data: DailyStats) => {
  socket.emit("daily-stats", data);
};

const zKeywords = create(
  persist(
    devtools<ZKeywords>((set, get) => ({
      ...initialState,
      updateLivesLeft: () => {
        const livesLeft = get().livesLeft;
        set({ livesLeft: livesLeft - 1 });
      },
      updateGuesses: (guess: Guess | null) => {
        const guesses = get().guesses;
        set({ guesses: [...guesses, guess] });
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
      updateKeywords: (keyword: string | null) => {
        if (keyword) {
          const newKeywords = keyword.split(",");
          const keywords = get().keywords;
          set({
            keywords: [...keywords, ...newKeywords],
          });
        }
      },
      setGotd: (gotd: Gotd) => {
        const { keyword, modes, id, numKeywords } = gotd;
        const { lives } = modes;
        set({
          gotdId: id,
          keywords: [keyword ?? ""],
          lives,
          livesLeft: lives,
          numKeywords,
        });
      },
      setImageUrl: (imageUrl: string) => {
        set({ imageUrl });
      },
      setName: (name: string) => {
        set({ name });
      },
      getName: () => get().name,
      fetchGotd: async () => {
        try {
          const res = await getIt("keywords");
          const { gotd } = await res.json();
          const currentGotdId = get().gotdId;

          if (!currentGotdId || currentGotdId !== gotd.id) {
            get().resetPlay();
            get().setGotd(gotd);
          }
        } catch (error) {
          console.error("Failed to set gotd (keywords):", error);
        }
      },
      resetPlay: () => {
        set({ ...initialState });
      },
    })),
    { name: "zkeywords" }
  )
);

zKeywords.getState().fetchGotd();
wsConnect();

export default zKeywords;
