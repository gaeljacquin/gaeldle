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
  // Input validation
  if (!gameId || gameId <= 0) {
    throw new Error('Valid game ID is required');
  }
  if (!prompt?.trim()) {
    throw new Error('Image prompt is required');
  }

  console.log('[AI-IMAGE-GEN] Starting generateImageFromPrompt');
  console.log('[AI-IMAGE-GEN] Game ID:', gameId);
  console.log('[AI-IMAGE-GEN] Prompt:', prompt);

  try {
    // Step 1: Generate Pollinations URL
    const pollinationsUrl = buildPollinationsUrl(prompt);
    console.log('[AI-IMAGE-GEN] Pollinations URL:', pollinationsUrl);

    // Step 2: Fetch image
    console.log('[AI-IMAGE-GEN] Fetching image from Pollinations...');
    const imageBuffer = await fetchImageFromPollinations(pollinationsUrl);
    console.log('[AI-IMAGE-GEN] Downloaded image size:', imageBuffer.byteLength, 'bytes');

    // Step 3: Convert to WebP
    console.log('[AI-IMAGE-GEN] Converting to WebP...');
    const webpBuffer = await convertToWebP(imageBuffer);
    console.log('[AI-IMAGE-GEN] WebP size:', webpBuffer.byteLength, 'bytes');

    // Step 4: Upload to Supabase
    const filename = `${gameId}${FILE_EXTENSION}`;
    const uploadPath = currentEnv === 'development' ? `dev/${filename}` : filename;

    console.log('[AI-IMAGE-GEN] Filename:', filename);
    console.log('[AI-IMAGE-GEN] Upload path:', uploadPath);
    console.log('[AI-IMAGE-GEN] Environment:', currentEnv);

    await uploadToSupabase(uploadPath, webpBuffer);

    console.log('[AI-IMAGE-GEN] Upload successful!');
    console.log('[AI-IMAGE-GEN] Returning filename:', filename);

    return filename;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[AI-IMAGE-GEN] Error in generateImageFromPrompt:', errorMessage);

    if (error instanceof Error) {
      console.error('[AI-IMAGE-GEN] Error stack:', error.stack);
    }

    throw new Error(`Failed to generate and upload image: ${errorMessage}`);
  }
}

/**
 * Build Pollinations API URL with encoded prompt
 */
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

/**
 * Convert image buffer to WebP format
 */
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

/**
 * Upload image buffer to Supabase storage
 */
async function uploadToSupabase(path: string, buffer: Buffer): Promise<void> {
  console.log('[AI-IMAGE-GEN] Uploading to Supabase bucket:', config.supabaseBucket);

  const { error } = await supabase.storage
    .from(config.supabaseBucket)
    .upload(path, buffer, {
      contentType: CONTENT_TYPE,
      upsert: true, // Allow overwriting existing images
    });

  if (error) {
    console.error('[AI-IMAGE-GEN] Supabase upload error:', error);
    throw new Error(`Supabase upload failed: ${error.message}`);
  }
}
