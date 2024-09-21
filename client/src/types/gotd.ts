import { Mode } from "./modes";

export type Gotd = {
  modes: Mode;
  id: number;
  modeId: number;
  imageUrl: string;
  keyword?: string;
  numKeywords?: number;
  artworkUrl?: string;
};
