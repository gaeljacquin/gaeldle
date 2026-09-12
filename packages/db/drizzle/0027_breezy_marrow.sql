CREATE MATERIALIZED VIEW "public"."games_clue_history" AS (SELECT
    de.id AS id,
    (de.payload->>'gameId')::integer AS game_id,
    (de.payload->>'igdbId')::integer AS igdb_id,
    g.name AS name,
    de.payload->>'clue' AS clue,
    de.payload->>'prompt' AS prompt,
    de.payload->>'provider' AS provider,
    de.payload->>'model' AS model,
    de.occurred_at AS occurred_at
  FROM domain_event de
  JOIN game g ON g.id = (de.payload->>'gameId')::integer
  WHERE de.event_type IN ('clue.generated', 'clue.restored')
  ORDER BY de.occurred_at DESC);