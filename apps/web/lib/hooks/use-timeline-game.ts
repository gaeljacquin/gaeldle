'use client';

import { useState, useEffect, useCallback } from 'react';
import { getAllGames } from '@/lib/services/game.service';
import type { Game } from '@/lib/types/game';

export const MAX_ATTEMPTS = 3;
const GAMES_COUNT = 10;

export function useTimelineGame() {
  const [allGames, setAllGames] = useState<Game[]>([]);
  const [selectedGames, setSelectedGames] = useState<Game[]>([]);
  const [userOrder, setUserOrder] = useState<Game[]>([]);
  const [savedOrder, setSavedOrder] = useState<Game[]>([]); // Order at last submit (or initial)
  const [correctGameIds, setCorrectGameIds] = useState<Set<number>>(new Set()); // IDs of games that were correct
  const [correctPositionMap, setCorrectPositionMap] = useState<Map<number, number>>(new Map()); // position → correct game ID
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_ATTEMPTS);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isWinner, setIsWinner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Load games and select 10 random ones
  useEffect(() => {
    async function loadGames() {
      try {
        setIsLoading(true);
        const games = await getAllGames();

        // Filter games with release dates and shuffle
        const gamesWithDates = games.filter(g => g.firstReleaseDate !== null);
        const shuffled = [...gamesWithDates].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, GAMES_COUNT);

        setAllGames(games);
        setSelectedGames(selected);
        setUserOrder(selected);
        setSavedOrder(selected); // Set initial saved order
      } catch (err) {
        console.error('Error loading games:', err);
        setError(err instanceof Error ? err.message : 'Failed to load games');
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
    if (isGameOver || selectedGames.length === 0) return;

    // Sort selected games by release date to get correct order
    const correctOrder = [...selectedGames].sort((a, b) => {
      const dateA = a.firstReleaseDate || 0;
      const dateB = b.firstReleaseDate || 0;
      return dateA - dateB;
    });

    // Track which game IDs were correctly placed and their positions
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
    setSavedOrder([...userOrder]); // Save current order

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
    if (isGameOver) return;

    // Reset to saved order
    setUserOrder([...savedOrder]);
  }, [savedOrder, isGameOver]);

  // Check if current order matches saved order
  const isOrderSameAsSaved = useCallback(() => {
    if (userOrder.length !== savedOrder.length) return false;
    return userOrder.every((game, index) => game.id === savedOrder[index].id);
  }, [userOrder, savedOrder]);

  const resetGame = useCallback(async () => {
    try {
      setIsLoading(true);
      setHasSubmitted(false);
      setCorrectGameIds(new Set());
      setCorrectPositionMap(new Map());
      setAttemptsLeft(MAX_ATTEMPTS);
      setIsGameOver(false);
      setIsWinner(false);

      // Select new random games
      const gamesWithDates = allGames.filter(g => g.firstReleaseDate !== null);
      const shuffled = [...gamesWithDates].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, GAMES_COUNT);

      setSelectedGames(selected);
      setUserOrder(selected);
      setSavedOrder(selected); // Reset saved order
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset game');
    } finally {
      setIsLoading(false);
    }
  }, [allGames]);

  // Get correct order for display
  const getCorrectOrder = useCallback(() => {
    return [...selectedGames].sort((a, b) => {
      const dateA = a.firstReleaseDate || 0;
      const dateB = b.firstReleaseDate || 0;
      return dateA - dateB;
    });
  }, [selectedGames]);

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
  };
}
