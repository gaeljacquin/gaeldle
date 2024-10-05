import { Game, Games } from "@/types/games";

export type ZTriviary2 = {
  lives: number;
  livesLeft: number;
  nextGame: Partial<Game> | null;
  played: boolean;
  streak: number;
  maxStreak: number;
  timeline: Partial<Game>[];
  won: boolean;
  containers: ContainerType;
  shadowContainers: ContainerType;
  getLivesLeft: () => number;
  getMaxStreak: () => number;
  getPlayed: () => boolean;
  getStreak: () => number;
  getTimeline: () => Partial<Game>[];
  getNextGame: () => Partial<Game> | null;
  markAsPlayed: () => void;
  markAsWon: () => void;
  resetPlay: () => void;
  setMaxStreak: () => void;
  setStreak: (arg0: boolean) => void;
  updateLivesLeft: () => void;
  getContainers: () => { [key: string]: number[] };
  setContainersDragEnd: (args: setContainersDragEndProps) => void;
  setContainersDragOver: (args: setContainersDragOverProps) => void;
  setContainersDragCancel: (args?: unknown) => void;
};

export type setContainersDragEndProps = {
  overContainer: string | number;
  activeIndex: number;
  overIndex: number;
  arrayMove: (array: unknown[], fromIndex: number, toIndex: number) => void;
};

export type setContainersDragOverProps = {
  containers: ContainerType;
  activeContainer: string | number;
  overContainer: string | number;
  activeId: number;
  overId: number;
  draggingRect: any;
  overRect: any;
  over: any;
};

export type setContainersDragCancelProps = {
  activeContainer: string | number;
  overContainer: string | number;
  activeId: number;
  overId: number;
  draggingRect: any;
  over: any;
};

export type ContainerType = {
  nextGame: number[];
  timeline: number[];
};
