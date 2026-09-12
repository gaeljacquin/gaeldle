'use client';

import { ToggleGroup, ToggleGroupItem } from '@workspace/ui/toggle-group';
import { cn } from '@workspace/ui/lib/utils';

export type LibraryFilterValue = 'all' | 'owned' | 'demos';

export interface LibraryFilterCounts {
  all?: number;
  owned?: number;
  demos?: number;
}

export interface LibraryFilterToggleGroupProps {
  value: LibraryFilterValue;
  onValueChange: (value: LibraryFilterValue) => void;
  counts?: LibraryFilterCounts;
  className?: string;
  variant?: 'default' | 'outline';
  size?: 'default' | 'sm' | 'lg';
  ariaLabel?: string;
}

export function LibraryFilterToggleGroup({
  value,
  onValueChange,
  counts,
  className,
  variant = 'outline',
  size = 'default',
  ariaLabel = 'Filter games by ownership',
}: LibraryFilterToggleGroupProps) {
  const items: { value: LibraryFilterValue; label: string; count?: number }[] =
    [
      { value: 'all', label: 'All', count: counts?.all },
      { value: 'owned', label: 'Owned', count: counts?.owned },
      { value: 'demos', label: 'Demos', count: counts?.demos },
    ];

  return (
    <ToggleGroup
      variant={variant}
      size={size}
      value={[value]}
      onValueChange={(val) => {
        if (val && val.length > 0) {
          const selected = val[0] as LibraryFilterValue;
          if (
            selected === 'all' ||
            selected === 'owned' ||
            selected === 'demos'
          ) {
            onValueChange(selected);
          }
        }
      }}
      className={cn('h-8', className)}
      aria-label={ariaLabel}
    >
      {items.map((item) => (
        <ToggleGroupItem
          key={item.value}
          value={item.value}
          aria-label={item.label}
          className="px-3 cursor-pointer"
        >
          <span className="font-medium">{item.label}</span>
          {item.count !== undefined ? (
            <span className="text-[11px] text-muted-foreground font-normal ml-1">
              ({item.count})
            </span>
          ) : null}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
