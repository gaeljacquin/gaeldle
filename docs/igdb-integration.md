# IGDB Integration

This document explains how to authenticate with the IGDB API and provides examples for querying game data.

## Authentication

IGDB uses Twitch OAuth 2.0 for authentication. You need a `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET` to obtain an access token.

### Get an App Access Token

Exchange your credentials for a bearer token using Twitch's OAuth endpoint:

```bash
curl -X POST "https://id.twitch.tv/oauth2/token" \
  -d "client_id=$TWITCH_CLIENT_ID" \
  -d "client_secret=$TWITCH_CLIENT_SECRET" \
  -d "grant_type=client_credentials"
```

**Response Format:**

```json
{
  "access_token": "abc123xyz",
  "expires_in": 5183944,
  "token_type": "bearer"
}
```

> [!NOTE]
> Tokens typically expire after ~60 days. If you receive a `401 Unauthorized` response, re-run this step to refresh your token.

## Querying Game Data

IGDB uses a query language called **Apicalypse**. All queries are sent via **POST** requests.

### Example: Top 100 Games

To fetch the top 100 games sorted by `aggregated_rating` (critic scores):

```bash
curl -X POST "https://api.igdb.com/v4/games" \
  -H "Client-ID: $TWITCH_CLIENT_ID" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Accept: application/json" \
  --data "fields name, cover.url, rating, aggregated_rating, total_rating_count;
          where aggregated_rating_count > 20;
          sort aggregated_rating desc;
          limit 100;"
```

### Key Query Parameters

- `fields`: Comma-separated list of fields to return (e.g., `name, cover.url`).
- `where`: Filters the results (e.g., `aggregated_rating_count > 20` prevents obscure games from skewing results).
- `sort`: Defines the sort order (e.g., `aggregated_rating desc`).
- `limit`: Maximum number of records to return (default 10, max 500).

## Useful One-liner (Bash)

Store the token and immediately query the top 100 games:

```bash
TOKEN=$(curl -s -X POST "https://id.twitch.tv/oauth2/token" \
  -d "client_id=$TWITCH_CLIENT_ID&client_secret=$TWITCH_CLIENT_SECRET&grant_type=client_credentials" \
  | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

curl -X POST "https://api.igdb.com/v4/games" \
  -H "Client-ID: $TWITCH_CLIENT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" \
  --data "fields name,cover.url,aggregated_rating,total_rating_count; where aggregated_rating_count > 20; sort aggregated_rating desc; limit 100;"
```

## References

- [Official IGDB Documentation](https://api-docs.igdb.com/)
- [Apicalypse Query Language](https://apicalypse.io/)
