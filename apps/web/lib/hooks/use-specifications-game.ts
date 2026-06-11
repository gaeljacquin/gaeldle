'use client';

import { useState, useEffect, useCallback } from 'react';
import { getRandomGame } from '@/lib/services/game.service';
import type {
  Game,
  SpecificationGuess,
  RevealedClue,
  MatchType,
} from '@workspace/api-contract';
import { getFriendlyErrorMessage } from '@workspace/ui/lib/utils';
import {
  extractArray,
  extractPublisher,
  extractReleaseYear,
  SPECIFICATIONS_MAX_ATTEMPTS,
} from '@workspace/shared';

function compareArrays(target: string[], guess: string[]): MatchType {
  if (!target.length && !guess.length) {
    return 'exact';
  }

  if (!target.length || !guess.length) {
    return 'none';
  }

  const targetSet = new Set(target.map((s) => s.toLowerCase()));
  const guessSet = new Set(guess.map((s) => s.toLowerCase()));

  if (
    targetSet.size === guessSet.size &&
    [...targetSet].every((item) => guessSet.has(item))
  ) {
    return 'exact';
  }

  const hasOverlap = [...targetSet].some((item) => guessSet.has(item));

  return hasOverlap ? 'partial' : 'none';
}

// Compare specification fields
function compareGames(
  target: Game,
  guess: Game,
): SpecificationGuess['matches'] {
  const targetPlatforms = extractArray(target.platforms);
  const guessPlatforms = extractArray(guess.platforms);

  const targetGenres = extractArray(target.genres);
  const guessGenres = extractArray(guess.genres);

  const targetThemes = extractArray(target.themes);
  const guessThemes = extractArray(guess.themes);

  const targetYear = extractReleaseYear(target.firstReleaseDate);
  const guessYear = extractReleaseYear(guess.firstReleaseDate);

  const targetGameModes = extractArray(target.gameModes);
  const guessGameModes = extractArray(guess.gameModes);

  const targetEngines = extractArray(target.gameEngines);
  const guessEngines = extractArray(guess.gameEngines);

  const targetPublisher = extractPublisher(target.involvedCompanies);
  const guessPublisher = extractPublisher(guess.involvedCompanies);

  const targetPerspective = extractArray(target.playerPerspectives);
  const guessPerspective = extractArray(guess.playerPerspectives);

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
      type:
        targetPublisher?.toLowerCase() === guessPublisher?.toLowerCase()
          ? 'exact'
          : 'none',
      value: guessPublisher,
    },
    perspective: {
      type: compareArrays(targetPerspective, guessPerspective),
      value: guessPerspective.length > 0 ? guessPerspective : null,
    },
  };
}

export function useSpecificationsGame() {
  const [targetGame, setTargetGame] = useState<Game | null>(null);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [guesses, setGuesses] = useState<SpecificationGuess[]>([]);
  const [attemptsLeft, setAttemptsLeft] = useState(SPECIFICATIONS_MAX_ATTEMPTS);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revealedClue, setRevealedClue] = useState<RevealedClue | null>(null);

  useEffect(() => {
    async function loadTarget() {
      try {
        setIsLoading(true);
        const randomGame = await getRandomGame([], 'specifications');
        setTargetGame(randomGame);
      } catch (err) {
        console.error('Error loading target game:', err);
        setError(getFriendlyErrorMessage(err, 'Failed to load game'));
      } finally {
        setIsLoading(false);
      }
    }

    loadTarget();
  }, []);

  const handleSelectGame = useCallback((game: Game | number | null) => {
    if (game === null) {
      setSelectedGame(null);

      return;
    }

    if (typeof game === 'number') {
      // This is a fallback in case we only have the ID
      // We should ideally pass the whole object from the search results
      // For now, we'll just set it to null and let the UI handle it or fetch it
      // But we want to avoid getAllGames
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
      const matches = compareGames(targetGame, selectedGame);
      const newGuess: SpecificationGuess = {
        gameId: selectedGame.id,
        gameName: selectedGame.name,
        imageUrl: selectedGame.imageUrl,
        aiImageUrl: selectedGame.aiImageUrl,
        matches,
      };
      setGuesses((prev) => [...prev, newGuess]);
      setIsCorrect(true);
      setIsGameOver(true);
    } else {
      const matches = compareGames(targetGame, selectedGame);
      const newGuess: SpecificationGuess = {
        gameId: selectedGame.id,
        gameName: selectedGame.name,
        imageUrl: selectedGame.imageUrl,
        aiImageUrl: selectedGame.aiImageUrl,
        matches,
      };

      setGuesses((prev) => [...prev, newGuess]);
      setAttemptsLeft((prev) => prev - 1);

      if (attemptsLeft - 1 <= 0) {
        setIsGameOver(true);
      }
    }

    setSelectedGame(null);
  }, [targetGame, selectedGame, isGameOver, attemptsLeft]);

  const revealClue = useCallback(() => {
    if (!targetGame || revealedClue) {
      return;
    }

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

    const availableFields = fields.filter((field) => {
      if (guesses.length === 0) {
        return true;
      }

      const hasExactMatch = guesses.some(
        (guess) => guess.matches[field].type === 'exact',
      );

      return !hasExactMatch;
    });

    if (availableFields.length === 0) {
      return;
    }

    const randomField =
      availableFields[Math.floor(Math.random() * availableFields.length)];

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
        value = extractArray(targetGame.gameModes);
        break;
      case 'gameEngines':
        value = extractArray(targetGame.gameEngines);
        break;
      case 'publisher':
        value = extractPublisher(targetGame.involvedCompanies) || 'Unknown';
        break;
      case 'perspective':
        value = extractArray(targetGame.playerPerspectives);
        break;
      default:
        value = 'Unknown';
    }

    setRevealedClue({
      field: randomField,
      value,
      revealedAtGuessCount: guesses.length,
    });

    setAttemptsLeft((prev) => prev - 1);

    if (attemptsLeft - 1 <= 0) {
      setIsGameOver(true);
    }
  }, [targetGame, revealedClue, guesses, attemptsLeft]);

  const resetGame = useCallback(async () => {
    try {
      setIsLoading(true);
      setGuesses([]);
      setAttemptsLeft(SPECIFICATIONS_MAX_ATTEMPTS);
      setIsGameOver(false);
      setIsCorrect(false);
      setSelectedGame(null);
      setRevealedClue(null);

      const randomGame = await getRandomGame([], 'specifications');
      setTargetGame(randomGame);
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Failed to reset game'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const adjustAttempts = useCallback((delta: number) => {
    setAttemptsLeft((prev) => {
      const newValue = prev + delta;

      if (newValue < 1 || newValue > SPECIFICATIONS_MAX_ATTEMPTS) {
        return prev;
      }

      return newValue;
    });
  }, []);

  return {
    // Game state
    targetGame,
    selectedGame,
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
