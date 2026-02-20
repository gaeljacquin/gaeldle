import {
  IconPhoto,
  IconCalendar,
  IconCalendarDue,
  IconNotes,
  IconWallpaper,
  IconRobot,
  type TablerIcon,
} from "@tabler/icons-react";
import type { GameModeSlug } from "@gaeldle/api-contract";

export interface GameMode {
  id: GameModeSlug;
  title: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
  icon: TablerIcon;
  gradient: string;
  href: string;
}

export const gameModes: GameMode[] = [
  {
    id: "cover-art",
    title: "Cover Art",
    description: "Identify the game from their cover art.",
    difficulty: "Easy",
    icon: IconPhoto,
    gradient: "--gradient-easy",
    href: "/cover-art",
  },
  {
    id: "artwork",
    title: "Artwork",
    description: "Guess the game from their artwork.",
    difficulty: "Medium",
    icon: IconWallpaper,
    gradient: "--gradient-medium-1",
    href: "/artwork",
  },
  {
    id: "image-gen",
    title: "Image Gen",
    description: "Identify the game from an AI-generated image.",
    difficulty: "Medium",
    icon: IconRobot,
    gradient: "--gradient-medium-2",
    href: "/image-gen",
  },
  {
    id: "timeline",
    title: "Timeline",
    description: "Arrange games in chronological order.",
    difficulty: "Medium",
    icon: IconCalendar,
    gradient: "--gradient-medium-3",
    href: "/timeline",
  },
  {
    id: "timeline-2",
    title: "Timeline 2",
    description: "Place each game in chronological order.",
    difficulty: "Hard",
    icon: IconCalendarDue,
    gradient: "--gradient-hard-1",
    href: "/timeline-2",
  },
  {
    id: "specifications",
    title: "Specifications",
    description: "Deduce the game from their specifications.",
    difficulty: "Hard",
    icon: IconNotes,
    gradient: "--gradient-hard-2",
    href: "/specifications",
  },
];

/**
 * Get game mode by slug (pathname without leading slash)
 * @param slug - The game mode slug (e.g., "cover-art", "image-gen")
 * @returns GameMode or undefined if not found
 */
export function getGameModeBySlug(slug: string): GameMode | undefined {
  return gameModes.find((mode) => mode.id === slug);
}
