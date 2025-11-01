import { config } from 'src/config/env';
import sharp from 'sharp';
import { supabase } from 'src/services/supabase.service';
import { currentEnv } from 'src/config/load-env';

// Constants
const IMAGE_SIZE = 512;
const WEBP_QUALITY = 80;
const POLLINATIONS_BASE_URL = 'https://image.pollinations.ai/prompt';
const FILE_EXTENSION = '.webp';
const CONTENT_TYPE = 'image/webp';

export async function generateImageFromPrompt(gameId: number, prompt: string): Promise<string> {
  if (!gameId || gameId <= 0) {
    throw new Error('Valid game ID is required');
  }
  if (!prompt?.trim()) {
    throw new Error('Image prompt is required');
  }

  try {
    const pollinationsUrl = buildPollinationsUrl(prompt);
    const imageBuffer = await fetchImageFromPollinations(pollinationsUrl);
    const webpBuffer = await convertToWebP(imageBuffer);
    const filename = `${gameId}${FILE_EXTENSION}`;

    await uploadToSupabase(filename, webpBuffer);

    return filename;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    throw new Error(`Failed to generate and upload image: ${errorMessage}`);
  }
}

function buildPollinationsUrl(prompt: string): string {
  const params = new URLSearchParams({
    width: IMAGE_SIZE.toString(),
    height: IMAGE_SIZE.toString(),
  });

  return `${POLLINATIONS_BASE_URL}/${encodeURIComponent(prompt)}?${params.toString()}`;
}

/**
 * Fetch image from Pollinations API
 */
async function fetchImageFromPollinations(url: string): Promise<Buffer> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Pollinations API returned status ${response.status}: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();

  if (arrayBuffer.byteLength === 0) {
    throw new Error('Received empty image from Pollinations API');
  }

  return Buffer.from(arrayBuffer);
}

async function convertToWebP(imageBuffer: Buffer): Promise<Buffer> {
  try {
    return await sharp(imageBuffer)
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to convert image to WebP: ${errorMessage}`);
  }
}

async function uploadToSupabase(path: string, buffer: Buffer): Promise<void> {
  console.log('[AI-IMAGE-GEN] Uploading to Supabase bucket:', config.supabaseBucket);

  const { error } = await supabase.storage
    .from(config.supabaseBucket)
    .upload(path, buffer, {
      contentType: CONTENT_TYPE,
      upsert: true, // Allow overwriting existing images
    });

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`);
  }
}
