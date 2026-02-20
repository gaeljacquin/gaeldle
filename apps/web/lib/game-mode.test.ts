import { describe, it, expect } from 'bun:test';
import { getGameModeBySlug, gameModes } from './game-mode';

describe('game-mode utilities', () => {
  describe('gameModes array', () => {
    it('should have exactly 5 game modes', () => {
      expect(gameModes.length).toBe(5);
    });

    it('should contain cover-art mode', () => {
      const mode = gameModes.find((m) => m.id === 'cover-art');
      expect(mode).toBeDefined();
      expect(mode?.title).toBe('Cover Art');
      expect(mode?.difficulty).toBe('Easy');
    });

    it('should contain artwork mode', () => {
      const mode = gameModes.find((m) => m.id === 'artwork');
      expect(mode).toBeDefined();
      expect(mode?.title).toBe('Artwork');
      expect(mode?.difficulty).toBe('Medium');
    });

    it('should contain timeline mode', () => {
      const mode = gameModes.find((m) => m.id === 'timeline');
      expect(mode).toBeDefined();
      expect(mode?.title).toBe('Timeline');
      expect(mode?.difficulty).toBe('Medium');
    });

    it('should contain timeline-2 mode', () => {
      const mode = gameModes.find((m) => m.id === 'timeline-2');
      expect(mode).toBeDefined();
      expect(mode?.title).toBe('Timeline 2');
      expect(mode?.difficulty).toBe('Hard');
    });

    it('should contain specifications mode', () => {
      const mode = gameModes.find((m) => m.id === 'specifications');
      expect(mode).toBeDefined();
      expect(mode?.title).toBe('Specifications');
      expect(mode?.difficulty).toBe('Hard');
    });

    it('should have unique ids', () => {
      const ids = gameModes.map((m) => m.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should all have required properties', () => {
      gameModes.forEach((mode) => {
        expect(mode.id).toBeDefined();
        expect(mode.title).toBeDefined();
        expect(mode.description).toBeDefined();
        expect(mode.difficulty).toBeDefined();
        expect(mode.icon).toBeDefined();
        expect(mode.gradient).toBeDefined();
        expect(mode.href).toBeDefined();
      });
    });

    it('should have valid difficulty values', () => {
      const validDifficulties = ['Easy', 'Medium', 'Hard'];
      gameModes.forEach((mode) => {
        expect(validDifficulties).toContain(mode.difficulty);
      });
    });

    it('should have hrefs starting with /', () => {
      gameModes.forEach((mode) => {
        expect(mode.href.startsWith('/')).toBe(true);
      });
    });

    it('should have non-empty descriptions', () => {
      gameModes.forEach((mode) => {
        expect(mode.description.length).toBeGreaterThan(0);
      });
    });

    it('should have non-empty titles', () => {
      gameModes.forEach((mode) => {
        expect(mode.title.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getGameModeBySlug', () => {
    it('should return cover-art mode when slug is "cover-art"', () => {
      const result = getGameModeBySlug('cover-art');
      expect(result).toBeDefined();
      expect(result?.id).toBe('cover-art');
      expect(result?.title).toBe('Cover Art');
    });

    it('should return artwork mode when slug is "artwork"', () => {
      const result = getGameModeBySlug('artwork');
      expect(result).toBeDefined();
      expect(result?.id).toBe('artwork');
      expect(result?.title).toBe('Artwork');
    });

    it('should return timeline mode when slug is "timeline"', () => {
      const result = getGameModeBySlug('timeline');
      expect(result).toBeDefined();
      expect(result?.id).toBe('timeline');
      expect(result?.title).toBe('Timeline');
    });

    it('should return timeline-2 mode when slug is "timeline-2"', () => {
      const result = getGameModeBySlug('timeline-2');
      expect(result).toBeDefined();
      expect(result?.id).toBe('timeline-2');
      expect(result?.title).toBe('Timeline 2');
    });

    it('should return specifications mode when slug is "specifications"', () => {
      const result = getGameModeBySlug('specifications');
      expect(result).toBeDefined();
      expect(result?.id).toBe('specifications');
      expect(result?.title).toBe('Specifications');
    });

    it('should return undefined for unknown slug', () => {
      const result = getGameModeBySlug('unknown');
      expect(result).toBeUndefined();
    });

    it('should return undefined for empty string', () => {
      const result = getGameModeBySlug('');
      expect(result).toBeUndefined();
    });

    it('should return undefined for null-like slugs', () => {
      const result = getGameModeBySlug('null');
      expect(result).toBeUndefined();
    });

    it('should be case-sensitive', () => {
      const result = getGameModeBySlug('COVER-ART');
      expect(result).toBeUndefined();
    });

    it('should return undefined for partial matches', () => {
      const result = getGameModeBySlug('cover');
      expect(result).toBeUndefined();
    });

    it('should handle slug with extra whitespace', () => {
      const result = getGameModeBySlug(' cover-art ');
      expect(result).toBeUndefined();
    });

    it('should return the full GameMode object with all properties', () => {
      const result = getGameModeBySlug('cover-art');
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('difficulty');
      expect(result).toHaveProperty('icon');
      expect(result).toHaveProperty('gradient');
      expect(result).toHaveProperty('href');
    });

    it('should be consistent across multiple calls', () => {
      const result1 = getGameModeBySlug('artwork');
      const result2 = getGameModeBySlug('artwork');
      expect(result1?.id).toBe(result2?.id);
      expect(result1?.title).toBe(result2?.title);
    });
  });

  describe('GameMode interface conformance', () => {
    it('each mode should have a valid TablerIcon', () => {
      gameModes.forEach((mode) => {
        // TablerIcon is imported as React component, which is an object
        expect(typeof mode.icon).toBe('object');
      });
    });

    it('should have gradient values starting with --gradient', () => {
      gameModes.forEach((mode) => {
        expect(mode.gradient.startsWith('--gradient')).toBe(true);
      });
    });

    it('should not have duplicate hrefs', () => {
      const hrefs = gameModes.map((m) => m.href);
      const uniqueHrefs = new Set(hrefs);
      expect(uniqueHrefs.size).toBe(hrefs.length);
    });
  });
});
