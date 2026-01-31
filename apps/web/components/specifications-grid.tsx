import { ReactNode, Fragment } from 'react';
import { cn } from '@/lib/utils';
import type { SpecificationGuess, RevealedClue, Game, CellMatch } from '@gaeldle/types/game';
import Image from 'next/image';
import { MoveUp, MoveDown, MoveRight } from 'lucide-react';

interface SpecificationsGridProps {
  guesses: SpecificationGuess[];
  revealedClue?: RevealedClue | null;
  targetGame?: Game | null;
  showAnswerOnly?: boolean;
  className?: string;
}

type CellValue = string | string[] | null

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

type MatchKey = keyof SpecificationGuess['matches'];

const MATCH_COLUMNS: Array<{ key: MatchKey; isReleaseDate?: boolean }> = [
  { key: 'platforms' },
  { key: 'genres' },
  { key: 'themes' },
  { key: 'releaseDate', isReleaseDate: true },
  { key: 'gameModes' },
  { key: 'gameEngines' },
  { key: 'publisher' },
  { key: 'perspective' },
];

function getCellColor(matchType: 'exact' | 'partial' | 'none', hasData: boolean): string {
  // If there's no data, use dark slate background
  if (!hasData) {
    return 'bg-muted/70 text-foreground';
  }

  switch (matchType) {
    case 'exact':
      return 'bg-green-500 text-white';
    case 'partial':
      return 'bg-yellow-500 text-white';
    case 'none':
      return 'bg-destructive text-white';
  }
}

