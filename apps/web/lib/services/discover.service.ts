import { apiClient } from '@/lib/api-client';

export async function discoverScan(count: number) {
  const { data, error } = await apiClient.POST('/api/discover/scan', {
    body: { count },
  });

  if (error || !data) {
    throw new Error('Failed to scan for games');
  }

  return data;
}

export async function discoverApply(
  scanEventId: number,
  selectedIgdbIds: number[],
) {
  const { data, error } = await apiClient.POST('/api/discover/apply', {
    body: { scanEventId, selectedIgdbIds },
  });

  if (error || !data) {
    throw new Error('Failed to apply discovered games');
  }

  return data;
}
