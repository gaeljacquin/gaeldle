import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { fetchWithTimeout } from '@/lib/utils';
import type { IgdbGame, IgdbGameField } from '@workspace/api-contract';

type TwitchTokenResponse = {
  access_token: string;
  expires_in: number;
  token_type: string;
};

@Injectable()
export class IgdbService {
  private readonly twitchClientId: string;
  private readonly twitchClientSecret: string;
  private accessToken: string | null = null;
  private accessTokenExpiresAt = 0;

  constructor(private readonly configService: ConfigService) {
    this.twitchClientId =
      this.configService.get<string>('twitchClientId') ?? '';
    this.twitchClientSecret =
      this.configService.get<string>('twitchClientSecret') ?? '';
  }

  async getGamesByIds(igdbIds: number[]): Promise<IgdbGame[]> {
    if (igdbIds.length === 0) {
      return [];
    }

    if (!this.twitchClientId || !this.twitchClientSecret) {
      throw new Error(
        'TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET must be configured',
      );
    }

    const accessToken = await this.getAccessToken();
    const igdbGameFields: IgdbGameField[] = [
      'id',
      'name',
      'summary',
      'storyline',
      'url',
      'total_rating',
      'total_rating_count',
      'first_release_date',
      'cover.image_id',
      'cover.url',
      'artworks.image_id',
      'artworks.url',
      'keywords.name',
      'franchises.name',
      'game_engines.name',
      'game_modes.name',
      'genres.name',
      'involved_companies.company.name',
      'involved_companies.publisher',
      'involved_companies.developer',
      'platforms.name',
      'player_perspectives.name',
      'release_dates.human',
      'release_dates.date',
      'release_dates.platform.name',
      'themes.name',
    ];
    const idsStr = igdbIds.join(',');
    const response = await fetchWithTimeout('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        'Client-ID': this.twitchClientId,
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
      body: `fields ${igdbGameFields.join(',')}; where id = (${idsStr}); limit ${igdbIds.length};`,
      timeout: 20000,
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`IGDB request failed (${response.status}): ${details}`);
    }

    return (await response.json()) as IgdbGame[];
  }

  async getGameById(igdbId: number): Promise<IgdbGame | null> {
    if (!this.twitchClientId || !this.twitchClientSecret) {
      throw new Error(
        'TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET must be configured',
      );
    }

    const accessToken = await this.getAccessToken();
    const fields = [
      'id',
      'name',
      'summary',
      'storyline',
      'url',
      'total_rating',
      'total_rating_count',
      'first_release_date',
      'cover.image_id',
      'cover.url',
      'artworks.image_id',
      'artworks.url',
      'keywords.name',
      'franchises.name',
      'game_engines.name',
      'game_modes.name',
      'genres.name',
      'involved_companies.company.name',
      'involved_companies.publisher',
      'involved_companies.developer',
      'platforms.name',
      'player_perspectives.name',
      'release_dates.human',
      'release_dates.date',
      'release_dates.platform.name',
      'themes.name',
    ];

    const response = await fetchWithTimeout('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        'Client-ID': this.twitchClientId,
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
      body: `fields ${fields.join(',')}; where id = ${igdbId}; limit 1;`,
      timeout: 20000,
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`IGDB request failed (${response.status}): ${details}`);
    }

    const games = (await response.json()) as IgdbGame[];

    return games[0] ?? null;
  }

  async discoverCandidates(count: number): Promise<IgdbGame[]> {
    if (!this.twitchClientId || !this.twitchClientSecret) {
      throw new Error(
        'TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET must be configured',
      );
    }

    const accessToken = await this.getAccessToken();
    const now = Math.floor(Date.now() / 1000);
    const fetchLimit = Math.min(count * 3, 500);
    const offset = Math.floor(Math.random() * 200);
    const body = `fields id,name,first_release_date,cover.url,cover.image_id,total_rating,total_rating_count,genres.name,platforms.name,themes.id,category; where id > 0 & total_rating_count != null & total_rating_count > 50 & first_release_date != null & first_release_date < ${now}; sort total_rating_count desc; limit ${fetchLimit}; offset ${offset};`;

    const response = await fetchWithTimeout('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        'Client-ID': this.twitchClientId,
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
      body,
      timeout: 20000,
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`IGDB request failed (${response.status}): ${details}`);
    }

    const res = (await response.json()) as IgdbGame[];

    // Filter to main games only (category 0) and exclude erotic theme (42) post-fetch,
    // since IGDB's default pool does not support filtering on these fields server-side.
    return res
      .filter((g) => g.category === 0 || g.category === undefined)
      .filter((g) => !g.themes?.some((t) => t.id === 42))
      .slice(0, count);
  }

  private async getAccessToken(): Promise<string> {
    const now = Date.now();

    if (this.accessToken && now < this.accessTokenExpiresAt) {
      return this.accessToken;
    }

    const tokenResponse = await fetchWithTimeout(
      'https://id.twitch.tv/oauth2/token',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: this.twitchClientId,
          client_secret: this.twitchClientSecret,
          grant_type: 'client_credentials',
        }),
        timeout: 10000,
      },
    );

    if (!tokenResponse.ok) {
      const details = await tokenResponse.text();

      throw new Error(
        `Failed to fetch Twitch access token (${tokenResponse.status}): ${details}`,
      );
    }

    const payload = (await tokenResponse.json()) as TwitchTokenResponse;
    this.accessToken = payload.access_token;
    this.accessTokenExpiresAt =
      now + Math.max(payload.expires_in - 60, 30) * 1000;

    return this.accessToken;
  }
}

export type { IgdbGame };
