import { allGames, allGamesWithArtwork, allGamesWithFirstReleaseDate } from "src/db/schema";

export function getMaterializedView(mode: string) {
  let materializedView;

  switch (mode) {
    case 'timeline':
    case 'timeline-2':
    case 'specifications':
      materializedView = allGamesWithFirstReleaseDate;
      break;
    case 'artwork':
      materializedView = allGamesWithArtwork;
      break;
    default:
      materializedView = allGames;
      break;
  }

  return materializedView;
}
