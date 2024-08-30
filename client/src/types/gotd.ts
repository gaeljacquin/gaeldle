import { Game } from "./game";

export type Gotd = {
  [key: string]: Game & {
    steamId?: number;
    imageUrl: string;
    info: unknown[];
  };
};
