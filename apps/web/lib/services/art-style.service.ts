import { artStyleSelectSchema } from '@workspace/api-contract';
import { z } from 'zod';

export const getArtStyles = async () => {
  const res = await fetch('/api/art-styles');

  if (!res.ok) {
    throw new Error('Failed to fetch art styles');
  }

  const artStyles = z.array(artStyleSelectSchema).parse(await res.json());

  return artStyles;
};

export const artStyleValues = (await getArtStyles()).map(
  (artStyle) => artStyle.value,
);

export const artStyleValuesEnum = z.enum(artStyleValues);

export const artStyleDefault = (await getArtStyles()).find(
  (artStyle) => artStyle.isDefault === 1,
)!;

export const artStyleDefaultValue = artStyleDefault.value;

export type artStyleValuesEnumType = z.infer<typeof artStyleValuesEnum>;

export const artStylesQueryOptions = {
  queryKey: ['artStyles'],
  queryFn: getArtStyles,
};
