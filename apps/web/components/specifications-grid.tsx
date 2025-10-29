import { ReactNode, Fragment } from 'react';
import { cn } from '@/lib/utils';
import type { SpecificationGuess, RevealedClue, Game, CellMatch } from '@/lib/types/game';
import Image from 'next/image';
import { MoveUp, MoveDown, MoveRight } from 'lucide-react';

interface SpecificationsGridProps {
  guesses: SpecificationGuess[];
  revealedClue?: RevealedClue | null;
  targetGame?: Game | null;
  showAnswerOnly?: boolean;
  className?: string;
}

const COLUMN_HEADERS = [
  { key: 'name', label: 'Name' },
  { key: 'platforms', label: 'Platforms' },
  { key: 'genres', label: 'Genres' },
  { key: 'themes', label: 'Themes' },
  { key: 'releaseDate', label: 'Release year' },
  { key: 'gameModes', label: 'Game mode' },
  { key: 'gameEngines', label: 'Game engines' },
  { key: 'publisher', label: 'Publisher' },
  { key: 'perspective', label: 'Perspective' },
] as const;

function getCellColor(matchType: 'exact' | 'partial' | 'none', hasData: boolean): string {
  // If there's no data, use dark slate background
  if (!hasData) {
    return 'bg-slate-700';
  }

  switch (matchType) {
    case 'exact':
      return 'bg-green-600';
    case 'partial':
      return 'bg-yellow-500';
    case 'none':
      return 'bg-red-600';
  }
}

function CellValue({ value }: { value: string | string[] | null }) {
  if (!value) return <>No data</>;
  if (Array.isArray(value)) {
    if (value.length === 0) return <>No data</>;
    return (
      <div className="flex flex-col gap-0.5">
        {value.map((item, idx) => (
          <div key={idx}>{item}</div>
        ))}
      </div>
    );
  }
  return <>{value}</>;
}

function hasData(value: string | string[] | null): boolean {
  if (!value) return false;
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  return value !== 'No data' && value !== '';
}

// Helper to extract array from JSON field
function extractArray(data: unknown): string[] {
  if (!data) return [];
  if (Array.isArray(data)) {
    return data.map(item => {
      if (typeof item === 'string') return item;
      if (typeof item === 'object' && item !== null && 'name' in item) {
        return (item as { name: string }).name;
      }
      return String(item);
    });
  }
  return [];
}

// Helper to extract year from release date
function extractReleaseYear(firstReleaseDate: number | null): string | null {
  if (!firstReleaseDate) return null;
  const date = new Date(firstReleaseDate * 1000);
  return date.getFullYear().toString();
}

// Helper to extract publisher
function extractPublisher(involved_companies: unknown): string | null {
  if (!involved_companies || !Array.isArray(involved_companies)) return null;

  const publisher = involved_companies.find((company: unknown) =>
    typeof company === 'object' && company !== null && 'publisher' in company && (company as { publisher: boolean }).publisher === true
  );

  if (publisher && typeof publisher === 'object') {
    if ('company' in publisher) {
      const companyData = publisher.company;
      if (typeof companyData === 'object' && companyData !== null && 'name' in companyData) {
        return (companyData as { name: string }).name;
      }
    }
    if ('name' in publisher) {
      return (publisher as { name: string }).name;
    }
  }

  return null;
}

// Helper to find best match across all guesses for a field
function getBestMatch(
  guesses: SpecificationGuess[],
  field: keyof SpecificationGuess['matches'],
  revealedClue?: RevealedClue | null
): CellMatch {
  // If a hint was revealed for this field, treat it as an exact match
  if (revealedClue && revealedClue.field === field) {
    return { type: 'exact', value: revealedClue.value };
  }

  if (guesses.length === 0) {
    return { type: 'none', value: null };
  }

  // Priority: exact > partial > none
  const exactMatch = guesses.find(g => g.matches[field].type === 'exact');
  if (exactMatch) {
    return exactMatch.matches[field];
  }

  const partialMatch = guesses.find(g => g.matches[field].type === 'partial');
  if (partialMatch) {
    return partialMatch.matches[field];
  }

  // Return first guess's value even if it's 'none'
  return guesses[0].matches[field];
}

// Helper to render hint row
function renderHintRow(revealedClue: RevealedClue) {
  return (
    <tr key="hint-row" className="bg-slate-800 text-center">
      <td className="border border-border px-3 py-2 text-xs w-32">
        <div className="flex gap-1 text-white items-center justify-center">
          <p className="font-semibold">Hint</p>
          <MoveRight className="size-4" />
        </div>
      </td>
      {COLUMN_HEADERS.slice(1).map((header) => (
        <td
          key={header.key}
          className={cn(
            'border border-border px-3 py-2 text-xs text-white',
            revealedClue.field === header.key && 'bg-sky-700 font-semibold'
          )}
        >
          {revealedClue.field === header.key
            ? <CellValue value={revealedClue.value} />
            : '???'}
        </td>
      ))}
    </tr>
  );
}

