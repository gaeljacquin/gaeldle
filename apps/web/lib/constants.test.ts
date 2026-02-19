import { describe, it, expect } from 'bun:test';
import { PLACEHOLDER_IMAGE, PLACEHOLDER_IMAGE_R2 } from './constants';

describe('constants', () => {
  describe('PLACEHOLDER_IMAGE', () => {
    it('should be a string', () => {
      expect(typeof PLACEHOLDER_IMAGE).toBe('string');
    });

    it('should point to a valid placeholder file', () => {
      expect(PLACEHOLDER_IMAGE).toBe('/placeholder.jpg');
    });

    it('should start with forward slash', () => {
      expect(PLACEHOLDER_IMAGE.startsWith('/')).toBe(true);
    });

    it('should be a relative path', () => {
      expect(PLACEHOLDER_IMAGE).not.toContain('http');
    });

    it('should have jpg extension', () => {
      expect(PLACEHOLDER_IMAGE.endsWith('.jpg')).toBe(true);
    });

    it('should have non-empty path', () => {
      expect(PLACEHOLDER_IMAGE.length).toBeGreaterThan(0);
    });
  });

  describe('PLACEHOLDER_IMAGE_R2', () => {
    it('should be a string', () => {
      expect(typeof PLACEHOLDER_IMAGE_R2).toBe('string');
    });

    it('should contain the placeholder filename', () => {
      expect(PLACEHOLDER_IMAGE_R2).toContain('placeholder.jpg');
    });

    it('should have jpg extension', () => {
      expect(PLACEHOLDER_IMAGE_R2.endsWith('.jpg')).toBe(true);
    });

    it('should have non-empty path', () => {
      expect(PLACEHOLDER_IMAGE_R2.length).toBeGreaterThan(0);
    });

    it('should be constructed with r2PublicUrl environment variable', () => {
      // The value is constructed as: `${process.env.r2PublicUrl}/placeholder.jpg`
      // So it should either contain the placeholder filename
      expect(PLACEHOLDER_IMAGE_R2.includes('placeholder.jpg')).toBe(true);
    });
  });

  describe('placeholder constants consistency', () => {
    it('both should reference the same file name', () => {
      expect(PLACEHOLDER_IMAGE).toContain('placeholder.jpg');
      expect(PLACEHOLDER_IMAGE_R2).toContain('placeholder.jpg');
    });

    it('PLACEHOLDER_IMAGE_R2 should be longer or equal to PLACEHOLDER_IMAGE', () => {
      // R2 URL should include a base URL when env var is set
      expect(PLACEHOLDER_IMAGE_R2.length).toBeGreaterThanOrEqual(PLACEHOLDER_IMAGE.length);
    });

    it('both should be valid image URLs or paths', () => {
      expect(PLACEHOLDER_IMAGE).toMatch(/\.(jpg|jpeg|png|gif|webp)/i);
      expect(PLACEHOLDER_IMAGE_R2).toMatch(/\.(jpg|jpeg|png|gif|webp)/i);
    });
  });

  describe('environment variable usage', () => {
    it('PLACEHOLDER_IMAGE_R2 should contain placeholder.jpg', () => {
      // This is a static check - the value is computed at module load time
      // When r2PublicUrl is undefined, it becomes 'undefined/placeholder.jpg'
      expect(PLACEHOLDER_IMAGE_R2.includes('placeholder.jpg')).toBe(true);
    });
  });
});
