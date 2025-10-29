import {
  Image,
  Calendar,
  CalendarRange,
  Scroll,
  Wallpaper,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface GameMode {
  id: string;
  title: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
  icon: LucideIcon;
  gradient: string;
  pattern: "diagonal" | "diagonal-reverse";
  href: string;
}

export const gameModes: GameMode[] = [
  {
    id: "cover-art",
    title: "Cover Art",
    description: "Identify the game from their cover art.",
    difficulty: "Easy",
    icon: Image,
    gradient: "bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-900",
    pattern: "diagonal",
    href: "/cover-art",
  },
  {
    id: "artwork",
    title: "Artwork",
    description: "Guess the game from their artwork.",
    difficulty: "Medium",
    icon: Wallpaper,
    gradient: "bg-gradient-to-br from-purple-600 via-purple-700 to-violet-900",
    pattern: "diagonal-reverse",
    href: "/artwork",
  },
  // {
  //   id: "cover-art-2",
  //   title: "Cover Art 2",
  //   description: "Guess the game from an AI-generated cover art.",
  //   difficulty: "Medium",
  //   icon: Wallpaper,
  //   gradient: "bg-gradient-to-br from-purple-600 via-purple-700 to-violet-900",
  //   pattern: "diagonal-reverse",
  //   href: "/cover-art-2",
  // },
  {
    id: "timeline",
    title: "Timeline",
    description: "Arrange games in chronological order.",
    difficulty: "Medium",
    icon: Calendar,
    gradient: "bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700",
    pattern: "diagonal",
    href: "/timeline",
  },
  {
    id: "timeline-2",
    title: "Timeline 2",
    description: "Place each game in chronological order.",
    difficulty: "Hard",
    icon: CalendarRange,
    gradient: "bg-gradient-to-br from-pink-600 via-pink-700 to-fuchsia-900",
    pattern: "diagonal",
    href: "/timeline-2",
  },
  {
    id: "specifications",
    title: "Specifications",
    description: "Deduce the game from their specifications.",
    difficulty: "Hard",
    icon: Scroll,
    gradient: "bg-gradient-to-br from-red-600 via-red-700 to-rose-900",
    pattern: "diagonal-reverse",
    href: "/specifications",
  },
];

/**
 * Get game mode by slug (pathname without leading slash)
 * @param slug - The game mode slug (e.g., "cover-art", "cover-art-2")
 * @returns GameMode or undefined if not found
 */
export function getGameModeBySlug(slug: string): GameMode | undefined {
  return gameModes.find((mode) => mode.id === slug);
}