// Helper to determine arrow direction for release year
function getYearArrow(guessYear: string | null, targetYear: string | null): ReactNode {
  if (!guessYear || !targetYear) return null;

  const guessYearNum = parseInt(guessYear, 10);
  const targetYearNum = parseInt(targetYear, 10);

  if (isNaN(guessYearNum) || isNaN(targetYearNum)) return null;

  if (guessYearNum < targetYearNum) {
    return <MoveUp className="w-16 h-32 text-white" strokeWidth={2} />;
  }
  if (guessYearNum > targetYearNum) {
    return <MoveDown className="w-16 h-32 text-white" strokeWidth={2} />;
  }
  return null; // Equal, no arrow
}

export default function SpecificationsGrid({
  guesses,
  revealedClue,
  targetGame,
  showAnswerOnly = false,
  className
}: SpecificationsGridProps) {
  // Reverse guesses to show newest first
  const reversedGuesses = [...guesses].reverse();

  // Calculate where to insert the hint row (if revealed)
  // If hint was revealed after N guesses, it should appear after the Nth guess from the end
  const hintInsertIndex = revealedClue
    ? guesses.length - revealedClue.revealedAtGuessCount
    : -1;

  // Extract answer specs if showing answer only
  const answerSpecs = targetGame ? {
    platforms: extractArray(targetGame.platforms),
    genres: extractArray(targetGame.genres),
    themes: extractArray(targetGame.themes),
    releaseDate: extractReleaseYear(targetGame.firstReleaseDate),
    gameModes: extractArray(targetGame.game_modes),
    gameEngines: extractArray(targetGame.game_engines),
    publisher: extractPublisher(targetGame.involved_companies),
    perspective: extractArray(targetGame.player_perspectives),
  } : null;

  // Calculate best matches for summary row (show if there are guesses OR a hint was revealed)
  const bestMatches = !showAnswerOnly && (guesses.length > 0 || revealedClue) ? {
    platforms: getBestMatch(guesses, 'platforms', revealedClue),
    genres: getBestMatch(guesses, 'genres', revealedClue),
    themes: getBestMatch(guesses, 'themes', revealedClue),
    releaseDate: getBestMatch(guesses, 'releaseDate', revealedClue),
    gameModes: getBestMatch(guesses, 'gameModes', revealedClue),
    gameEngines: getBestMatch(guesses, 'gameEngines', revealedClue),
    publisher: getBestMatch(guesses, 'publisher', revealedClue),
    perspective: getBestMatch(guesses, 'perspective', revealedClue),
  } : null;

  return (
    <div className={cn('overflow-x-auto w-full', className)}>
      <table className="w-full border-collapse min-w-max">
        <thead>
          {/* Summary row - shows best matches */}
          {bestMatches && (
            <tr>
              <th className="border border-border bg-slate-700 px-3 py-2 text-sm font-semibold text-white text-center w-32">
                Summary
              </th>
              <th
                className={cn(
                  'border border-border px-3 py-2 text-xs text-white text-center wrap-break-word',
                  getCellColor(bestMatches.platforms.type, hasData(bestMatches.platforms.value))
                )}
              >
                <CellValue value={bestMatches.platforms.value} />
              </th>
              <th
                className={cn(
                  'border border-border px-3 py-2 text-xs text-white text-center wrap-break-word',
                  getCellColor(bestMatches.genres.type, hasData(bestMatches.genres.value))
                )}
              >
                <CellValue value={bestMatches.genres.value} />
              </th>
              <th
                className={cn(
                  'border border-border px-3 py-2 text-xs text-white text-center wrap-break-word',
                  getCellColor(bestMatches.themes.type, hasData(bestMatches.themes.value))
                )}
              >
                <CellValue value={bestMatches.themes.value} />
              </th>
              <th
                className={cn(
                  'border border-border px-3 py-2 text-xs text-white relative text-center',
                  getCellColor(bestMatches.releaseDate.type, hasData(bestMatches.releaseDate.value))
                )}
              >
                {(() => {
                  const arrow = getYearArrow(
                    typeof bestMatches.releaseDate.value === 'string' ? bestMatches.releaseDate.value : null,
                    answerSpecs?.releaseDate || null
                  );
                  return (
                    <>
                      {arrow && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-40">
                          {arrow}
                        </div>
                      )}
                      <span className="relative z-10">
                        <CellValue value={bestMatches.releaseDate.value} />
                      </span>
                    </>
                  );
                })()}
              </th>
              <th
                className={cn(
                  'border border-border px-3 py-2 text-xs text-white text-center wrap-break-word',
                  getCellColor(bestMatches.gameModes.type, hasData(bestMatches.gameModes.value))
                )}
              >
                <CellValue value={bestMatches.gameModes.value} />
              </th>
              <th
                className={cn(
                  'border border-border px-3 py-2 text-xs text-white text-center wrap-break-word',
                  getCellColor(bestMatches.gameEngines.type, hasData(bestMatches.gameEngines.value))
                )}
              >
                <CellValue value={bestMatches.gameEngines.value} />
              </th>
              <th
                className={cn(
                  'border border-border px-3 py-2 text-xs text-white text-center wrap-break-word',
                  getCellColor(bestMatches.publisher.type, hasData(bestMatches.publisher.value))
                )}
              >
                <CellValue value={bestMatches.publisher.value} />
              </th>
              <th
                className={cn(
                  'border border-border px-3 py-2 text-xs text-white text-center wrap-break-word',
                  getCellColor(bestMatches.perspective.type, hasData(bestMatches.perspective.value))
                )}
              >
                <CellValue value={bestMatches.perspective.value} />
              </th>
            </tr>
          )}

          {/* Column headers */}
          {(guesses.length > 0 || showAnswerOnly) && (
            <tr>
              {COLUMN_HEADERS.map((header) => (
                <th
                  key={header.key}
                  className={cn(
                    'border border-border bg-muted px-3 py-2 text-sm font-semibold',
                    'text-center min-w-[120px]'
                  )}
                >
                  {header.label}
                </th>
              ))}
            </tr>
          )}
        </thead>
        <tbody>
          {/* Show answer row when showAnswerOnly is true */}
          {showAnswerOnly && answerSpecs && targetGame ? (
            <tr>
              {/* Summary (cover art with blue banner) */}
              <td className="border border-border p-0 w-32">
                <div className="relative w-32 h-44">
                  {targetGame.imageUrl ? (
                    <>
                      <Image
                        src={targetGame.imageUrl}
                        alt={targetGame.name}
                        className="w-full h-full object-cover"
                        width={128}
                        height={176}
                        sizes="100vw"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-blue-600 px-2 py-1">
                        <p className="text-xs font-semibold text-white truncate text-center">
                          {targetGame.name}
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full bg-muted flex flex-col items-center justify-center">
                      <span className="text-xs text-muted-foreground">No image</span>
                      <div className="absolute bottom-0 left-0 right-0 bg-blue-600 px-2 py-1">
                        <p className="text-xs font-semibold text-white truncate text-center">
                          {targetGame.name}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </td>

              {/* Platforms */}
              <td className="border border-border px-3 py-2 text-xs text-white bg-slate-700 text-center wrap-break-word">
                <CellValue value={answerSpecs.platforms.length > 0 ? answerSpecs.platforms : null} />
              </td>

              {/* Genres */}
              <td className="border border-border px-3 py-2 text-xs text-white bg-slate-700 text-center wrap-break-word">
                <CellValue value={answerSpecs.genres.length > 0 ? answerSpecs.genres : null} />
              </td>

              {/* Themes */}
              <td className="border border-border px-3 py-2 text-xs text-white bg-slate-700 text-center wrap-break-word">
                <CellValue value={answerSpecs.themes.length > 0 ? answerSpecs.themes : null} />
              </td>

              {/* Release Date */}
              <td className="border border-border px-3 py-2 text-xs text-white bg-slate-700 text-center wrap-break-word">
                <CellValue value={answerSpecs.releaseDate} />
              </td>

              {/* Game Modes */}
              <td className="border border-border px-3 py-2 text-xs text-white bg-slate-700 text-center wrap-break-word">
                <CellValue value={answerSpecs.gameModes.length > 0 ? answerSpecs.gameModes : null} />
              </td>

              {/* Game Engines */}
              <td className="border border-border px-3 py-2 text-xs text-white bg-slate-700 text-center wrap-break-word">
                <CellValue value={answerSpecs.gameEngines.length > 0 ? answerSpecs.gameEngines : null} />
              </td>

              {/* Publisher */}
              <td className="border border-border px-3 py-2 text-xs text-white bg-slate-700 text-center wrap-break-word">
                <CellValue value={answerSpecs.publisher} />
              </td>

              {/* Perspective */}
              <td className="border border-border px-3 py-2 text-xs text-white bg-slate-700 text-center wrap-break-word">
                <CellValue value={answerSpecs.perspective.length > 0 ? answerSpecs.perspective : null} />
              </td>
            </tr>
          ) : (
            <>
              {/* Guess rows with hint inserted at correct position */}
              {reversedGuesses.map((guess, index) => (
                <Fragment key={`${guess.gameId}-${index}`}>
                  {/* Insert hint row before this guess if this is the correct position */}
                  {revealedClue && index === hintInsertIndex && renderHintRow(revealedClue)}
                  <tr>
                    {/* Summary (cover art with blue banner) */}
                    <td className="border border-border p-0 w-32">
                      <div className="relative w-32 h-44">
                        {guess.imageUrl ? (
                          <>
                            <Image
                              src={guess.imageUrl}
                              alt={guess.gameName}
                              className="w-full h-full object-cover"
                              width={128}
                              height={176}
                              sizes="100vw"
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-blue-600 px-2 py-1">
                              <p className="text-xs font-semibold text-white truncate text-center">
                                {guess.gameName}
                              </p>
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full bg-muted flex flex-col items-center justify-center">
                            <span className="text-xs text-muted-foreground">No image</span>
                            <div className="absolute bottom-0 left-0 right-0 bg-blue-600 px-2 py-1">
                              <p className="text-xs font-semibold text-white truncate text-center">
                                {guess.gameName}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Platforms */}
                    <td
                      className={cn(
                        'border border-border px-3 py-2 text-xs text-white text-center wrap-break-word',
                        getCellColor(guess.matches.platforms.type, hasData(guess.matches.platforms.value))
                      )}
                    >
                      <CellValue value={guess.matches.platforms.value} />
                    </td>

                    {/* Genres */}
                    <td
                      className={cn(
                        'border border-border px-3 py-2 text-xs text-white text-center wrap-break-word',
                        getCellColor(guess.matches.genres.type, hasData(guess.matches.genres.value))
                      )}
                    >
                      <CellValue value={guess.matches.genres.value} />
                    </td>

                    {/* Themes */}
                    <td
                      className={cn(
                        'border border-border px-3 py-2 text-xs text-white text-center wrap-break-word',
                        getCellColor(guess.matches.themes.type, hasData(guess.matches.themes.value))
                      )}
                    >
                      <CellValue value={guess.matches.themes.value} />
                    </td>

                    {/* Release Date */}
                    <td
                      className={cn(
                        'border border-border px-3 py-2 text-xs text-white relative text-center',
                        getCellColor(guess.matches.releaseDate.type, hasData(guess.matches.releaseDate.value))
                      )}
                    >
                      {(() => {
                        const arrow = getYearArrow(
                          typeof guess.matches.releaseDate.value === 'string' ? guess.matches.releaseDate.value : null,
                          answerSpecs?.releaseDate || null
                        );
                        return (
                          <>
                            {arrow && (
                              <div className="absolute inset-0 flex items-center justify-center opacity-40">
                                {arrow}
                              </div>
                            )}
                            <span className="relative z-10">
                              <CellValue value={guess.matches.releaseDate.value} />
                            </span>
                          </>
                        );
                      })()}
                    </td>

                    {/* Game Modes */}
                    <td
                      className={cn(
                        'border border-border px-3 py-2 text-xs text-white text-center wrap-break-word',
                        getCellColor(guess.matches.gameModes.type, hasData(guess.matches.gameModes.value))
                      )}
                    >
                      <CellValue value={guess.matches.gameModes.value} />
                    </td>

                    {/* Game Engines */}
                    <td
                      className={cn(
                        'border border-border px-3 py-2 text-xs text-white text-center wrap-break-word',
                        getCellColor(guess.matches.gameEngines.type, hasData(guess.matches.gameEngines.value))
                      )}
                    >
                      <CellValue value={guess.matches.gameEngines.value} />
                    </td>

                    {/* Publisher */}
                    <td
                      className={cn(
                        'border border-border px-3 py-2 text-xs text-white text-center wrap-break-word',
                        getCellColor(guess.matches.publisher.type, hasData(guess.matches.publisher.value))
                      )}
                    >
                      <CellValue value={guess.matches.publisher.value} />
                    </td>

                    {/* Perspective */}
                    <td
                      className={cn(
                        'border border-border px-3 py-2 text-xs text-white text-center wrap-break-word',
                        getCellColor(guess.matches.perspective.type, hasData(guess.matches.perspective.value))
                      )}
                    >
                      <CellValue value={guess.matches.perspective.value} />
                    </td>
                  </tr>
                </Fragment>
              ))}

              {/* Insert hint row at the end if no guesses were made when it was revealed */}
              {revealedClue && hintInsertIndex === reversedGuesses.length && renderHintRow(revealedClue)}
            </>
          )}
        </tbody>
      </table>
    </div>
  );
}
