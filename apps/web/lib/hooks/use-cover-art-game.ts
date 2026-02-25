'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getPixelSizeForAttempt } from '@/lib/utils/pixelate';
import { getAllGames, getRandomGame } from '@/lib/services/game.service';
import type { CoverArtModeSlug, Game, ArtworkImage } from '@gaeldle/api-contract';

export const MAX_ATTEMPTS = 5;

function getRandomArtwork(artworks: unknown): string | null {
  if (!artworks || !Array.isArray(artworks) || artworks.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * artworks.length);
  const artwork = artworks[randomIndex] as ArtworkImage;
  return artwork.url || null;
}

export function useCoverArtGame(mode: CoverArtModeSlug) {
  const [allGames, setAllGames] = useState<Game[]>([]);
  const [targetGame, setTargetGame] = useState<Game | null>(null);
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);
  const [wrongGuesses, setWrongGuesses] = useState<Game[]>([]);
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_ATTEMPTS);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadGames() {
      try {
        setIsLoading(true);
        const [games, target] = await Promise.all([
          getAllGames(),
          getRandomGame([], mode),
        ]);
        setAllGames(games);
        setTargetGame(target);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load games');
      } finally {
        setIsLoading(false);
      }
    }

    loadGames();
  }, [mode]);

  const currentPixelSize = getPixelSizeForAttempt(MAX_ATTEMPTS - attemptsLeft, MAX_ATTEMPTS);

  const selectedArtworkUrl = useMemo(() => {
    if (mode === 'artwork' && targetGame) {
      return getRandomArtwork(targetGame.artworks);
    }
    return null;
  }, [mode, targetGame]);

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
    try {
      setIsLoading(true);
      setWrongGuesses([]);
      setAttemptsLeft(MAX_ATTEMPTS);
      setIsGameOver(false);
      setIsCorrect(false);
      setSelectedGameId(null);
      const target = await getRandomGame([], mode);
      setTargetGame(target);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset game');
    } finally {
      setIsLoading(false);
    }
  }, [mode]);

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
    error,
    currentPixelSize,
    selectedArtworkUrl,
    handleSelectGame,
    clearSelection,
    handleSubmit,
    resetGame,
    adjustAttempts,
  };
}
