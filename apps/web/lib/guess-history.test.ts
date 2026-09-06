import { describe, it, expect } from 'vitest';
import { extractArray } from '@workspace/shared';

function hasMatchingItem(a: unknown, b: unknown): boolean {
  const listA = extractArray(a)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  const listB = extractArray(b)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  if (listA.length === 0 || listB.length === 0) {
    return false;
  }

  return listA.some((item) => listB.includes(item));
}

describe('guess history franchise and series matching', () => {
  it('should match identical franchise strings', () => {
    const guessFranchises = ['The Legend of Zelda'];
    const targetFranchises = ['The Legend of Zelda'];
    expect(hasMatchingItem(guessFranchises, targetFranchises)).toBe(true);
  });

  it('should match case-insensitively and ignore whitespace', () => {
    const guessFranchises = ['  the legend of zelda  '];
    const targetFranchises = ['THE LEGEND OF ZELDA'];
    expect(hasMatchingItem(guessFranchises, targetFranchises)).toBe(true);
  });

  it('should match when one franchise among several matches', () => {
    const guessFranchises = ['Mario', 'Super Mario'];
    const targetFranchises = ['Super Mario', 'Donkey Kong'];
    expect(hasMatchingItem(guessFranchises, targetFranchises)).toBe(true);
  });

  it('should match collections / series with object structure', () => {
    const guessCollections = [{ name: 'Final Fantasy Main Series' }];
    const targetCollections = [{ name: 'Final Fantasy Main Series' }];
    expect(hasMatchingItem(guessCollections, targetCollections)).toBe(true);
  });

  it('should return false if franchises do not match', () => {
    const guessFranchises = ['Metroid'];
    const targetFranchises = ['Zelda'];
    expect(hasMatchingItem(guessFranchises, targetFranchises)).toBe(false);
  });

  it('should return false if either list is empty or null', () => {
    expect(hasMatchingItem(null, ['Zelda'])).toBe(false);
    expect(hasMatchingItem(['Zelda'], null)).toBe(false);
    expect(hasMatchingItem([], [])).toBe(false);
    expect(hasMatchingItem(undefined, undefined)).toBe(false);
  });
});
