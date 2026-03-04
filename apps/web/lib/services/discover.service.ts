import { orpcClient } from '@/lib/orpc';

export async function discoverScan(count: number) {
  return orpcClient.discover.scan({ count });
}

export async function discoverApply(
  scanEventId: number,
  selectedIgdbIds: number[],
) {
  return orpcClient.discover.apply({ scanEventId, selectedIgdbIds });
}
