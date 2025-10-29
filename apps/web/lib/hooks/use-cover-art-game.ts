'use client';

import { useState, useEffect, useCallback } from 'react';
import { getAllGames, getRandomGame } from '@/lib/services/game.service';
import { getPixelSizeForAttempt } from '@/lib/utils/pixelate';
import type { Game, CoverArtMode } from '@/lib/types/game';

export const MAX_ATTEMPTS = 5;

interface UseCoverArtGameProps {
  mode: CoverArtMode;
}

export function useCoverArtGame({ mode }: UseCoverArtGameProps) {
  const [allGames, setAllGames] = useState<Game[]>([]);
  const [targetGame, setTargetGame] = useState<Game | null>(null);
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);
  const [wrongGuesses, setWrongGuesses] = useState<Game[]>([]);
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_ATTEMPTS);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPixelSize, setCurrentPixelSize] = useState(
    getPixelSizeForAttempt(0, MAX_ATTEMPTS)
  );

  // Load all games on mount
  useEffect(() => {
    async function loadGames() {
      try {
        setIsLoading(true);
        console.log('Fetching all games...');
        const games = await getAllGames();
        console.log('Fetched games:', games.length);
        setAllGames(games);

        // Get a random game for the answer
        console.log('Fetching random game...');
        const randomGame = await getRandomGame();
        console.log('Random game:', randomGame);
        setTargetGame(randomGame);
      } catch (err) {
        console.error('Error loading games:', err);
        setError(err instanceof Error ? err.message : 'Failed to load games');
      } finally {
        setIsLoading(false);
      }
    }

    loadGames();
  }, []);

  // Update pixel size when attempts change (only for cover-art mode)
  useEffect(() => {
    if (mode === 'cover-art') {
      const wrongAttempts = MAX_ATTEMPTS - attemptsLeft;
      setCurrentPixelSize(getPixelSizeForAttempt(wrongAttempts, MAX_ATTEMPTS));
    }
  }, [attemptsLeft, mode]);

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

    // Check if the selected game is correct
    if (selectedGameId === targetGame.id) {
      setIsCorrect(true);
      setIsGameOver(true);
    } else {
      // Wrong answer - store full game object
      setWrongGuesses((prev) => [...prev, selectedGame]);
      setAttemptsLeft((prev) => prev - 1);

      // Check if game is over
      if (attemptsLeft - 1 <= 0) {
        setIsGameOver(true);
      }
    }

    // Reset selection
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
      setCurrentPixelSize(getPixelSizeForAttempt(0, MAX_ATTEMPTS));

      // Get a new random game
      const randomGame = await getRandomGame();
      setTargetGame(randomGame);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset game');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    // Game state
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

    // Actions
    handleSelectGame,
    clearSelection,
    handleSubmit,
    resetGame,
  };
}
