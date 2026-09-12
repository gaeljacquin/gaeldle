export interface DiscoverCandidate {
  igdbId: number;
  name: string;
  firstReleaseDate: number | null;
  coverUrl: string | null;
  totalRating: number | null;
  totalRatingCount: number | null;
  genres: string[];
  platforms: string[];
  isAlreadyAdded: boolean;
}

export interface DiscoverApplyResult {
  igdbId: number;
  name: string | null;
  status: 'created' | 'updated' | 'error';
  error: string | null;
}