function CellValue({ value }: Readonly<{ value: CellValue }>) {
  if (!value) return <>No data</>;
  if (Array.isArray(value)) {
    if (value.length === 0) return <>No data</>;
    return (
      <div className="flex flex-col gap-0.5">
        {value.map((item, idx) => (
          <div key={`key-${idx + 1}`}>{item}</div>
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
  if (revealedClue?.field === field) {
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
    <tr key="hint-row" className="bg-muted/70 text-center">
      <td className="border border-border px-3 py-2 text-xs w-32 text-foreground">
        <div className="flex gap-1 items-center justify-center">
          <p className="font-semibold">Hint</p>
          <MoveRight className="size-4" />
        </div>
      </td>
      {COLUMN_HEADERS.slice(1).map((header) => (
        <td
          key={header.key}
          className={cn(
            'border border-border px-3 py-2 text-xs text-foreground',
            revealedClue.field === header.key && 'bg-primary/20 font-semibold text-foreground'
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

  const guessYearNum = Number.parseInt(guessYear, 10);
  const targetYearNum = Number.parseInt(targetYear, 10);

  if (Number.isNaN(guessYearNum) || Number.isNaN(targetYearNum)) return null;

  if (guessYearNum < targetYearNum) {
    return <MoveUp className="w-16 h-32 text-white" strokeWidth={2} />;
  }
  if (guessYearNum > targetYearNum) {
    return <MoveDown className="w-16 h-32 text-white" strokeWidth={2} />;
  }
  return null; // Equal, no arrow
}

function ImageCell({ imageUrl, name }: Readonly<{ imageUrl: string | null; name: string }>) {
  return (
    <td className="border border-border p-0 w-32">
      <div className="relative w-32 h-44">
        {imageUrl ? (
          <>
            <Image
              src={imageUrl}
              alt={name}
              className="w-full h-full object-cover"
              width={128}
              height={176}
              sizes="100vw"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-primary/90 px-2 py-1">
              <p className="text-xs font-semibold text-primary-foreground truncate text-center">
                {name}
              </p>
            </div>
          </>
        ) : (
          <div className="w-full h-full bg-muted flex flex-col items-center justify-center">
            <span className="text-xs text-muted-foreground">No image</span>
            <div className="absolute bottom-0 left-0 right-0 bg-primary/90 px-2 py-1">
              <p className="text-xs font-semibold text-primary-foreground truncate text-center">
                {name}
              </p>
            </div>
          </div>
        )}
      </div>
    </td>
  );
}

function ReleaseDateCell({
  match,
  targetYear,
}: Readonly<{ match: CellMatch; targetYear: string | null }>) {
  const arrow = getYearArrow(
    typeof match.value === 'string' ? match.value : null,
    targetYear
  );

  return (
    <td
      className={cn(
        'border border-border px-3 py-2 text-xs relative text-center',
        getCellColor(match.type, hasData(match.value))
      )}
    >
      {arrow && (
        <div className="absolute inset-0 flex items-center justify-center opacity-40">
          {arrow}
        </div>
      )}
      <span className="relative z-10">
        <CellValue value={match.value} />
      </span>
    </td>
  );
}

function MatchCell({ match }: Readonly<{ match: CellMatch }>) {
  return (
    <td
      className={cn(
        'border border-border px-3 py-2 text-xs text-center wrap-break-word',
        getCellColor(match.type, hasData(match.value))
      )}
    >
      <CellValue value={match.value} />
    </td>
  );
}

function AnswerCell({ value }: Readonly<{ value: string | string[] | null }>) {
  return (
    <td className="border border-border px-3 py-2 text-xs text-foreground bg-muted/70 text-center wrap-break-word">
      <CellValue value={value} />
    </td>
  );
}

function getAnswerSpecs(targetGame?: Game | null) {
  if (!targetGame) return null;

  return {
    platforms: extractArray(targetGame.platforms),
    genres: extractArray(targetGame.genres),
    themes: extractArray(targetGame.themes),
    releaseDate: extractReleaseYear(targetGame.firstReleaseDate),
    gameModes: extractArray(targetGame.game_modes),
    gameEngines: extractArray(targetGame.game_engines),
    publisher: extractPublisher(targetGame.involved_companies),
    perspective: extractArray(targetGame.player_perspectives),
  };
}

function getBestMatches(
  guesses: SpecificationGuess[],
  revealedClue?: RevealedClue | null,
  showAnswerOnly?: boolean
) {
  if (showAnswerOnly) return null;

  return {
    platforms: getBestMatch(guesses, 'platforms', revealedClue),
    genres: getBestMatch(guesses, 'genres', revealedClue),
    themes: getBestMatch(guesses, 'themes', revealedClue),
    releaseDate: getBestMatch(guesses, 'releaseDate', revealedClue),
    gameModes: getBestMatch(guesses, 'gameModes', revealedClue),
    gameEngines: getBestMatch(guesses, 'gameEngines', revealedClue),
    publisher: getBestMatch(guesses, 'publisher', revealedClue),
    perspective: getBestMatch(guesses, 'perspective', revealedClue),
  };
}

function SummaryRow({
  bestMatches,
  targetYear,
}: Readonly<{
  bestMatches: Record<MatchKey, CellMatch>;
  targetYear: string | null;
}>) {
  return (
    <tr>
      <th className="border border-border bg-secondary px-3 py-2 text-sm font-semibold text-white text-center w-32">
        Summary
      </th>
      {MATCH_COLUMNS.map((column) =>
        column.isReleaseDate ? (
          <ReleaseDateCell
            key={column.key}
            match={bestMatches[column.key]}
            targetYear={targetYear}
          />
        ) : (
          <MatchCell key={column.key} match={bestMatches[column.key]} />
        )
      )}
    </tr>
  );
}

function HeaderRow() {
  return (
    <tr>
      {COLUMN_HEADERS.map((header) => (
        <th
          key={header.key}
          className={cn(
            'border border-border bg-slate-700 px-3 py-2 text-sm font-semibold text-slate-100',
            'text-center min-w-30'
          )}
        >
          {header.label}
        </th>
      ))}
    </tr>
  );
}

function AnswerRow({
  answerSpecs,
  targetGame,
}: Readonly<{
  answerSpecs: NonNullable<ReturnType<typeof getAnswerSpecs>>;
  targetGame: Game;
}>) {
  return (
    <tr>
      <ImageCell imageUrl={targetGame.imageUrl || null} name={targetGame.name} />
      <AnswerCell value={answerSpecs.platforms.length > 0 ? answerSpecs.platforms : null} />
      <AnswerCell value={answerSpecs.genres.length > 0 ? answerSpecs.genres : null} />
      <AnswerCell value={answerSpecs.themes.length > 0 ? answerSpecs.themes : null} />
      <AnswerCell value={answerSpecs.releaseDate} />
      <AnswerCell value={answerSpecs.gameModes.length > 0 ? answerSpecs.gameModes : null} />
      <AnswerCell value={answerSpecs.gameEngines.length > 0 ? answerSpecs.gameEngines : null} />
      <AnswerCell value={answerSpecs.publisher} />
      <AnswerCell value={answerSpecs.perspective.length > 0 ? answerSpecs.perspective : null} />
    </tr>
  );
}

function GuessRows({
  guesses,
  revealedClue,
  hintInsertIndex,
  targetYear,
}: Readonly<{
  guesses: SpecificationGuess[];
  revealedClue?: RevealedClue | null;
  hintInsertIndex: number;
  targetYear: string | null;
}>) {
  return (
    <>
      {guesses.map((guess, index) => (
        <Fragment key={`${guess.gameId}-${index}`}>
          {revealedClue && index === hintInsertIndex && renderHintRow(revealedClue)}
          <tr>
            <ImageCell imageUrl={guess.imageUrl} name={guess.gameName} />
            {MATCH_COLUMNS.map((column) =>
              column.isReleaseDate ? (
                <ReleaseDateCell
                  key={column.key}
                  match={guess.matches[column.key]}
                  targetYear={targetYear}
                />
              ) : (
                <MatchCell key={column.key} match={guess.matches[column.key]} />
              )
            )}
          </tr>
        </Fragment>
      ))}
      {revealedClue && hintInsertIndex === guesses.length && renderHintRow(revealedClue)}
    </>
  );
}

export default function SpecificationsGrid({
  guesses,
  revealedClue,
  targetGame,
  showAnswerOnly = false,
  className
}: Readonly<SpecificationsGridProps>) {
  // Reverse guesses to show newest first
  const reversedGuesses = [...guesses].reverse();

  // Calculate where to insert the hint row (if revealed)
  // If hint was revealed after N guesses, it should appear after the Nth guess from the end
  const hintInsertIndex = revealedClue
    ? guesses.length - revealedClue.revealedAtGuessCount
    : -1;

  const answerSpecs = getAnswerSpecs(targetGame);
  const bestMatches = getBestMatches(guesses, revealedClue, showAnswerOnly);
  const showHeaders = guesses.length > 0 || showAnswerOnly || bestMatches;

  return (
    <div className={cn('overflow-x-auto w-full', className)}>
      <table className="w-full border-collapse min-w-max">
        <thead>
          {bestMatches && (
            <SummaryRow bestMatches={bestMatches} targetYear={answerSpecs?.releaseDate || null} />
          )}
          {showHeaders && <HeaderRow />}
        </thead>
        <tbody>
          {showAnswerOnly && answerSpecs && targetGame ? (
            <AnswerRow answerSpecs={answerSpecs} targetGame={targetGame} />
          ) : (
            <GuessRows
              guesses={reversedGuesses}
              revealedClue={revealedClue}
              hintInsertIndex={hintInsertIndex}
              targetYear={answerSpecs?.releaseDate || null}
            />
          )}
        </tbody>
      </table>
    </div>
  );
}
