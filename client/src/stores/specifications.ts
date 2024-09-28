import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { io } from "socket.io-client";
import { Guess, GuessWithSpecs, Spec, Specs } from "@/types/games";
import { Gotd } from "@/types/gotd";
import { ZSpecs } from "~/src/types/zspecs";
import { DailyStats } from "@/types/daily-stats";
import { absoluteUrl } from "@/lib/client-constants";

const modeId = 4;

export const initialState = {
  gotdId: 0,
  imageUrl: "/placeholder.jpg",
  name: "",
  lives: 0,
  livesLeft: 0,
  guesses: [],
  played: false,
  won: false,
  summary: {
    franchises: null as unknown as Spec,
    game_engines: null as unknown as Spec,
    game_modes: null as unknown as Spec,
    genres: null as unknown as Spec,
    platforms: null as unknown as Spec,
    player_perspectives: null as unknown as Spec,
    release_dates: null as unknown as Spec,
    themes: null as unknown as Spec,
  },
};

export const socket = io(`${process.env.serverUrl}`);

const wsConnect = () => {
  if (!zSpecs.getState().played) {
    socket.on("connect", () => {
      console.info("Connected to WebSocket server");
    });

    socket.on(
      `daily-res-${modeId}`,
      (data: {
        clientId: string;
        answer: boolean;
        name: string;
        imageUrl: string;
        guess: Guess;
        specs: Specs;
        specsFinal?: Specs;
      }) => {
        checkAnswer(data.answer, data.guess, data.specs);
        zSpecs.getState().setName(data.name);
        zSpecs.getState().setImageUrl(data.imageUrl);
        zSpecs.getState().setSummary(data.specs);
        data.specsFinal && zSpecs.getState().setSummary(data.specsFinal);
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

const checkAnswer = (answer: boolean, guess: Guess, specs: Specs) => {
  const getState = () => {
    return zSpecs.getState();
  };

  let dsGuesses;

  if (answer) {
    dsGuesses = getState().guesses.map(({ igdbId, name }) => ({
      igdbId,
      name,
    }));
    getState().markAsWon();
    getState().markAsPlayed();
    saveDailyStats({
      gotdId: getState().gotdId,
      modeId,
      attempts: Math.min(getState().guesses.length + 1, getState().lives),
      guesses: dsGuesses,
      found: true,
    });
  } else {
    const { igdbId, name } = guess;
    getState().updateGuesses({
      igdbId,
      name,
      ...specs,
    });
    getState().updateLivesLeft();

    if (getState().livesLeft === 0) {
      dsGuesses = getState().guesses.map(({ igdbId, name }) => ({
        igdbId,
        name,
      }));
      getState().markAsPlayed();
      saveDailyStats({
        gotdId: getState().gotdId,
        modeId: modeId,
        attempts: getState().guesses.length,
        guesses: dsGuesses,
        found: false,
      });
    }
  }
};

const saveDailyStats = (data: DailyStats) => {
  socket.emit("daily-stats", data);
};

const zSpecs = create(
  persist(
    devtools<ZSpecs>((set, get) => ({
      ...initialState,
      updateLivesLeft: () => {
        const livesLeft = get().livesLeft;
        set({ livesLeft: livesLeft - 1 });
      },
      updateGuesses: (guess: GuessWithSpecs | null) => {
        const guesses = (get() as { guesses: GuessWithSpecs[] }).guesses;
        if (guess) {
          set({ guesses: [guess, ...guesses] });
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
      setGotd: (gotd: Gotd) => {
        const { imageUrl, modes, id } = gotd;
        const { lives } = modes;
        set({
          gotdId: id,
          imageUrl,
          lives,
          livesLeft: lives,
        });
      },
      setImageUrl: (imageUrl: string) => {
        set({ imageUrl });
      },
      setName: (name: string) => {
        set({ name });
      },
      getName: () => get().name,
      setSummary: (summary: Partial<GuessWithSpecs>) => {
        set({ summary });
      },
      getSummary: () => get().summary,
      fetchGotd: async () => {
        try {
          const endpoint = absoluteUrl("/api/specifications");
          const res = await fetch(endpoint);
          const { gotd } = await res.json();
          const currentGotdId = get().gotdId;

          if (!currentGotdId || currentGotdId !== gotd.id) {
            get().resetPlay();
            get().setGotd(gotd);
          }
        } catch (error) {
          console.error("Failed to set gotd (specifications):", error);
        }
      },
      resetPlay: () => {
        set({ ...initialState });
      },
    })),
    { name: "zspecs" }
  )
);

zSpecs.getState().fetchGotd();
wsConnect();

export default zSpecs;
