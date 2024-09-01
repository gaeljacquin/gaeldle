import { Game } from "./games";
import { Mode } from "./modes";

export type Gotd = {
  [key: string]: Game &
    Mode & {
      steamId?: number;
      imageUrl: string;
      info: unknown[];
    };
};
