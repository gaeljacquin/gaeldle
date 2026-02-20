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
- Processes exactly 5 games per invocation (max 5 limit in query)

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

### Latest Run (2026-02-20)
- 53 total games in database (after previous batch of 5)
- 53 games initially missing `ai_image_url` (before this run)
- Batch 2: 5 games processed successfully with vector-art style
- Prompt options: default (storyline/genres/themes all false)
- 48 games remaining for future batches

### Generated Games (Batch 2 - Vector Art Style)
1. Fallout: New Vegas - 3,610 char prompt
2. Portal 2 - 1,333 char prompt
3. The Elder Scrolls V: Skyrim - 2,966 char prompt
4. The Witcher 3: Wild Hunt - 2,362 char prompt
5. Undertale - 1,500 char prompt

### Image Style Support
- Script now supports `IMAGE_STYLE` env variable
- Vector-art style successfully applied to all 5 games
- Style resolved via `IMAGE_STYLES` constant lookup (case-insensitive)
- Descriptor properly injected into prompt based on style selection
