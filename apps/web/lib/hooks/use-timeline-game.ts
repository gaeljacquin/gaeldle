'use client';

import { useState, useEffect, useCallback } from 'react';
import { getRandomGames } from '@/lib/services/game.service';
import type { Game } from '@workspace/api-contract';
import { getFriendlyErrorMessage } from '@workspace/ui/lib/utils';
import { TIMELINE_GAMES_COUNT, TIMELINE_MAX_ATTEMPTS } from '@workspace/shared';

export function useTimelineGame() {
  const [selectedGames, setSelectedGames] = useState<Game[]>([]);
  const [userOrder, setUserOrder] = useState<Game[]>([]);
  const [savedOrder, setSavedOrder] = useState<Game[]>([]);
  const [correctGameIds, setCorrectGameIds] = useState<Set<number>>(new Set());
  const [correctPositionMap, setCorrectPositionMap] = useState<
    Map<number, number>
  >(new Map()); // position → correct game ID
  const [attemptsLeft, setAttemptsLeft] = useState(TIMELINE_MAX_ATTEMPTS);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isWinner, setIsWinner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    async function loadGames() {
      try {
        setIsLoading(true);
        const selected = await getRandomGames(
          TIMELINE_GAMES_COUNT,
          [],
          'timeline',
        );

        // Set all derived state in one update to avoid a visible re-shuffle
        setSelectedGames(selected);
        setUserOrder(selected);
        setSavedOrder(selected);
      } catch (err) {
        console.error('Error loading games:', err);
        setError(getFriendlyErrorMessage(err, 'Failed to load games'));
      } finally {
        setIsLoading(false);
      }
    }

    loadGames();
  }, []);

  const handleReorder = useCallback((newOrder: Game[]) => {
    setUserOrder(newOrder);
  }, []);

  const handleSubmit = useCallback(() => {
    if (isGameOver || selectedGames.length === 0) {
      return;
    }

    const correctOrder = [...selectedGames].sort((a, b) => {
      const dateA = a.firstReleaseDate || 0;
      const dateB = b.firstReleaseDate || 0;

      return dateA - dateB;
    });

    const newCorrectGameIds = new Set<number>();
    const newCorrectPositionMap = new Map<number, number>();
    let allCorrect = true;

    userOrder.forEach((game, index) => {
      if (game.id === correctOrder[index].id) {
        newCorrectGameIds.add(game.id);
        newCorrectPositionMap.set(index, game.id);
      } else {
        allCorrect = false;
      }
    });

    setCorrectGameIds(newCorrectGameIds);
    setCorrectPositionMap(newCorrectPositionMap);
    setHasSubmitted(true);
    setSavedOrder([...userOrder]);

    if (allCorrect) {
      setIsWinner(true);
      setIsGameOver(true);
    } else {
      const newAttemptsLeft = attemptsLeft - 1;

      setAttemptsLeft(newAttemptsLeft);

      if (newAttemptsLeft <= 0) {
        setIsGameOver(true);
      }
    }
  }, [userOrder, selectedGames, attemptsLeft, isGameOver]);

  const handleResetToSaved = useCallback(() => {
    if (isGameOver) {
      return;
    }

    setUserOrder([...savedOrder]);
  }, [savedOrder, isGameOver]);

  const isOrderSameAsSaved = useCallback(() => {
    if (userOrder.length !== savedOrder.length) {
      return false;
    }

    return userOrder.every((game, index) => game.id === savedOrder[index].id);
  }, [userOrder, savedOrder]);

  const resetGame = useCallback(async () => {
    try {
      setIsLoading(true);
      setHasSubmitted(false);
      setCorrectGameIds(new Set());
      setCorrectPositionMap(new Map());
      setAttemptsLeft(TIMELINE_MAX_ATTEMPTS);
      setIsGameOver(false);
      setIsWinner(false);

      const selected = await getRandomGames(
        TIMELINE_GAMES_COUNT,
        [],
        'timeline',
      );

      setSelectedGames(selected);
      setUserOrder(selected);
      setSavedOrder(selected);
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Failed to reset game'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get correct order for display
  const getCorrectOrder = useCallback(() => {
    return [...selectedGames].sort((a, b) => {
      const dateA = a.firstReleaseDate || 0;
      const dateB = b.firstReleaseDate || 0;

      return dateA - dateB;
    });
  }, [selectedGames]);

  const adjustAttempts = useCallback((delta: number) => {
    setAttemptsLeft((prev) => {
      const newValue = prev + delta;

      if (newValue < 1 || newValue > TIMELINE_MAX_ATTEMPTS) {
        return prev;
      }

      return newValue;
    });
  }, []);

  return {
    userOrder,
    correctGameIds,
    correctPositionMap,
    attemptsLeft,
    isGameOver,
    isWinner,
    isLoading,
    error,
    hasSubmitted,
    handleReorder,
    handleSubmit,
    handleResetToSaved,
    isOrderSameAsSaved,
    resetGame,
    getCorrectOrder,
    adjustAttempts,
  };
}
