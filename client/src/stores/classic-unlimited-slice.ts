// import { Game, Games } from "@/types/games";
// import { Mode, Modes } from "@/types/modes";
// import { modesSlice } from "./modes-slice";

// export interface classicUnlimitedSlice {
//   name: string;
//   imageUrl: string;
//   igdbId: number;
//   lives: number;
//   livesLeft: number;
//   guesses: Games;
//   played: boolean;
//   won: boolean;
//   date: Date;
//   updateLivesLeft: () => void;
//   updateGuesses: (arg0: Game | null) => void;
//   getLivesLeft: () => number;
//   getGuesses: () => Games;
//   markAsPlayed: () => void;
//   markAsWon: () => void;
//   pixelation: number;
//   pixelationStep: number;
//   setPixelation: () => void;
//   removePixelation: () => void;
//   setRandomGame: () => void; // didn't rename it
//   getName: () => string;
//   setName: (arg0: string) => void;
//   getImageUrl: () => string;
//   setImageUrl: (arg0: string) => void;
//   getIgdbId: () => number;
//   setIgdbId: (arg0: number) => void;
// }

// export const defaultClassicUnlimited = {
//   igdbId: 0,
//   name: "",
//   imageUrl: "",
//   lives: 0,
//   livesLeft: 0,
//   guesses: [],
//   played: false,
//   won: false,
//   date: "",
//   pixelation: 0,
//   pixelationStep: 0,
// };

// const createClassicUnlimitedSlice = (
//   set: (arg0: unknown) => void,
//   get: () => unknown
// ) => ({
//   ...defaultClassicUnlimited,
//   updateLivesLeft: () =>
//     set((state: classicUnlimitedSlice) => ({
//       livesLeft: state.livesLeft - 1,
//     })),
//   updateGuesses: (guess: Game) =>
//     set((state: classicUnlimitedSlice) => ({
//       guesses: [...state.guesses, guess],
//     })),
//   getLivesLeft: () => (get() as { livesLeft: number }).livesLeft,
//   getGuesses: () => (get() as { guesses: Games }).guesses,
//   markAsPlayed: () => {
//     set({ played: true });
//   },
//   markAsWon: () => {
//     set({ won: true });
//   },
//   setPixelation: () =>
//     set((state: classicUnlimitedSlice) => ({
//       pixelation: state.pixelation - state.pixelationStep,
//     })),
//   removePixelation: () => {
//     set({ pixelation: 0 });
//   },
//   setRandomGame: () => {
//     set((state: classicUnlimitedSlice & modesSlice) => {
//       const { lives, pixelation, pixelationStep } =
//         state.modes.find((val: Mode) => val.id === 5) ?? {};

//       return {
//         lives,
//         livesLeft: lives,
//         pixelation,
//         pixelationStep,
//         played: false,
//         won: false,
//         guesses: [],
//       };
//     });
//   },
//   getName: () => (get() as { name: string }).name,
//   setName: (name: string) => {
//     set({ name });
//   },
//   getImageUrl: () => (get() as { imageUrl: string }).imageUrl,
//   setImageUrl: (imageUrl: string) => {
//     console.log(imageUrl);
//     set({ imageUrl });
//   },
//   getIgdbId: () => (get() as { igdbId: number }).igdbId,
//   setIgdbId: (igdbId: number) => {
//     set({ igdbId });
//   },
// });

// export default createClassicUnlimitedSlice;
