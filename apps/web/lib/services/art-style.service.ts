import { z } from 'zod';
import { artStyleSelectSchema } from '@workspace/api-contract';
import type { ArtStyle } from '@workspace/api-contract';

export const getArtStyles = async (): Promise<ArtStyle[]> => {
  try {
    const res = await fetch('/api/private/art-styles');

    if (!res.ok) {
      throw new Error('Failed to fetch art styles');
    }

    const artStyles = z.array(artStyleSelectSchema).parse(await res.json());

    return artStyles;
  } catch (e) {
    console.error('Failed to fetch art styles:', (e as Error).message);
    throw e;
  }
};

export const artStylesQueryOptions = {
  queryKey: ['artStyles'],
  queryFn: getArtStyles,
};
