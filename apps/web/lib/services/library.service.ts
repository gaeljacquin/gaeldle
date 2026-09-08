import type { Game } from '@workspace/db';
import { fetchWithTimeout } from '@/lib/fetch-with-timeout';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server error: ${response.status}`);
  }

  return response.json();
}

export async function getEpicLibraryGames(): Promise<Game[]> {
  const url = '/api/private/libraries/epic';
  const response = await fetchWithTimeout(url);
  const result = await handleResponse<{ success: boolean; data: Game[] }>(
    response,
  );

  return result.data ?? [];
}
