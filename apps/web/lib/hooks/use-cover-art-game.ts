'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getPixelSizeForAttempt } from '@/lib/utils/pixelate';
import { getRandomGame } from '@/lib/services/game.service';
import type { Game, ArtworkImage } from '@workspace/api-contract';
import { getFriendlyErrorMessage } from '@workspace/ui/lib/utils';
import { COVER_ART_MAX_ATTEMPTS } from '@workspace/shared';

function getRandomArtwork(artworks: unknown): string | null {
  if (!artworks || !Array.isArray(artworks) || artworks.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * artworks.length);
  const artwork = artworks[randomIndex] as ArtworkImage;

  return artwork.url || null;
}

function selectRandomAiImage(
  target: Game | null,
): { url: string; prompt: string } | null {
  if (!target) {
    return null;
  }

  const imageGen = target.imageGen;

  if (Array.isArray(imageGen) && imageGen.length > 0) {
    const randomIndex = Math.floor(Math.random() * imageGen.length);
    const selectedObj = imageGen[randomIndex];

    if (selectedObj && typeof selectedObj === 'object') {
      const keys = Object.keys(selectedObj);

      if (keys.length > 0) {
        const styleKey = keys[0];
        const data = selectedObj[styleKey] as
          | { url?: string; prompt?: string; provider?: string }
          | null
          | undefined;

        if (data && typeof data === 'object' && data.url && data.prompt) {
          return {
            url: data.url,
            prompt: data.prompt,
          };
        }
      }
    }
  }

  if (target.aiImageUrl) {
    return {
      url: target.aiImageUrl,
      prompt: target.aiPrompt ?? '',
    };
  }

  return null;
}

export function useCoverArtGame(mode: string) {
  const [targetGame, setTargetGame] = useState<Game | null>(null);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [wrongGuesses, setWrongGuesses] = useState<(Game | null)[]>([]);
  const [attemptsLeft, setAttemptsLeft] = useState(COVER_ART_MAX_ATTEMPTS);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAiImage, setSelectedAiImage] = useState<{
    url: string;
    prompt: string;
  } | null>(null);

  useEffect(() => {
    async function loadTarget() {
      try {
        setIsLoading(true);
        const target = await getRandomGame([], mode);

        setTargetGame(target);

        if (mode === 'image-gen') {
          setSelectedAiImage(selectRandomAiImage(target));
        }
      } catch (err) {
        setError(getFriendlyErrorMessage(err, 'Failed to load game'));
      } finally {
        setIsLoading(false);
      }
    }

    loadTarget();
  }, [mode]);

  const currentPixelSize = getPixelSizeForAttempt(
    COVER_ART_MAX_ATTEMPTS - attemptsLeft,
    COVER_ART_MAX_ATTEMPTS,
  );

  const selectedArtworkUrl = useMemo(() => {
    if (mode === 'artwork' && targetGame) {
      return getRandomArtwork(targetGame.artworks);
    }

    return null;
  }, [mode, targetGame]);

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

  const resetGame = useCallback(async () => {
    try {
      setIsLoading(true);
      setWrongGuesses([]);
      setAttemptsLeft(COVER_ART_MAX_ATTEMPTS);
      setIsGameOver(false);
      setIsCorrect(false);
      setSelectedGame(null);
      const target = await getRandomGame([], mode);
      setTargetGame(target);

      if (mode === 'image-gen') {
        setSelectedAiImage(selectRandomAiImage(target));
      }
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Failed to reset game'));
    } finally {
      setIsLoading(false);
    }
  }, [mode]);

  const adjustAttempts = useCallback((delta: number) => {
    setAttemptsLeft((prev) => {
      const newValue = prev + delta;

      if (newValue < 1 || newValue > COVER_ART_MAX_ATTEMPTS) {
        return prev;
      }

      return newValue;
    });
  }, []);

  return {
    targetGame,
    selectedGame,
    wrongGuesses,
    attemptsLeft,
    isGameOver,
    isCorrect,
    isLoading,
    error,
    currentPixelSize,
    selectedArtworkUrl,
    selectedAiImage,
    handleSelectGame,
    clearSelection,
    handleSubmit,
    handleSkip,
    resetGame,
    adjustAttempts,
  };
}
