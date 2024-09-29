import { zodResolver } from "@hookform/resolvers/zod";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import io, { Socket } from "socket.io-client";
import { z } from "zod";

const textVictory = "You got it! 😀";
const textGameOver = "Game over 😭";
const textFlawlessVictory = "Flawless victory! 😎";
const imgWidth = 600;
const imgHeight = 600;
const imgAlt = (alt: string) => {
  return `Game of the Day - ${alt}`;
};

const GamesFormInit = () => {
  return useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });
};

const FormSchema = z.object({
  game: z.object({
    igdbId: z.number({
      required_error: "Please select a game",
    }),
    name: z.string({
      required_error: "Please select a game",
    }),
  }),
});

const SocketInit = () => {
  const socketRef = useRef<Socket | null>(null);

  if (!socketRef.current) {
    socketRef.current = io(`${process.env.serverUrl}`);
  }

  const socket = socketRef.current!;

  return socket;
};

const bgIncorrect = "bg-gael-red";
const bgPartial = "bg-yellow-600";
const bgCorrect = "bg-gael-green";
const bgOther1 = "bg-gael-blue";
const bgOther2 = "bg-indigo-500";

const cardImgSize = 128;
const cardImgClasses = "w-full h-48 object-cover";

const textSubmit = "Submit";
const textAlreadyGuessed = "Already guessed";
const textTryAgain = "Try again";
const textStartingPosition = "Starting position";

const currentDate = new Date();
const currentYear = currentDate.getFullYear();
const startDate = new Date("2017-02-01T00:00:00Z"); // Using UTC to avoid timezone issues
// Calculate the difference in milliseconds
const differenceInMs = currentDate.getTime() - startDate.getTime();
// Convert the difference from milliseconds to years
const differenceInYears = differenceInMs / (1000 * 60 * 60 * 24 * 365.25);
const yoe = Math.floor(differenceInYears);

// Badge groups
const levels = [
  { text: "Easy", backgroundClass: bgCorrect },
  { text: "Moderate", backgroundClass: bgPartial },
  { text: "Hard", backgroundClass: bgIncorrect },
];
const triviaryLegend = [
  { text: "Incorrect", backgroundClass: bgIncorrect },
  { text: "Found then moved", backgroundClass: bgPartial },
  { text: "Correct", backgroundClass: bgCorrect },
];

const absoluteUrl = (path: string) => {
  return `${process.env.NEXT_PUBLIC_CLIENT_URL}${path}`;
};

export {
  textVictory,
  textGameOver,
  textFlawlessVictory,
  imgWidth,
  imgHeight,
  imgAlt,
  FormSchema,
  GamesFormInit,
  SocketInit,
  bgIncorrect,
  bgPartial,
  bgCorrect,
  bgOther1,
  bgOther2,
  currentYear,
  yoe,
  cardImgSize,
  cardImgClasses,
  textSubmit,
  textAlreadyGuessed,
  textTryAgain,
  textStartingPosition,
  levels,
  triviaryLegend,
  absoluteUrl,
};
