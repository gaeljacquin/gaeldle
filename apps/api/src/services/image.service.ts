import { config } from 'src/config/env';
import { supabase } from 'src/services/supabase.service';

/**
 * Check if an AI image exists in Supabase storage and return appropriate URL
 * @param aiImageFilename - The image to check
 * @param fallbackUrl - The regular image URL to use as fallback
 */
export async function getAiImageUrl(filename: string | null) {
  if (!filename) return null;

  if (filename.startsWith("http")) {
    throw new Error("getAiImageUrl expects a filename, not a full URL");
  }

  const { publicUrl } = supabase.storage
    .from(config.supabaseBucket)
    .getPublicUrl(filename).data;

  return publicUrl ?? null;
}
