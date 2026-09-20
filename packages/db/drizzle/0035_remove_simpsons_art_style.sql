UPDATE "art_style"
SET "is_active" = 0,
    "updated_at" = now()
WHERE lower("value") = 'simpsons';
--> statement-breakpoint
REFRESH MATERIALIZED VIEW "active_art_styles";
--> statement-breakpoint
REFRESH MATERIALIZED VIEW "active_art_style_values";
