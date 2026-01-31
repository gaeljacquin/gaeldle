'use client';

import { useState, useEffect, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '@/lib/utils';
import type { Game } from '@gaeldle/types/game';
import { X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useDebounce } from '@/lib/hooks/use-debounce';
import { searchGames } from '@/lib/services/game.service';

interface SpecificationsSearchProps {
  selectedGameId: number | null;
  wrongGuesses: number[];
  onSelectGame: (gameId: number) => void;
  disabled?: boolean;
  className?: string;
  mode?: string;
}

export default function GameSearch({
  selectedGameId,
  wrongGuesses,
  onSelectGame,
  disabled = false,
  className,
  mode,
}: SpecificationsSearchProps) {
  const [searchValue, setSearchValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<Game[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedSearch = useDebounce(searchValue, 300);
  const parentRef = useRef<HTMLDivElement>(null);

  // Virtual scrolling - show 5 items at once
  const virtualizer = useVirtualizer({
    count: searchResults.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 44, // Approximate height of each item in pixels (increased from 32)
    overscan: 2, // Render 2 items above and below visible area for smooth scrolling
  });

  const handleSelect = (gameId: number) => {
    if (wrongGuesses.includes(gameId) || disabled) return;
    onSelectGame(gameId);
    setSearchValue('');
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    setIsOpen(value.length > 0);
  };

  const handleClear = () => {
    setSearchValue('');
    setIsOpen(false);
    setSearchResults([]);
  };

  // Fetch search results from backend API
  useEffect(() => {
    // Only search if there are at least 2 characters
    if (debouncedSearch.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const performSearch = async () => {
      setIsSearching(true);
      try {
        const results = await searchGames(debouncedSearch, 100, mode);
        setSearchResults(results);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [debouncedSearch, mode]);

  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        <div className="flex h-10 items-center gap-2 border border-border rounded-lg px-3 bg-background">
          <Search className="size-4 shrink-0 opacity-50" />
          <input
            type="text"
            placeholder="Search..."
            value={searchValue}
            onChange={handleInputChange}
            disabled={disabled}
            onFocus={() => searchValue.length > 0 && setIsOpen(true)}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
          />
          {searchValue.length > 0 && (
            <Button
              onClick={handleClear}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-transparent cursor-pointer"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {isOpen && searchValue.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border border-border rounded-lg shadow-lg">
          {searchValue.length < 2 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Type at least 2 characters to search...
            </div>
          ) : isSearching ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Searching...
            </div>
          ) : searchResults.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No games found.
            </div>
          ) : (
            <TooltipProvider delayDuration={300}>
              <div
                ref={parentRef}
                className="overflow-y-auto p-1"
                style={{
                  height: `${Math.min(searchResults.length, 5) * 44}px`,
                  maxHeight: '220px',
                }}
              >
                <div
                  style={{
                    height: `${virtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                  }}
                >
                  {virtualizer.getVirtualItems().map((virtualItem) => {
                    const game = searchResults[virtualItem.index];
                    const isWrongGuess = wrongGuesses.includes(game.id);
                    const isSelected = selectedGameId === game.id;
                    const isDisabled = isWrongGuess || disabled;

                    return (
                      <Tooltip key={game.id}>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => handleSelect(game.id)}
                            disabled={isDisabled}
                            className={cn(
                              'w-full text-left px-3 py-2.5 text-sm rounded-sm transition-colors absolute top-0 left-0 leading-relaxed',
                              'disabled:pointer-events-none disabled:opacity-50',
                              isWrongGuess && 'line-through opacity-50 cursor-not-allowed',
                              isSelected
                                ? 'bg-slate-700 text-white hover:bg-slate-700'
                                : 'hover:bg-accent hover:text-accent-foreground'
                            )}
                            style={{
                              height: `${virtualItem.size}px`,
                              transform: `translateY(${virtualItem.start}px)`,
                            }}
                          >
                            <span className="block truncate">{game.name}</span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-md">
                          <p>{game.name}</p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            </TooltipProvider>
          )}
        </div>
      )}
    </div>
  );
}
