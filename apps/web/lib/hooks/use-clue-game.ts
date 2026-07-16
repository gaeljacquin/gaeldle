'use client';

import { useState, useCallback, useMemo } from 'react';
import { useSuspenseQuery, useQueryClient } from '@tanstack/react-query';
import {
  getRandomGame,
  randomGameQueryOptions,
} from '@/lib/services/game.service';
import type { Game } from '@workspace/api-contract';
import { getFriendlyErrorMessage } from '@workspace/ui/lib/utils';
import { gameModeSlugQueryOptions } from '@/lib/services/game-mode.service';
import {
  extractArray,
  extractPublisher,
  extractReleaseYear,
} from '@workspace/shared';

export interface RevealedHint {
  type: 'releaseDate' | 'genres' | 'platforms' | 'publisher';
  label: string;
  value: string;
}

export function useClueGame() {
  const { data: gameMode } = useSuspenseQuery(gameModeSlugQueryOptions('clue'));
  const maxAttempts = gameMode.maxAttempts;
  const queryClient = useQueryClient();
  const queryKey = useMemo(
    () => ['randomGame', { excludeIds: [], mode: 'clue' }],
    [],
  );

  const { data: initialTarget } = useSuspenseQuery(
    randomGameQueryOptions([], 'clue'),
  );

  const [prevGameId, setPrevGameId] = useState<number>(initialTarget.id);
  const [targetGame, setTargetGame] = useState<Game>(initialTarget);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [wrongGuesses, setWrongGuesses] = useState<(Game | null)[]>([]);
  const [attemptsLeft, setAttemptsLeft] = useState(maxAttempts);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revealedHints, setRevealedHints] = useState<RevealedHint[]>([]);

  // Sync state if initialTarget changes
  if (initialTarget.id !== prevGameId) {
    setPrevGameId(initialTarget.id);
    setTargetGame(initialTarget);
  }

  const handleSelectGame = useCallback((game: Game | number | null) => {
    if (game === null) {
      setSelectedGame(null);
      return;
    }
    if (typeof game === 'number') {
      return;
    }
    setSelectedGame(game);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedGame(null);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!targetGame || !selectedGame || isGameOver) {
      return;
    }

    if (selectedGame.id === targetGame.id) {
      setIsCorrect(true);
      setIsGameOver(true);
    } else {
      setWrongGuesses((prev) => [...prev, selectedGame]);
      setAttemptsLeft((prev) => prev - 1);

      if (attemptsLeft - 1 <= 0) {
        setIsGameOver(true);
      }
    }
    setSelectedGame(null);
  }, [targetGame, selectedGame, isGameOver, attemptsLeft]);

  const handleSkip = useCallback(() => {
    if (!targetGame || isGameOver) {
      return;
    }

    setWrongGuesses((prev) => [...prev, null]);
    setAttemptsLeft((prev) => prev - 1);

    if (attemptsLeft - 1 <= 0) {
      setIsGameOver(true);
    }
  }, [targetGame, isGameOver, attemptsLeft]);

  const revealHint = useCallback(() => {
    if (!targetGame || isGameOver || attemptsLeft <= 1) {
      return;
    }

    // Determine which hint types are not yet revealed and have a valid value
    const hintCandidates: RevealedHint[] = [];

    // 1. Release Year
    const year = extractReleaseYear(targetGame.firstReleaseDate);
    if (year && !revealedHints.some((h) => h.type === 'releaseDate')) {
      hintCandidates.push({
        type: 'releaseDate',
        label: 'Release Year',
        value: String(year),
      });
    }

    // 2. Genres
    const genres = extractArray(targetGame.genres);
    if (genres.length > 0 && !revealedHints.some((h) => h.type === 'genres')) {
      hintCandidates.push({
        type: 'genres',
        label: 'Genres',
        value: genres.join(', '),
      });
    }

    // 3. Platforms
    const platforms = extractArray(targetGame.platforms);
    if (
      platforms.length > 0 &&
      !revealedHints.some((h) => h.type === 'platforms')
    ) {
      hintCandidates.push({
        type: 'platforms',
        label: 'Platforms',
        value: platforms.join(', '),
      });
    }

    // 4. Publisher
    const publisher = extractPublisher(targetGame.involvedCompanies);
    if (publisher && !revealedHints.some((h) => h.type === 'publisher')) {
      hintCandidates.push({
        type: 'publisher',
        label: 'Publisher',
        value: publisher,
      });
    }

    if (hintCandidates.length === 0) {
      return; // No hints left to reveal
    }

    const randomHint =
      hintCandidates[Math.floor(Math.random() * hintCandidates.length)];

    setRevealedHints((prev) => [...prev, randomHint]);
    setAttemptsLeft((prev) => prev - 1);

    if (attemptsLeft - 1 <= 0) {
      setIsGameOver(true);
    }
  }, [targetGame, isGameOver, attemptsLeft, revealedHints]);

  const resetGame = useCallback(async () => {
    try {
      setIsLoading(true);
      setWrongGuesses([]);
      setAttemptsLeft(maxAttempts);
      setIsGameOver(false);
      setIsCorrect(false);
      setSelectedGame(null);
      setRevealedHints([]);

      const randomGame = await getRandomGame([], 'clue');
      setTargetGame(randomGame);

      // Update query cache so that remounts use the reset game
      queryClient.setQueryData(queryKey, randomGame);
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Failed to reset game'));
    } finally {
      setIsLoading(false);
    }
  }, [queryClient, queryKey, maxAttempts]);

  const adjustAttempts = useCallback(
    (delta: number) => {
      setAttemptsLeft((prev) => {
        const newValue = prev + delta;

        if (newValue < 1 || newValue > maxAttempts) {
          return prev;
        }

        return newValue;
      });
    },
    [maxAttempts],
  );

  return {
    targetGame,
    selectedGame,
    wrongGuesses,
    attemptsLeft,
    isGameOver,
    isCorrect,
    isLoading,
    error,
    revealedHints,
    handleSelectGame,
    clearSelection,
    handleSubmit,
    handleSkip,
    revealHint,
    resetGame,
    adjustAttempts,
  };
}
