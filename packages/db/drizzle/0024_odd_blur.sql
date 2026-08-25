CREATE MATERIALIZED VIEW "public"."queried_games" AS (SELECT DISTINCT ON ((payload->>'igdbId')::integer)
    (payload->>'igdbId')::integer AS igdb_id,
    payload->>'gameName' AS name,
    payload->'gameInfo' AS game_info
  FROM domain_event
  WHERE event_type = 'game.queried'
    AND (payload->>'alreadyInDb')::boolean = false
    AND (payload->>'found')::boolean = true
    AND NOT EXISTS (
      SELECT 1 FROM game WHERE game.igdb_id = (payload->>'igdbId')::integer
    )
  ORDER BY (payload->>'igdbId')::integer, occurred_at DESC);