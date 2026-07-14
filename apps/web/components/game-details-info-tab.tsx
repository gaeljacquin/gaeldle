'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { getGameByIgdbId } from '@/lib/services/game.service';

interface Company {
  name: string;
  developer: boolean;
  publisher: boolean;
}

export default function GameDetailsInfoTab({ igdbId }: { igdbId: string }) {
  const { data: game } = useSuspenseQuery({
    queryKey: ['game', igdbId],
    queryFn: () => getGameByIgdbId(Number.parseInt(igdbId, 10)),
  });

  const platforms = game.platforms as string[] | null;
  const genres = game.genres as string[] | null;
  const involvedCompanies = game.involvedCompanies as Company[] | null;

  return (
    <div className="space-y-10">
      {game.summary && (
        <div className="space-y-4">
          <h2 className="text-md font-black uppercase tracking-widest border-l-4 border-primary pl-4">
            Summary
          </h2>
          <p className="text-muted-foreground leading-relaxed text-lg">
            {game.summary}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-4">
        {platforms && platforms.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">
              Platforms
            </h3>
            <div className="flex flex-wrap gap-2">
              {platforms.map((p: string) => (
                <span
                  key={p}
                  className="bg-primary/5 text-primary border border-primary/20 px-3 py-1 text-xs font-bold uppercase tracking-wider"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        )}

        {genres && genres.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">
              Genres
            </h3>
            <div className="flex flex-wrap gap-2">
              {genres.map((g: string) => (
                <span
                  key={g}
                  className="bg-muted px-3 py-1 text-xs font-bold uppercase tracking-wider border border-border"
                >
                  {g}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {involvedCompanies && involvedCompanies.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">
            Companies
          </h3>
          <div className="flex flex-wrap gap-3">
            {involvedCompanies.map((c: Company, idx: number) => (
              <div
                key={`${c.name}-${idx}`}
                className="flex flex-col border border-dashed p-3 min-w-37.5"
              >
                <span className="font-bold text-sm">{c.name}</span>
                <span className="text-[10px] uppercase text-muted-foreground font-bold">
                  {c.developer ? 'Developer' : ''}
                  {c.developer && c.publisher ? ' & ' : ''}
                  {c.publisher ? 'Publisher' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
