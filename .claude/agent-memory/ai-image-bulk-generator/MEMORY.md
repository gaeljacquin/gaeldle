# AI Image Bulk Generator Agent Memory

## Project Architecture

### Key Paths & Files
- **Script location**: `/Users/gael/Documents/projects/gaeldle/apps/api/scripts/bulk-generate-images.ts`
- **Package manager**: Bun (use `bun run` for all executions)
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Schema**: `@gaeldle/api-contract` package (located at `/Users/gael/Documents/projects/gaeldle/packages/api-contract/src/schema.ts`)
- **Constants**: `IMAGE_PROMPT_SUFFIX` from `@gaeldle/constants`

### Database Configuration
- **Database URL**: Set in `apps/api/.env`
- **Connection pattern**: Use `Pool` from `pg` + Drizzle ORM
- **Target table**: `game` (aliased as `schema.games` in Drizzle)
- **Fields to update**: `aiImageUrl` and `aiPrompt` (snake_case in DB)

### AI Image Generation Pipeline
1. **Cloudflare AI**: Stable Diffusion XL model at `@cf/stabilityai/stable-diffusion-xl-base-1.0`
2. **Image optimization**: Sharp library (JPEG format, quality 85)
3. **Storage**: Cloudflare R2 via S3 SDK
4. **Directory structure**: Images stored under `res/` directory with format `res/{igdbId}_{timestamp}.jpg`

### Prompt Building Logic
The script uses the same `buildImagePrompt()` function as `games.router.ts`:
- Base: `Cinematic video game key art for "{gameName}"`
- Add game summary if available
- Conditionally add: storyline, genres, themes (all false by default)
- Always include: keywords (if available)
- Append: `IMAGE_PROMPT_SUFFIX` for consistent styling

### Default Prompt Options
```typescript
includeStoryline: false
includeGenres: false
includeThemes: false
```

## Execution Notes

### Command Format
```bash
INCLUDE_STORYLINE=false INCLUDE_GENRES=false INCLUDE_THEMES=false \
bun run apps/api/scripts/bulk-generate-images.ts
```

### Script Requirements
- Must use dotenv to load `apps/api/.env` (Bun supports native .env loading)
- All credentials must be present in `.env`: DATABASE_URL, CF_ACCOUNT_ID, CF_API_TOKEN, R2_* vars
- Supports `NUM_GAMES` env variable (default 5, max 50)
- Defaults to 5 games per invocation if NUM_GAMES not specified

### Success Patterns
- Each game takes approximately 9-12 seconds to process (Cloudflare AI generation time varies)
- Image buffer sizes are typically 1.4-2.0 MB before optimization
- Optimized JPEG sizes range 140-240 KB depending on complexity
- Database writes are atomic (update both aiImageUrl and aiPrompt together)

### Error Handling
- Per-game failures don't stop the pipeline; errors are logged and processing continues
- Failed games are reported in summary but DB not updated (safe on error)
- If any game fails, exit code is 1; if all succeed, exit code is 0

## Session Notes

### Latest Run (2026-02-20 - Batch 3)
- 47 total games in database (after batches 1 & 2)
- 47 games initially missing `ai_image_url` before run
- Batch 3: 7 games processed successfully with Simpsons style
- Prompt options: INCLUDE_GENRES=true (genres added to prompts)
- 40 games remaining for future batches

### Generated Games (Batch 3 - Simpsons Style + Genres)
1. Hollow Knight - 1,592 char prompt (249 KB optimized)
2. Stardew Valley - 2,110 char prompt (251 KB optimized)
3. Red Dead Redemption 2 - 1,362 char prompt (221 KB optimized)
4. Sekiro: Shadows Die Twice - 1,196 char prompt (236 KB optimized)
5. Hades - 1,381 char prompt (256 KB optimized)
6. Elden Ring - 2,790 char prompt (297 KB optimized)
7. God of War - 1,790 char prompt (242 KB optimized)

### Feature Updates
- Script now supports dynamic `NUM_GAMES` parameter (default 5, max 50)
- `NUM_GAMES=7` successfully tested in batch 3
- Genres are correctly injected into prompts when INCLUDE_GENRES=true
