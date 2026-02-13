'use client';

import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query'; // Import from TanStack Query
import { getPixelSizeForAttempt } from '@/lib/utils/pixelate';
import { orpc } from '@/lib/orpc';
import type { CoverArtModeSlug, Game, ArtworkImage } from '@gaeldle/api-contract';

export const MAX_ATTEMPTS = 5;

// Helper to pick a random artwork from the artworks array
function getRandomArtwork(artworks: unknown): string | null {
  if (!artworks || !Array.isArray(artworks) || artworks.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * artworks.length);
  const artwork = artworks[randomIndex] as ArtworkImage;
  return artwork.url || null;
}

export function useCoverArtGame(mode: CoverArtModeSlug) {
  // Use oRPC with TanStack Query's useQuery hook
  const { data: allGamesData, isLoading: isLoadingAll } = useQuery(
    orpc.games.list.queryOptions({
      input: undefined, // list() takes optional input
      select: (res) => res.data,
    })
  );

  const {
    data: targetGameData,
    isLoading: isLoadingTarget,
    refetch: refetchTarget,
    isRefetching: isRefetchingTarget
  } = useQuery(
    orpc.games.getRandom.queryOptions({
      input: { excludeIds: [], mode },
      select: (res) => res.data,
      enabled: true,
      staleTime: 0, // Ensure we can get a new one on reset
    })
  );

  const allGames = useMemo(() => allGamesData ?? [], [allGamesData]);
  const targetGame = targetGameData ?? null;

  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);
  const [wrongGuesses, setWrongGuesses] = useState<Game[]>([]);
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_ATTEMPTS);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const currentPixelSize = getPixelSizeForAttempt(MAX_ATTEMPTS - attemptsLeft, MAX_ATTEMPTS);

  const selectedArtworkUrl = useMemo(() => {
    if (mode === 'artwork' && targetGame) {
      return getRandomArtwork(targetGame.artworks);
    }
    return null;
  }, [mode, targetGame]);

  const isLoading = isLoadingAll || isLoadingTarget || isRefetchingTarget;

  const handleSelectGame = useCallback((gameId: number) => {
    setSelectedGameId(gameId);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedGameId(null);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!targetGame || selectedGameId === null || isGameOver) return;

    const selectedGame = allGames.find(g => g.id === selectedGameId);
    if (!selectedGame) return;

    if (selectedGameId === targetGame.id) {
      setIsCorrect(true);
      setIsGameOver(true);
    } else {
      setWrongGuesses((prev) => [...prev, selectedGame]);
      setAttemptsLeft((prev) => prev - 1);
      if (attemptsLeft - 1 <= 0) {
        setIsGameOver(true);
      }
    }
    setSelectedGameId(null);
  }, [targetGame, selectedGameId, isGameOver, attemptsLeft, allGames]);

  const resetGame = useCallback(async () => {
    setWrongGuesses([]);
    setAttemptsLeft(MAX_ATTEMPTS);
    setIsGameOver(false);
    setIsCorrect(false);
    setSelectedGameId(null);
    await refetchTarget();
  }, [refetchTarget]);

  const adjustAttempts = useCallback((delta: number) => {
    setAttemptsLeft(prev => {
      const newValue = prev + delta;
      if (newValue < 1 || newValue > MAX_ATTEMPTS) return prev;
      return newValue;
    });
  }, []);

  return {
    allGames,
    targetGame,
    selectedGameId,
    wrongGuesses,
    attemptsLeft,
    isGameOver,
    isCorrect,
    isLoading,
    error: null, // TanStack Query handles error state
    currentPixelSize,
    selectedArtworkUrl,
    handleSelectGame,
    clearSelection,
    handleSubmit,
    resetGame,
    adjustAttempts,
  };
}
