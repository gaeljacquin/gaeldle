-- SQL migration script to populate "image_gen" JSON column from legacy "ai_image_url" and "ai_prompt" columns.
--
-- This script matches the start of "ai_prompt" against known art style descriptors to determine the style key,
-- then builds the JSON array structure: [{ "style_key": { "url": "...", "prompt": "...", "provider": "cloudflare" } }]

UPDATE "game"
SET "image_gen" = json_build_array(
  json_build_object(
    CASE
      WHEN "ai_prompt" ILIKE 'Funko Pop chibi style illustration%' THEN 'funko-pop-chibi'
      WHEN "ai_prompt" ILIKE 'Simpsons style illustration%' THEN 'simpsons'
      WHEN "ai_prompt" ILIKE 'Rubber hose animation style illustration%' THEN 'rubber-hose-animation'
      WHEN "ai_prompt" ILIKE 'Muppet style illustration%' THEN 'muppet'
      WHEN "ai_prompt" ILIKE 'Lego style illustration%' THEN 'lego'
      WHEN "ai_prompt" ILIKE 'Claymation style illustration%' THEN 'claymation'
      WHEN "ai_prompt" ILIKE 'Vector art style illustration%' THEN 'vector-art'
      WHEN "ai_prompt" ILIKE 'Digital cel-shaded%' THEN 'digital-cel-shaded'
      WHEN "ai_prompt" ILIKE 'Western animation%' THEN 'western-animation-concept-art'
      WHEN "ai_prompt" ILIKE 'Graphic novel%' THEN 'graphic-novel-illustration'
      ELSE 'funko-pop-chibi' -- Default fallback if no style is matched
    END,
    json_build_object(
      'url', "ai_image_url",
      'prompt', "ai_prompt",
      'provider', 'cloudflare'
    )
  )
)
WHERE "ai_image_url" IS NOT NULL 
  AND "ai_prompt" IS NOT NULL
  AND ("image_gen" IS NULL OR "image_gen"::text = '[]' OR "image_gen"::text = '{}');
