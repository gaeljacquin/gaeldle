import { Socket } from "socket.io-client";
import { CheckAnswerType } from "@/types/check-answer";

export default function gSocket<T extends unknown>(
  socket: Socket,
  modeChannel: string,
  statsChannel: string,
  checkAnswer: CheckAnswerType<T>,
  setFunctions: { [key: string]: (...args: string[]) => unknown }
) {
  const { setName, setImageUrl } = setFunctions;

  socket.on("connect", () => {
    console.info("Connected to WebSocket server");
  });

  socket.on(
    modeChannel,
    (data: {
      clientId: string;
      answer: boolean;
      name: string;
      [key: string]: unknown;
    }) => {
      checkAnswer(data.answer);
      setName(data.name);

      setImageUrl && setImageUrl(data.imageUrl as string);
    }
  );

  socket.on(statsChannel, (data: { message: string }) => {
    console.info(data.message);
  });

  return () => {
    socket.off("connect");
    socket.off(modeChannel);
    socket.off(statsChannel);
  };
}
