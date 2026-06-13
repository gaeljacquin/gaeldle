import { describe, it, expect } from 'vitest';
import {
  GameMode,
  getGameModeBySlug,
  getGameModes,
} from '@/lib/services/game-mode.service';

describe('game-mode utilities', () => {
  describe('gameModes array', () => {
    it('should have exactly 6 game modes', async () => {
      expect((await getGameModes()).length).toBe(6);
    });

    it('should contain cover-art mode', async () => {
      const mode = (await getGameModes()).find(
        (m: GameMode) => m.slug === 'cover-art',
      );

      expect(mode).toBeDefined();
      expect(mode?.title).toBe('Cover Art');
      expect(mode?.level).toBe('easy');
    });

    it('should contain artwork mode', async () => {
      const mode = (await getGameModes()).find(
        (m: GameMode) => m.slug === 'artwork',
      );

      expect(mode).toBeDefined();
      expect(mode?.title).toBe('Artwork');
      expect(mode?.level).toBe('medium');
    });

    it('should contain image-gen mode', async () => {
      const mode = (await getGameModes()).find(
        (m: GameMode) => m.slug === 'image-gen',
      );

      expect(mode).toBeDefined();
      expect(mode?.title).toBe('Image Gen');
      expect(mode?.level).toBe('medium');
    });

    it('should contain timeline mode', async () => {
      const mode = (await getGameModes()).find(
        (m: GameMode) => m.slug === 'timeline',
      );

      expect(mode).toBeDefined();
      expect(mode?.title).toBe('Timeline');
      expect(mode?.level).toBe('medium');
    });

    it('should contain timeline-2 mode', async () => {
      const mode = (await getGameModes()).find(
        (m: GameMode) => m.slug === 'timeline-2',
      );

      expect(mode).toBeDefined();
      expect(mode?.title).toBe('Timeline 2');
      expect(mode?.level).toBe('hard');
    });

    it('should contain specifications mode', async () => {
      const mode = (await getGameModes()).find(
        (m: GameMode) => m.slug === 'specifications',
      );

      expect(mode).toBeDefined();
      expect(mode?.title).toBe('Specifications');
      expect(mode?.level).toBe('hard');
    });

    it('should have unique ids', async () => {
      const ids = (await getGameModes()).map((m: GameMode) => m.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should all have required properties', async () => {
      (await getGameModes()).forEach((mode) => {
        expect(mode.id).toBeDefined();
        expect(mode.title).toBeDefined();
        expect(mode.description).toBeDefined();
        expect(mode.level).toBeDefined();
        expect(mode.gradient).toBeDefined();
      });
    });

    it('should have valid level values', async () => {
      const validDifficulties = ['easy', 'medium', 'hard'];
      (await getGameModes()).forEach((mode) => {
        expect(validDifficulties).toContain(mode.level);
      });
    });

    it('should have non-empty descriptions', async () => {
      (await getGameModes()).forEach((mode) => {
        expect(mode.description.length).toBeGreaterThan(0);
      });
    });

    it('should have non-empty titles', async () => {
      (await getGameModes()).forEach((mode) => {
        expect(mode.title.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getGameModeBySlug', () => {
    it('should return cover-art mode when slug is "cover-art"', async () => {
      const result = await getGameModeBySlug('cover-art');

      expect(result).toBeDefined();
      expect(result.id).toBe('cover-art');
      expect(result.title).toBe('Cover Art');
    });

    it('should return artwork mode when slug is "artwork"', async () => {
      const result = await getGameModeBySlug('artwork');

      expect(result).toBeDefined();
      expect(result.id).toBe('artwork');
      expect(result.title).toBe('Artwork');
    });

    it('should return image-gen mode when slug is "image-gen"', async () => {
      const result = await getGameModeBySlug('image-gen');

      expect(result).toBeDefined();
      expect(result.id).toBe('image-gen');
      expect(result.title).toBe('Image Gen');
    });

    it('should return timeline mode when slug is "timeline"', async () => {
      const result = await getGameModeBySlug('timeline');

      expect(result).toBeDefined();
      expect(result.id).toBe('timeline');
      expect(result.title).toBe('Timeline');
    });

    it('should return timeline-2 mode when slug is "timeline-2"', async () => {
      const result = await getGameModeBySlug('timeline-2');
      expect(result).toBeDefined();
      expect(result?.id).toBe('timeline-2');
      expect(result?.title).toBe('Timeline 2');
    });

    it('should return specifications mode when slug is "specifications"', async () => {
      const result = await getGameModeBySlug('specifications');

      expect(result).toBeDefined();
      expect(result.id).toBe('specifications');
      expect(result.title).toBe('Specifications');
    });

    it('should return undefined for unknown slug', async () => {
      const result = getGameModeBySlug('unknown');

      expect(result).toBeUndefined();
    });

    it('should return undefined for empty string', async () => {
      const result = getGameModeBySlug('');
      expect(result).toBeUndefined();
    });

    it('should return undefined for null-like slugs', async () => {
      const result = getGameModeBySlug('null');

      expect(result).toBeUndefined();
    });

    it('should be case-sensitive', async () => {
      const result = getGameModeBySlug('COVER-ART');

      expect(result).toBeUndefined();
    });

    it('should return undefined for partial matches', async () => {
      const result = getGameModeBySlug('cover');
      expect(result).toBeUndefined();
    });

    it('should handle slug with extra whitespace', async () => {
      const result = getGameModeBySlug(' cover-art ');

      expect(result).toBeUndefined();
    });

    it('should return the full GameMode object with all properties', async () => {
      const result = getGameModeBySlug('cover-art');

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('level');
      expect(result).toHaveProperty('icon');
      expect(result).toHaveProperty('gradient');
      expect(result).toHaveProperty('href');
    });

    it('should be consistent across multiple calls', async () => {
      const result1 = await getGameModeBySlug('artwork');
      const result2 = await getGameModeBySlug('artwork');

      expect(result1?.id).toBe(result2?.id);
      expect(result1?.title).toBe(result2?.title);
    });
  });
});
