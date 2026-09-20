DROP MATERIALIZED VIEW "public"."games_clue_history";--> statement-breakpoint
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
    AND NOT EXISTS (
      SELECT 1
      FROM domain_event deleted_event
      WHERE deleted_event.event_type IN ('clue.history_deleted', 'clue.deleted')
        AND (deleted_event.payload->>'deletedHistoryId')::integer = de.id
    )
    AND NOT EXISTS (
      SELECT 1
      FROM domain_event restored_event
      WHERE restored_event.event_type = 'clue.restored'
        AND (restored_event.payload->>'restoredFromId')::integer = de.id
    )
  ORDER BY de.occurred_at DESC);