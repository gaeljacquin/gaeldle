import { db } from '@/lib/db';
import { artStyles as artStylesView } from '@workspace/api-contract';
import { z } from 'zod';

export const artStyles = await db.select().from(artStylesView);

export const artStyleValues = artStyles.map((artStyle) => artStyle.value);

export const artStyleValuesEnum = z.enum(artStyleValues);

export const artStyleDefault = artStyles.find(
  (artStyle) => artStyle.isDefault === 1,
)!;

export const artStyleDefaultValue = artStyleDefault.value;

export type artStyleValuesEnumType = z.infer<typeof artStyleValuesEnum>;
