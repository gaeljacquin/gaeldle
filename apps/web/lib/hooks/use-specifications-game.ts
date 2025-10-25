'use client';

import { useState, useEffect, useCallback } from 'react';
import { getAllGames, getRandomGame } from '@/lib/services/game.service';
import type { Game, SpecificationGuess, RevealedClue, MatchType } from '@/lib/types/game';

export const MAX_ATTEMPTS = 10;

// Helper to extract array from JSON field
function extractArray(data: unknown): string[] {
  if (!data) return [];
  if (Array.isArray(data)) {
    return data.map(item => {
      // If it's already a string, use it directly
      if (typeof item === 'string') {
        return item;
      }
      // If it's an object with a name property, extract the name
      if (typeof item === 'object' && item !== null && 'name' in item) {
        return (item as { name: string }).name;
      }
      // Otherwise convert to string
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

  const publisher = involved_companies.find((company: typeof involved_companies[number]) =>
    company?.publisher === true
  );

  if (publisher && typeof publisher === 'object') {
    // Check if there's a nested company object with name
    if ('company' in publisher) {
      const companyData = publisher.company;
      if (typeof companyData === 'object' && companyData !== null && 'name' in companyData) {
        return (companyData as { name: string }).name;
      }
    }
    // Check if the name is directly on the publisher object
    if ('name' in publisher) {
      return (publisher as { name: string }).name;
    }
  }

  return null;
}

// Compare two arrays and determine match type
function compareArrays(target: string[], guess: string[]): MatchType {
  if (!target.length && !guess.length) return 'exact';
  if (!target.length || !guess.length) return 'none';

  const targetSet = new Set(target.map(s => s.toLowerCase()));
  const guessSet = new Set(guess.map(s => s.toLowerCase()));

  // Check if they're exactly the same
  if (targetSet.size === guessSet.size &&
      [...targetSet].every(item => guessSet.has(item))) {
    return 'exact';
  }

  // Check if there's any overlap
  const hasOverlap = [...targetSet].some(item => guessSet.has(item));
  return hasOverlap ? 'partial' : 'none';
}

// Compare specification fields
function compareGames(target: Game, guess: Game): SpecificationGuess['matches'] {
  const targetPlatforms = extractArray(target.platforms);
  const guessPlatforms = extractArray(guess.platforms);

  const targetGenres = extractArray(target.genres);
  const guessGenres = extractArray(guess.genres);

  const targetThemes = extractArray(target.themes);
  const guessThemes = extractArray(guess.themes);

  const targetYear = extractReleaseYear(target.firstReleaseDate);
  const guessYear = extractReleaseYear(guess.firstReleaseDate);

  const targetGameModes = extractArray(target.game_modes);
  const guessGameModes = extractArray(guess.game_modes);

  const targetEngines = extractArray(target.game_engines);
  const guessEngines = extractArray(guess.game_engines);

  const targetPublisher = extractPublisher(target.involved_companies);
  const guessPublisher = extractPublisher(guess.involved_companies);

  const targetPerspective = extractArray(target.player_perspectives);
  const guessPerspective = extractArray(guess.player_perspectives);

  return {
    platforms: {
      type: compareArrays(targetPlatforms, guessPlatforms),
      value: guessPlatforms.length > 0 ? guessPlatforms : null,
    },
    genres: {
      type: compareArrays(targetGenres, guessGenres),
      value: guessGenres.length > 0 ? guessGenres : null,
    },
    themes: {
      type: compareArrays(targetThemes, guessThemes),
      value: guessThemes.length > 0 ? guessThemes : null,
    },
    releaseDate: {
      type: targetYear === guessYear ? 'exact' : 'none',
      value: guessYear,
    },
    gameModes: {
      type: compareArrays(targetGameModes, guessGameModes),
      value: guessGameModes.length > 0 ? guessGameModes : null,
    },
    gameEngines: {
      type: compareArrays(targetEngines, guessEngines),
      value: guessEngines.length > 0 ? guessEngines : null,
    },
    publisher: {
      type: targetPublisher?.toLowerCase() === guessPublisher?.toLowerCase() ? 'exact' : 'none',
      value: guessPublisher,
    },
    perspective: {
      type: compareArrays(targetPerspective, guessPerspective),
      value: guessPerspective.length > 0 ? guessPerspective : null,
    },
  };
}

export function useSpecificationsGame() {
  const [allGames, setAllGames] = useState<Game[]>([]);
  const [targetGame, setTargetGame] = useState<Game | null>(null);
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);
  const [guesses, setGuesses] = useState<SpecificationGuess[]>([]);
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_ATTEMPTS);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revealedClue, setRevealedClue] = useState<RevealedClue | null>(null);

  // Load all games on mount
  useEffect(() => {
    async function loadGames() {
      try {
        setIsLoading(true);
        const games = await getAllGames();
        setAllGames(games);

        // Get a random game for the answer
        const randomGame = await getRandomGame();
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
      const matches = compareGames(targetGame, selectedGame);
      const newGuess: SpecificationGuess = {
        gameId: selectedGame.id,
        gameName: selectedGame.name,
        imageUrl: selectedGame.imageUrl,
        matches,
      };
      setGuesses(prev => [...prev, newGuess]);
      setIsCorrect(true);
      setIsGameOver(true);
    } else {
      // Wrong answer - compare and add to guesses
      const matches = compareGames(targetGame, selectedGame);
      const newGuess: SpecificationGuess = {
        gameId: selectedGame.id,
        gameName: selectedGame.name,
        imageUrl: selectedGame.imageUrl,
        matches,
      };

      setGuesses(prev => [...prev, newGuess]);
      setAttemptsLeft(prev => prev - 1);

      // Check if game is over
      if (attemptsLeft - 1 <= 0) {
        setIsGameOver(true);
      }
    }

    // Reset selection
    setSelectedGameId(null);
  }, [targetGame, selectedGameId, isGameOver, attemptsLeft, allGames]);

  const revealClue = useCallback(() => {
    if (!targetGame || revealedClue) return;

    const fields: Array<keyof SpecificationGuess['matches']> = [
      'platforms',
      'genres',
      'themes',
      'releaseDate',
      'gameModes',
      'gameEngines',
      'publisher',
      'perspective',
    ];

    // Filter out fields that are already exact matches (green) in guesses
    const availableFields = fields.filter(field => {
      // If no guesses yet, all fields are available
      if (guesses.length === 0) return true;

      // Check if any guess has an exact match for this field
      const hasExactMatch = guesses.some(guess => guess.matches[field].type === 'exact');
      return !hasExactMatch;
    });

    // If all fields are already exact, don't reveal anything (shouldn't happen in normal gameplay)
    if (availableFields.length === 0) return;

    // Pick a random field from available fields
    const randomField = availableFields[Math.floor(Math.random() * availableFields.length)];

    let value: string | string[];
    switch (randomField) {
      case 'platforms':
        value = extractArray(targetGame.platforms);
        break;
      case 'genres':
        value = extractArray(targetGame.genres);
        break;
      case 'themes':
        value = extractArray(targetGame.themes);
        break;
      case 'releaseDate':
        value = extractReleaseYear(targetGame.firstReleaseDate) || 'Unknown';
        break;
      case 'gameModes':
        value = extractArray(targetGame.game_modes);
        break;
      case 'gameEngines':
        value = extractArray(targetGame.game_engines);
        break;
      case 'publisher':
        value = extractPublisher(targetGame.involved_companies) || 'Unknown';
        break;
      case 'perspective':
        value = extractArray(targetGame.player_perspectives);
        break;
      default:
        value = 'Unknown';
    }

    setRevealedClue({
      field: randomField,
      value,
      revealedAtGuessCount: guesses.length
    });

    // Revealing a hint costs 1 attempt
    setAttemptsLeft(prev => prev - 1);

    // Check if game is over after revealing hint
    if (attemptsLeft - 1 <= 0) {
      setIsGameOver(true);
    }
  }, [targetGame, revealedClue, guesses, attemptsLeft]);

  const resetGame = useCallback(async () => {
    try {
      setIsLoading(true);
      setGuesses([]);
      setAttemptsLeft(MAX_ATTEMPTS);
      setIsGameOver(false);
      setIsCorrect(false);
      setSelectedGameId(null);
      setRevealedClue(null);

      // Get a new random game
      const randomGame = await getRandomGame();
      setTargetGame(randomGame);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset game');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const adjustAttempts = useCallback((delta: number) => {
    setAttemptsLeft(prev => {
      const newValue = prev + delta;
      if (newValue < 1 || newValue > MAX_ATTEMPTS) return prev;
      return newValue;
    });
  }, []);

  return {
    // Game state
    allGames,
    targetGame,
    selectedGameId,
    guesses,
    attemptsLeft,
    isGameOver,
    isCorrect,
    isLoading,
    error,
    revealedClue,

    // Actions
    handleSelectGame,
    clearSelection,
    handleSubmit,
    revealClue,
    resetGame,
    adjustAttempts,
  };
}
