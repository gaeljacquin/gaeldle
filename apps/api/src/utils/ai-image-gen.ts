import { config } from 'src/config/env';
import sharp from 'sharp';
import { supabase } from 'src/services/supabase.service';
import { currentEnv } from 'src/config/load-env';

export async function generateImageFromPrompt(gameId: number, prompt: string) {
    console.log('[AI-IMAGE-GEN] Starting generateImageFromPrompt');
    console.log('[AI-IMAGE-GEN] Game ID:', gameId);
    console.log('[AI-IMAGE-GEN] Prompt:', prompt);

    try {
      const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512`;
      console.log('[AI-IMAGE-GEN] Pollinations URL:', pollinationsUrl);

      console.log('[AI-IMAGE-GEN] Fetching image from Pollinations...');
      const imageResponse = await fetch(pollinationsUrl);
      console.log('[AI-IMAGE-GEN] Response status:', imageResponse.status);

      if (!imageResponse.ok) {
        throw new Error(`Pollinations API returned status ${imageResponse.status}`);
      }

      const arrayBuffer = await imageResponse.arrayBuffer();
      console.log('[AI-IMAGE-GEN] Downloaded image size:', arrayBuffer.byteLength, 'bytes');

      // Convert to WebP using sharp
      console.log('[AI-IMAGE-GEN] Converting to WebP...');
      const webpBuffer = await sharp(Buffer.from(arrayBuffer))
        .webp({ quality: 80 })
        .toBuffer();
      console.log('[AI-IMAGE-GEN] WebP size:', webpBuffer.byteLength, 'bytes');

      const filename = `${gameId}.webp`;
      const path = currentEnv === 'development' ? `dev/${filename}` : filename;
      console.log('[AI-IMAGE-GEN] Filename:', filename);
      console.log('[AI-IMAGE-GEN] Upload path:', path);
      console.log('[AI-IMAGE-GEN] currentEnv:', currentEnv);

      // Upload to Supabase
      console.log('[AI-IMAGE-GEN] Uploading to Supabase bucket:', config.supabaseBucket);
      const { error } = await supabase.storage
        .from(config.supabaseBucket)
        .upload(path, webpBuffer, {
          contentType: 'image/webp',
          upsert: true, // Allow overwriting existing images
        });

      if (error) {
        console.error('[AI-IMAGE-GEN] Supabase upload error:', error);
        throw new Error(error.message);
      }

      console.log('[AI-IMAGE-GEN] Upload successful!');
      console.log('[AI-IMAGE-GEN] Returning filename:', filename);

      // Return just the filename with extension (not the full URL)
      return filename;
    } catch (error) {
      console.error('[AI-IMAGE-GEN] Error in generateImageFromPrompt:', error);
      console.error('[AI-IMAGE-GEN] Error details:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
;
