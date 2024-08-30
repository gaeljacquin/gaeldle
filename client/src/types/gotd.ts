import { Game } from "./game";
import { Mode } from "./mode";

export type Gotd = {
  [key: string]: Game &
    Mode & {
      steamId?: number;
      imageUrl: string;
      info: unknown[];
    };
};
