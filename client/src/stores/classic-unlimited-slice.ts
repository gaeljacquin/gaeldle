// import { Game, Guess, Guesses } from "@/types/games";

// export interface ClassicUnlimitedSlice {
//   name: string;
//   igdbId: number;
//   imageUrl: string;
//   lives: number;
//   livesLeft: number;
//   guesses: Guesses;
//   played: boolean;
//   won: boolean;
//   date: Date;
//   updateLivesLeft: () => void;
//   updateGuesses: (arg0: Guess | null) => void;
//   getLivesLeft: () => number;
//   getGuesses: () => Guesses;
//   markAsPlayed: () => void;
//   markAsWon: () => void;
//   pixelation: number;
//   pixelationStep: number;
//   setPixelation: () => void;
//   removePixelation: () => void;
//   getName: () => string;
//   setName: (arg0: string) => void;
//   getIgdbId: () => number;
//   setIgdbId: (arg0: number) => void;
//   getImageUrl: () => string;
//   setImageUrl: (arg0: string) => void;
//   setLives: (arg0: number) => void;
// }

// export const defaultClassicUnlimited = {
//   name: "",
//   igdbId: 0,
//   imageUrl: "",
//   lives: 0,
//   livesLeft: 0,
//   guesses: [],
//   played: false,
//   won: false,
//   date: new Date(),
//   pixelation: 0,
//   pixelationStep: 0,
// };

// const createClassicUnlimitedSlice = (
//   set: (arg0: ClassicUnlimitedSlice | unknown) => void,
//   get: () => ClassicUnlimitedSlice
// ) => ({
//   ...defaultClassicUnlimited,
//   updateLivesLeft: () => {
//     const { livesLeft } = get();

//     set({ livesLeft: livesLeft - 1 });
//   },
//   updateGuesses: (guess: Guess | null) => {
//     const { guesses } = get();

//     set({ guesses: [...guesses, guess] });
//   },
//   getLivesLeft: () => {
//     const { livesLeft } = get();

//     return livesLeft;
//   },
//   getGuesses: () => {
//     const { guesses } = get();

//     return guesses;
//   },
//   markAsPlayed: () => {
//     set({ played: true });
//   },
//   markAsWon: () => {
//     set({ won: true });
//   },
//   setPixelation: () => {
//     const { pixelation, pixelationStep } = get();

//     set({ pixelation: pixelation - pixelationStep });
//   },
//   removePixelation: () => {
//     set({ pixelation: 0 });
//   },
//   setLives: (lives: number) => {
//     set({ lives });
//   },
//   getName: () => {
//     const { name } = get();

//     return name;
//   },
//   setName: (name: string) => {
//     set({ name });
//   },
//   getIgdbId: () => {
//     const { igdbId } = get();

//     return igdbId;
//   },
//   setIgdbId: (igdbId: number) => {
//     set({ igdbId });
//   },
//   getImageUrl: () => {
//     const { imageUrl } = get();

//     return imageUrl;
//   },
//   setImageUrl: (imageUrl: string) => {
//     set({ imageUrl });
//   },
// });

// export default createClassicUnlimitedSlice;
