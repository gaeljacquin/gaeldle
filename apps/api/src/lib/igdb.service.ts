import { Injectable, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { fetchWithTimeout } from '@/lib/utils';
import type { IgdbGame } from '@/db/schema';

export type { IgdbGame };

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

  constructor(@Optional() private readonly configService?: ConfigService) {
    this.twitchClientId =
      this.configService?.get<string>('twitchClientId') ?? '';
    this.twitchClientSecret =
      this.configService?.get<string>('twitchClientSecret') ?? '';
  }

  async getGameById(igdbId: number): Promise<IgdbGame | null> {
    const games = await this.getGamesByIds([igdbId]);
    return games[0] ?? null;
  }

  async getGamesByIds(igdbIds: number[]): Promise<IgdbGame[]> {
    if (igdbIds.length === 0) {
      return [];
    }

    const token = await this.getAccessToken();
    const query = `
      fields id, name, summary, storyline, url, total_rating, total_rating_count,
             first_release_date, cover.image_id, cover.url,
             artworks.image_id, artworks.url, keywords.name, franchises.name, collections.name,
             game_engines.name, game_modes.name, genres.name,
             involved_companies.company.name, involved_companies.publisher, involved_companies.developer,
             platforms.name, player_perspectives.name, release_dates.human, release_dates.date, release_dates.platform.name,
             themes.id, themes.name, category, status;
      where id = (${igdbIds.join(',')});
      limit ${igdbIds.length};
    `;

    const response = await fetchWithTimeout('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        'Client-ID': this.twitchClientId,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'text/plain',
      },
      body: query,
      timeout: 15000,
    });

    if (!response.ok) {
      throw new Error(`IGDB API error: ${response.statusText}`);
    }

    return response.json();
  }

  async discoverCandidates(limit = 20): Promise<IgdbGame[]> {
    const token = await this.getAccessToken();
    const query = `
      fields id, name, summary, storyline, url, total_rating, total_rating_count,
             first_release_date, cover.image_id, cover.url,
             artworks.image_id, artworks.url, keywords.name, franchises.name, collections.name,
             game_engines.name, game_modes.name, genres.name,
             involved_companies.company.name, involved_companies.publisher, involved_companies.developer,
             platforms.name, player_perspectives.name, release_dates.human, release_dates.date, release_dates.platform.name,
             themes.id, themes.name, category, status;
      where total_rating_count > 50 & cover != null;
      sort total_rating desc;
      limit ${limit};
    `;

    const response = await fetchWithTimeout('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        'Client-ID': this.twitchClientId,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'text/plain',
      },
      body: query,
      timeout: 15000,
    });

    if (!response.ok) {
      throw new Error(`IGDB API error: ${response.statusText}`);
    }

    return response.json();
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.accessTokenExpiresAt) {
      return this.accessToken;
    }

    const params = new URLSearchParams({
      client_id: this.twitchClientId,
      client_secret: this.twitchClientSecret,
      grant_type: 'client_credentials',
    });

    const response = await fetchWithTimeout(
      `https://id.twitch.tv/oauth2/token?${params.toString()}`,
      { method: 'POST', timeout: 10000 },
    );

    if (!response.ok) {
      throw new Error(`Twitch token error: ${response.statusText}`);
    }

    const data: TwitchTokenResponse = await response.json();
    this.accessToken = data.access_token;
    // Buffer by 60 seconds
    this.accessTokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;

    return this.accessToken;
  }
}
