import { config } from 'dotenv';

config({ path: './apps/api/.env' });

import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '@gaeldle/api-contract';
import { sql, eq } from 'drizzle-orm';
import sharp from 'sharp';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { IMAGE_PROMPT_SUFFIX } from '@gaeldle/constants';

// Parse prompt options from environment variables
const includeStoryline = process.env.INCLUDE_STORYLINE === 'true';
const includeGenres = process.env.INCLUDE_GENRES === 'true';
const includeThemes = process.env.INCLUDE_THEMES === 'true';

const options = {
  includeStoryline,
  includeGenres,
  includeThemes,
};

console.log('Prompt options:', options);

// Initialize database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

// Initialize S3 client for R2
const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

// Helper: Build image prompt (same logic as games.router.ts)
function buildImagePrompt(
  game: {
    name: string;
    summary?: string | null;
    storyline?: string | null;
    keywords?: unknown;
    genres?: unknown;
    themes?: unknown;
  },
  opts: typeof options,
): string {
  const parts: string[] = [];

  parts.push(
    `Funko Pop chibi style illustration of iconic characters from "${game.name}" set within the game's distinct world`,
  );

  if (game.summary) {
    parts.push(game.summary);
  }

  if (opts.includeStoryline && game.storyline) {
    parts.push(game.storyline);
  }

  if (
    opts.includeGenres &&
    Array.isArray(game.genres) &&
    game.genres.length > 0
  ) {
    parts.push(`Genre: ${(game.genres as string[]).join(', ')}`);
  }

  if (
    opts.includeThemes &&
    Array.isArray(game.themes) &&
    game.themes.length > 0
  ) {
    parts.push(`Themes: ${(game.themes as string[]).join(', ')}`);
  }

  if (Array.isArray(game.keywords) && game.keywords.length > 0) {
    parts.push(`Keywords: ${(game.keywords as string[]).join(', ')}`);
  }

  parts.push(IMAGE_PROMPT_SUFFIX);

  return parts.join('. ');
}

// Helper: Generate image via Cloudflare AI
async function generateImage(prompt: string): Promise<Buffer> {
  const model = '@cf/stabilityai/stable-diffusion-xl-base-1.0';
  const url = `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/ai/run/${model}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.CF_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(
      `[AiService] Cloudflare AI error: ${response.status}`,
      errorText,
    );
    throw new Error(`Cloudflare AI failed: ${response.status} ${errorText}`);
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('image')) {
    const body = await response.text();
    console.error(`[AiService] Unexpected content-type: ${contentType}`, body);
    throw new Error(`Unexpected response type: ${contentType} — ${body}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

// Helper: Upload image to R2
async function uploadImageToR2(
  key: string,
  body: Buffer,
  contentType: string = 'image/jpeg',
): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME ?? 'gaeldle-image-gen',
    Key: key,
    Body: body,
    ContentType: contentType,
  });

  await s3.send(command);
}

// Main processing
try {
  // Step 1: Query up to 5 games where ai_image_url IS NULL
  const pending = await db
    .select()
    .from(schema.games)
    .where(sql`${schema.games.aiImageUrl} IS NULL`)
    .limit(5);

  console.log(`Found ${pending.length} games with null ai_image_url`);

  if (pending.length === 0) {
    console.log('No games to process. Exiting.');
    await pool.end();
    process.exit(0);
  }

  let successCount = 0;
  let failureCount = 0;
  const failures: { gameId: number; gameName: string; error: string }[] = [];

  // Step 2: Process each game
  for (const game of pending) {
    try {
      console.log(`\nProcessing game: ${game.name} (ID: ${game.igdbId})`);

      // Build the prompt
      const prompt = buildImagePrompt(game, options);
      console.log(`Generated prompt (${prompt.length} chars)`);

      // Generate the image
      console.log('Generating image via Cloudflare AI...');
      const rawBuffer = await generateImage(prompt);
      console.log(`Image buffer size: ${rawBuffer.length} bytes`);

      // Optimize with sharp
      const imageBuffer = await sharp(rawBuffer)
        .jpeg({ quality: 85 })
        .toBuffer();
      console.log(`Optimized image size: ${imageBuffer.length} bytes`);

      // Upload to R2
      const key = `res/${game.igdbId}_${Date.now()}.jpg`;
      console.log(`Uploading to R2 with key: ${key}`);
      await uploadImageToR2(key, imageBuffer, 'image/jpeg');

      // Build public URL
      const r2PublicUrlRaw = process.env.R2_PUBLIC_URL ?? '';
      const r2PublicUrl = r2PublicUrlRaw.startsWith('http')
        ? r2PublicUrlRaw
        : `https://${r2PublicUrlRaw}`;
      const publicUrl = `${r2PublicUrl}/${key}`;
      console.log(`Public URL: ${publicUrl}`);

      // Update database
      await db
        .update(schema.games)
        .set({
          aiImageUrl: publicUrl,
          aiPrompt: prompt,
          updatedAt: new Date(),
        })
        .where(eq(schema.games.id, game.id));

      console.log(`Successfully updated game ${game.name}`);
      successCount++;
    } catch (error) {
      failureCount++;
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      failures.push({
        gameId: game.igdbId,
        gameName: game.name,
        error: errorMessage,
      });
      console.error(
        `Failed to process game ${game.name} (${game.igdbId}):`,
        errorMessage,
      );
    }
  }

  // Step 3: Report results
  console.log('\n=== BULK IMAGE GENERATION SUMMARY ===');
  console.log(`Total games found with ai_image_url IS NULL: ${pending.length}`);
  console.log(`Games processed: ${pending.length}`);
  console.log(`Successes: ${successCount}`);
  console.log(`Failures: ${failureCount}`);

  if (failures.length > 0) {
    console.log('\nFailed games:');
    for (const failure of failures) {
      console.log(
        `  - ${failure.gameName} (ID: ${failure.gameId}): ${failure.error}`,
      );
    }
  }

  // Check for remaining games
  const remaining = await db
    .select()
    .from(schema.games)
    .where(sql`${schema.games.aiImageUrl} IS NULL`);

  console.log(`Remaining games with ai_image_url IS NULL: ${remaining.length}`);

  await pool.end();
  process.exit(failureCount > 0 ? 1 : 0);
} catch (error) {
  console.error('Fatal error:', error);
  await pool.end();
  process.exit(1);
}
