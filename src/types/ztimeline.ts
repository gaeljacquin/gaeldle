export type ZTimeline = {
  streak: number;
  bestStreak: number;
  dragSwitch: boolean;
  getStreak: () => number;
  getBestStreak: () => number;
  setBestStreak: () => void;
  setStreak: (arg0: boolean) => void;
  setDragSwitch: () => void;
};
