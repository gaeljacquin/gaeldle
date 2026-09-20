UPDATE "game"
SET
  "image_gen" = (
    SELECT COALESCE(jsonb_agg(entry), '[]'::jsonb)::json
    FROM jsonb_array_elements("image_gen"::jsonb) AS image(entry)
    WHERE NOT EXISTS (
      SELECT 1
      FROM jsonb_object_keys(
        CASE
          WHEN jsonb_typeof(entry) = 'object' THEN entry
          ELSE '{}'::jsonb
        END
      ) AS key(value)
      WHERE lower(key.value) = 'simpsons'
    )
  ),
  "updated_at" = now()
WHERE "image_gen" IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM jsonb_array_elements("image_gen"::jsonb) AS image(entry)
    CROSS JOIN LATERAL jsonb_object_keys(
      CASE
        WHEN jsonb_typeof(entry) = 'object' THEN entry
        ELSE '{}'::jsonb
      END
    ) AS key(value)
    WHERE lower(key.value) = 'simpsons'
  );
--> statement-breakpoint
REFRESH MATERIALIZED VIEW "all_games";
