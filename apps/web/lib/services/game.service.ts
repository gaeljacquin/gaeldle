import { orpcClient } from '@/lib/orpc';
import type { Game, GameModeSlug } from '@gaeldle/api-contract';

export async function getAllGames(mode?: GameModeSlug): Promise<Game[]> {
  if (mode === 'artwork') {
    const result = await orpcClient.games.getArtwork();
    return result.data;
  }

  const result = await orpcClient.games.list({});
  return result.data;
}

export async function getGameByIgdbId(igdbId: number): Promise<Game> {
  const result = await orpcClient.games.get({ igdbId });
  return result.data;
}

export async function deleteGame(id: number): Promise<boolean> {
  const result = await orpcClient.games.delete({ id });
  return result.success;
}

export async function deleteBulkGames(ids: number[]): Promise<boolean> {
  const result = await orpcClient.games.deleteBulk(ids);
  return result.success;
}

export async function getPaginatedGames(
  page: number = 1,
  pageSize: number = 10,
  query?: string
) {
  const result = await orpcClient.games.list({
    page,
    pageSize,
    q: query,
  });
  return result;
}

export async function getRandomGame(excludeIds: number[] = [], mode?: GameModeSlug): Promise<Game> {
  const result = await orpcClient.games.getRandom({
    excludeIds,
    mode: mode,
  });
  return result.data;
}

export async function searchGames(query: string, limit: number = 100, mode?: GameModeSlug): Promise<Game[]> {
  if (query.length < 2) {
    return [];
  }

  const result = await orpcClient.games.search({
    q: query,
    limit,
    mode: mode,
  });

  return result.data;
}

export async function syncGame(igdbId: number) {
  const result = await orpcClient.games.sync({ igdb_id: igdbId });
  return result;
}

export async function testUpload(image: string, extension: string = 'jpg') {
  const result = await orpcClient.games.testUpload({
    image,
    extension,
  });
  return result;
}

export async function generateImage(igdbId: number, prompt: string) {
  const result = await orpcClient.games.generateImage({ igdbId, prompt });
  return result;
}

export async function generatePrompt(params: {
  igdbId: number;
  model: string;
  style: string;
  includeSummary: boolean;
  includeStoryline: boolean;
}) {
  const result = await orpcClient.games.generatePrompt(params);
  return result;
}

export async function clearPrompt(igdbId: number) {
  const result = await orpcClient.games.clearPrompt({ igdbId });
  return result;
}
