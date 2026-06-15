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

let artStylesData: Array<{
  id: number;
  value: string;
  label: string;
  description: string;
  isDefault: number;
  isActive: number;
}> = [];

try {
  artStylesData = await getArtStyles();
} catch (e) {
  const errorMessage = e instanceof Error ? e.message : String(e);
  console.warn(
    `[ArtStyleService] Failed to fetch art styles at module evaluation, using fallback static data: ${errorMessage}`,
  );
  artStylesData = [
    {
      id: 1,
      value: 'funko-pop-chibi',
      label: 'Funko Pop Chibi Style',
      description: '',
      isDefault: 1,
      isActive: 1,
    },
    {
      id: 2,
      value: 'simpsons',
      label: 'Simpsons Style',
      description: '',
      isDefault: 0,
      isActive: 1,
    },
    {
      id: 3,
      value: 'rubber-hose-animation',
      label: 'Rubber Hose Animation Style',
      description: '',
      isDefault: 0,
      isActive: 1,
    },
    {
      id: 4,
      value: 'muppet',
      label: 'Muppet Style',
      description: '',
      isDefault: 0,
      isActive: 1,
    },
    {
      id: 5,
      value: 'lego',
      label: 'Lego Style',
      description: '',
      isDefault: 0,
      isActive: 1,
    },
    {
      id: 6,
      value: 'vector-art',
      label: 'Vector Art Style',
      description: '',
      isDefault: 0,
      isActive: 1,
    },
    {
      id: 7,
      value: 'digital-cel-shaded',
      label: 'Digital Cel-shaded Portrait Illustration Style',
      description: '',
      isDefault: 0,
      isActive: 1,
    },
    {
      id: 8,
      value: 'western-animation-concept-art',
      label: 'Western Animation Concept Art Style',
      description: '',
      isDefault: 0,
      isActive: 1,
    },
    {
      id: 9,
      value: 'graphic-novel-illustration',
      label: 'Graphic Novel Illustration Style',
      description: '',
      isDefault: 0,
      isActive: 1,
    },
    {
      id: 10,
      value: 'claymation',
      label: 'Claymation Style',
      description: '',
      isDefault: 0,
      isActive: 1,
    },
  ];
}

export const artStyleValues = artStylesData.map((artStyle) => artStyle.value);

export const artStyleValuesEnum = z.enum(
  artStyleValues as [string, ...string[]],
);

export const artStyleDefault = artStylesData.find(
  (artStyle) => artStyle.isDefault === 1,
)!;

export const artStyleDefaultValue = artStyleDefault.value;

export type ArtStyleValuesEnumType = z.infer<typeof artStyleValuesEnum>;

export const artStylesQueryOptions = {
  queryKey: ['artStyles'],
  queryFn: getArtStyles,
};
