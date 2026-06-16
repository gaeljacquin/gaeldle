import { artStyleSelectSchema } from '@workspace/api-contract';
import { z } from 'zod';

export const getArtStyles = async () => {
  try {
    const res = await fetch('/api/private/art-styles');

    if (!res.ok) {
      throw new Error('Failed to fetch art styles');
    }

    const artStyles = z.array(artStyleSelectSchema).parse(await res.json());

    return artStyles;
  } catch (e) {
    console.error(
      'Failed to fetch art styles at module evaluation, using fallback static data:',
      (e as Error).message,
    );

    return [];
  }
};

export const artStyleValues = (await getArtStyles()).map(
  (artStyle) => artStyle.value,
);

export const artStyleValuesEnum = z.enum(
  artStyleValues as [string, ...string[]],
);

export const artStyleDefault = (await getArtStyles()).find(
  (artStyle) => artStyle.isDefault === 1,
)!;

export const artStyleDefaultValue = artStyleDefault.value;

export type ArtStyleValuesEnumType = z.infer<typeof artStyleValuesEnum>;

export const artStylesQueryOptions = {
  queryKey: ['artStyles'],
  queryFn: getArtStyles,
};
