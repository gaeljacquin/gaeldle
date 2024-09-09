import { Mode } from "./modes";

export type Gotd = {
  [key: string]: Mode & {
    id: number;
    modeId: number;
    imageUrl: string;
  };
};
