import { zodResolver } from "@hookform/resolvers/zod";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import io, { Socket } from "socket.io-client";
import { z } from "zod";

const victoryText = "Victory! 😀";
const gameOverText = "Game over 😭";
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

export {
  victoryText,
  gameOverText,
  imgWidth,
  imgHeight,
  imgAlt,
  FormSchema,
  GamesFormInit,
  SocketInit,
  bgIncorrect,
  bgPartial,
  bgCorrect,
};
