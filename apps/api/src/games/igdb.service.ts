import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type IgdbGame = {
  id: number;
  name: string;
  summary?: string;
  storyline?: string;
  url?: string;
  total_rating?: number;
  total_rating_count?: number;
  first_release_date?: number;
  cover?: { image_id?: string; url?: string };
  artworks?: Array<{ image_id?: string; url?: string }>;
  keywords?: Array<{ name?: string }>;
  franchises?: Array<{ name?: string }>;
  game_engines?: Array<{ name?: string }>;
  game_modes?: Array<{ name?: string }>;
  genres?: Array<{ name?: string }>;
  involved_companies?: Array<{
    company?: { name?: string };
    publisher?: boolean;
    developer?: boolean;
  }>;
  platforms?: Array<{ name?: string }>;
  player_perspectives?: Array<{ name?: string }>;
  release_dates?: Array<{
    human?: string;
    date?: number;
    platform?: { name?: string };
  }>;
  themes?: Array<{ name?: string }>;
};

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

    const response = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        'Client-ID': this.twitchClientId,
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
      body: `fields ${fields.join(',')}; where id = ${igdbId}; limit 1;`,
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`IGDB request failed (${response.status}): ${details}`);
    }

    const games = (await response.json()) as IgdbGame[];
    return games[0] ?? null;
  }

  private async getAccessToken(): Promise<string> {
    const now = Date.now();
    if (this.accessToken && now < this.accessTokenExpiresAt) {
      return this.accessToken;
    }

    const tokenResponse = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.twitchClientId,
        client_secret: this.twitchClientSecret,
        grant_type: 'client_credentials',
      }),
    });

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
