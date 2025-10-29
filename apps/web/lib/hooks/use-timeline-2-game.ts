import { useState, useEffect, useCallback } from 'react';
import { getRandomGame } from '@/lib/services/game.service';
import type { Game } from '@/lib/types/game';

const MAX_ATTEMPTS = 3;

export function useTimeline2Game() {
  const [timelineCards, setTimelineCards] = useState<Game[]>([]);
  const [dealtCard, setDealtCard] = useState<Game | null>(null);
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_ATTEMPTS);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [lastPlacementCorrect, setLastPlacementCorrect] = useState<boolean | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [correctlyPlacedCards, setCorrectlyPlacedCards] = useState<Set<number>>(new Set());
  const [isDealingCard, setIsDealingCard] = useState(false);
  const [firstCardId, setFirstCardId] = useState<number | null>(null);

  // Initialize game with first random card in timeline and deal first card
  const initializeGame = useCallback(async () => {
    try {
      setIsLoading(true);

      // Get first card for timeline (with date revealed)
      const firstCard = await getRandomGame([]);

      // Filter games with valid release dates
      if (!firstCard.firstReleaseDate) {
        throw new Error('First card has no release date');
      }

      setTimelineCards([firstCard]);
      setFirstCardId(firstCard.id);

      // Deal first card to player (date hidden)
      const secondCard = await getRandomGame([firstCard.id]);

      if (!secondCard.firstReleaseDate) {
        throw new Error('Dealt card has no release date');
      }

      setDealtCard(secondCard);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to initialize game:', error);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  // Get all excluded IDs (timeline + dealt card)
  const getExcludedIds = useCallback((): number[] => {
    const timelineIds = timelineCards.map(card => card.id);
    const dealtCardId = dealtCard ? [dealtCard.id] : [];
    return [...timelineIds, ...dealtCardId];
  }, [timelineCards, dealtCard]);

  // Deal next card
  const dealNextCard = useCallback(async () => {
    try {
      const excludedIds = getExcludedIds();
      const nextCard = await getRandomGame(excludedIds);

      if (!nextCard.firstReleaseDate) {
        // No more valid cards, end game
        setIsGameOver(true);
        return;
      }

      setDealtCard(nextCard);
    } catch (error) {
      console.error('Failed to deal next card:', error);
      setIsGameOver(true);
    }
  }, [getExcludedIds]);

  // Find correct position for a card in the timeline
  const findCorrectPosition = useCallback((card: Game, timeline: Game[]): number => {
    const cardDate = card.firstReleaseDate!;

    // Find the first card that has a later release date
    const insertIndex = timeline.findIndex(
      (timelineCard) => (timelineCard.firstReleaseDate ?? 0) > cardDate
    );

    // If no card is later, insert at the end
    return insertIndex === -1 ? timeline.length : insertIndex;
  }, []);

  // Handle card placement
  const handleCardPlacement = useCallback(async (position: number) => {
    if (!dealtCard || isAnimating || isDealingCard) return;

    const cardToPlace = dealtCard;
    const correctPosition = findCorrectPosition(cardToPlace, timelineCards);
    const isCorrect = position === correctPosition;

    // Clear dealt card immediately to prevent flash, then show skeleton
    setDealtCard(null);
    setIsAnimating(true);
    setLastPlacementCorrect(isCorrect);

    if (isCorrect) {
      // Correct placement - insert card at position and track it
      const newTimeline = [...timelineCards];
      newTimeline.splice(position, 0, cardToPlace);
      setTimelineCards(newTimeline);
      setScore(prev => prev + 1);
      setCorrectlyPlacedCards(prev => new Set(prev).add(cardToPlace.id));

      // Show skeleton and deal next card after animation
      setTimeout(async () => {
        setIsDealingCard(true);
        setLastPlacementCorrect(null);
        setIsAnimating(false);
        await dealNextCard();
        setIsDealingCard(false);
      }, 800);
    } else {
      // Wrong placement - show error and insert at correct position
      const newAttempts = attemptsLeft - 1;
      setAttemptsLeft(newAttempts);

      // Insert at correct position immediately (framer-motion will animate it)
      const newTimeline = [...timelineCards];
      newTimeline.splice(correctPosition, 0, cardToPlace);
      setTimelineCards(newTimeline);

      // Check game over
      if (newAttempts <= 0) {
        setTimeout(() => {
          setIsGameOver(true);
          setIsAnimating(false);
          setLastPlacementCorrect(null);
          setIsDealingCard(false);
        }, 1000);
      } else {
        // Deal next card after animation
        setTimeout(async () => {
          setIsDealingCard(true);
          setLastPlacementCorrect(null);
          setIsAnimating(false);
          await dealNextCard();
          setIsDealingCard(false);
        }, 1800);
      }
    }
  }, [dealtCard, timelineCards, attemptsLeft, isAnimating, isDealingCard, findCorrectPosition, dealNextCard]);

  // Reset game
  const resetGame = useCallback(() => {
    setTimelineCards([]);
    setDealtCard(null);
    setAttemptsLeft(MAX_ATTEMPTS);
    setIsGameOver(false);
    setScore(0);
    setLastPlacementCorrect(null);
    setIsAnimating(false);
    setCorrectlyPlacedCards(new Set());
    setIsDealingCard(false);
    setFirstCardId(null);
    initializeGame();
  }, [initializeGame]);

  const adjustAttempts = useCallback((delta: number) => {
    setAttemptsLeft(prev => {
      const newValue = prev + delta;
      if (newValue < 1 || newValue > MAX_ATTEMPTS) return prev;
      return newValue;
    });
  }, []);

  return {
    timelineCards,
    dealtCard,
    attemptsLeft,
    maxAttempts: MAX_ATTEMPTS,
    isGameOver,
    score,
    isLoading,
    lastPlacementCorrect,
    isAnimating,
    correctlyPlacedCards,
    isDealingCard,
    firstCardId,
    handleCardPlacement,
    resetGame,
    adjustAttempts,
  };
}
