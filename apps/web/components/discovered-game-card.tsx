import Image from 'next/image';
import { Checkbox } from '@workspace/ui/checkbox';
import { cn } from '@workspace/ui/lib/utils';
import { ReactNode } from 'react';

interface DiscoveredGameCardProps {
  igdbId: number;
  name: string;
  firstReleaseDate: number | null;
  coverUrl: string | null;
  isSelected: boolean;
  isAlreadyAdded: boolean;
  isApplied: boolean;
  isDisabled: boolean;
  onToggle: (igdbId: number) => void;
}

function releaseDate(timestamp: number | null): string | null {
  if (timestamp === null) return null;
  return new Date(timestamp * 1000).toISOString().slice(0, 10);
}

function statusBadge(isApplied: boolean, isAlreadyAdded: boolean): ReactNode {
  if (isApplied) {
    return (
      <div className="absolute top-1.5 right-1.5 rounded-none bg-green-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
        Added
      </div>
    );
  }
  if (isAlreadyAdded) {
    return (
      <div className="absolute top-1.5 right-1.5 rounded-none bg-blue-700 px-1.5 py-0.5 text-[10px] font-semibold text-white">
        In library
      </div>
    );
  }
  return null;
}

export function DiscoveredGameCard({
  igdbId,
  name,
  firstReleaseDate,
  coverUrl,
  isSelected,
  isAlreadyAdded,
  isApplied,
  isDisabled,
  onToggle,
}: Readonly<DiscoveredGameCardProps>) {
  const date = releaseDate(firstReleaseDate);
  const isCheckboxDisabled = isAlreadyAdded || isApplied || isDisabled;

  return (
    <div
      className={cn(
        'relative flex flex-col overflow-hidden border bg-card transition-colors',
        isSelected ? 'border-primary ring-1 ring-primary' : null,
        isAlreadyAdded ? 'opacity-60' : null,
        isApplied ? 'opacity-75' : null,
      )}
    >
      {/* Cover image */}
      <div className="relative aspect-2/3 w-full overflow-hidden bg-muted">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={`Cover art for ${name}`}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground text-xs">
            No cover
          </div>
        )}

        {/* Status badge */}
        {statusBadge(isApplied, isAlreadyAdded)}
      </div>

      {/* Bottom bar: checkbox, truncated title, year */}
      <div className="flex items-start gap-2 px-2 py-2" title={name}>
        <div className="mt-0.5 shrink-0">
          <Checkbox
            checked={isSelected || isAlreadyAdded || isApplied}
            disabled={isCheckboxDisabled}
            onCheckedChange={() => {
              if (!isCheckboxDisabled) {
                onToggle(igdbId);
              }
            }}
            aria-label={`Select ${name}`}
            className={cn(
              isAlreadyAdded || isApplied
                ? 'data-checked:bg-blue-500 data-checked:border-blue-500 border-blue-500'
                : null,
            )}
          />
        </div>
        <div className="min-w-0 flex flex-col">
          <p
            className="text-[10px] font-medium leading-snug truncate"
            title={name}
          >
            {name}
          </p>
          {date ? (
            <p className="text-[10px] text-muted-foreground">{date}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
