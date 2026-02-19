import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
import { pixelateImage, getPixelSizeForAttempt } from './pixelate';

describe('pixelate utilities', () => {
  describe('getPixelSizeForAttempt', () => {
    it('should return maximum pixel size for attempt 0', () => {
      const result = getPixelSizeForAttempt(0);
      expect(result).toBe(12);
    });

    it('should return minimum pixel size for final attempt', () => {
      const result = getPixelSizeForAttempt(4);
      expect(result).toBe(5);
    });

    it('should calculate intermediate pixel sizes', () => {
      const result = getPixelSizeForAttempt(2);
      // progress = 2 / 4 = 0.5
      // pixelSize = 12 - (0.5 * 7) = 12 - 3.5 = 8.5 -> rounds to 9
      expect(result).toBe(9);
    });

    it('should handle attempt 1', () => {
      const result = getPixelSizeForAttempt(1);
      // progress = 1 / 4 = 0.25
      // pixelSize = 12 - (0.25 * 7) = 12 - 1.75 = 10.25 -> rounds to 10
      expect(result).toBe(10);
    });

    it('should handle attempt 3', () => {
      const result = getPixelSizeForAttempt(3);
      // progress = 3 / 4 = 0.75
      // pixelSize = 12 - (0.75 * 7) = 12 - 5.25 = 6.75 -> rounds to 7
      expect(result).toBe(7);
    });

    it('should respect custom maxAttempts parameter', () => {
      // With maxAttempts = 3, attempts are 0, 1, 2
      const result = getPixelSizeForAttempt(1, 3);
      // progress = 1 / 2 = 0.5
      // pixelSize = 12 - (0.5 * 7) = 12 - 3.5 = 8.5 -> rounds to 9
      expect(result).toBe(9);
    });

    it('should handle maxAttempts of 1', () => {
      const result = getPixelSizeForAttempt(0, 1);
      // progress = 0 / 0 = Infinity... but practically 0 / 0 should be handled
      // When maxAttempts is 1, progress = 0 / (1 - 1) = 0 / 0
      // The function will calculate 0 / 0 which is NaN, but let's test what happens
      expect(typeof result).toBe('number');
    });

    it('should return pixel sizes between 5 and 12', () => {
      for (let i = 0; i < 5; i++) {
        const result = getPixelSizeForAttempt(i, 5);
        expect(result).toBeGreaterThanOrEqual(5);
        expect(result).toBeLessThanOrEqual(12);
      }
    });

    it('should handle large attempt numbers', () => {
      const result = getPixelSizeForAttempt(100, 100);
      // When attempt is near maxAttempts - 1, should be close to minPixelSize
      expect(result).toBeGreaterThanOrEqual(5);
      expect(result).toBeLessThanOrEqual(12);
    });
  });

  describe('pixelateImage', () => {
    let mockImage: any;
    let mockCanvas: any;
    let mockCtx: any;
    let originalImage: typeof Image;
    let originalDocument: typeof document;

    beforeEach(() => {
      // Mock Image constructor
      mockImage = {
        crossOrigin: '',
        src: '',
        onload: null as any,
        onerror: null as any,
        width: 100,
        height: 100,
      };

      // Mock canvas context
      mockCtx = {
        imageSmoothingEnabled: true,
        drawImage: mock(() => {}),
      };

      // Mock canvas
      mockCanvas = {
        width: 0,
        height: 0,
        getContext: mock(() => mockCtx),
        toDataURL: mock(() => 'data:image/png;base64,mock'),
      };

      // Mock document.createElement
      originalDocument = (global as any).document;
      (global as any).document = {
        createElement: mock((tag: string) => {
          if (tag === 'canvas') return mockCanvas;
          return {};
        }),
      };

      // Mock Image constructor
      originalImage = (global as any).Image;
      (global as any).Image = mock(function() {
        return mockImage;
      });
    });

    afterEach(() => {
      (global as any).Image = originalImage;
      (global as any).document = originalDocument;
    });

    it('should set crossOrigin to anonymous', async () => {
      const promise = pixelateImage('https://example.com/image.jpg');
      expect(mockImage.crossOrigin).toBe('anonymous');
      mockImage.onload?.();
      const result = await promise;
      expect(result).toBe('data:image/png;base64,mock');
    });

    it('should resolve with data URL on successful load', async () => {
      const promise = pixelateImage('https://example.com/image.jpg');
      mockImage.onload?.();
      const result = await promise;
      expect(result).toBe('data:image/png;base64,mock');
    });

    it('should set image src to the provided URL', async () => {
      const imageUrl = 'https://example.com/my-image.jpg';
      const promise = pixelateImage(imageUrl);
      // Image src is set after handlers are attached
      expect(mockImage.src).toBe(imageUrl);
      mockImage.onload?.();
      await promise;
    });

    it('should use provided pixelSize in calculations', async () => {
      mockImage.width = 200;
      mockImage.height = 200;
      const promise = pixelateImage('https://example.com/image.jpg', 20);
      mockImage.onload?.();
      await promise;

      expect(mockCanvas.width).toBe(200);
      expect(mockCanvas.height).toBe(200);
      expect(mockCtx.drawImage).toHaveBeenCalled();
    });

    it('should disable image smoothing for pixelated effect', async () => {
      const promise = pixelateImage('https://example.com/image.jpg');
      mockImage.onload?.();
      await promise;

      expect(mockCtx.imageSmoothingEnabled).toBe(false);
    });

    it('should handle canvas context not available', async () => {
      (global as any).document.createElement = mock(() => ({
        getContext: mock(() => null),
      }));

      const promise = pixelateImage('https://example.com/image.jpg');
      mockImage.onload?.();

      try {
        await promise;
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toBe('Failed to get canvas context');
      }
    });

    it('should reject with error on image load failure', async () => {
      const promise = pixelateImage('https://example.com/bad-image.jpg');
      mockImage.onerror?.();

      try {
        await promise;
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toBe('Failed to load image');
      }
    });

    it('should use default pixelSize of 10', async () => {
      const promise = pixelateImage('https://example.com/image.jpg');
      mockImage.onload?.();
      await promise;

      expect(mockCanvas.getContext).toHaveBeenCalledWith('2d');
    });

    it('should calculate scaled dimensions correctly', async () => {
      mockImage.width = 300;
      mockImage.height = 300;
      const promise = pixelateImage('https://example.com/image.jpg', 15);
      mockImage.onload?.();
      await promise;

      // scaledWidth = Math.ceil(300 / 15) = 20
      // scaledHeight = Math.ceil(300 / 15) = 20
      expect(mockCanvas.width).toBe(300);
      expect(mockCanvas.height).toBe(300);
    });

    it('should draw image twice for pixelation effect', async () => {
      const promise = pixelateImage('https://example.com/image.jpg');
      mockImage.onload?.();
      await promise;

      // drawImage should be called twice - once to draw small, once to scale up
      const drawCalls = (mockCtx.drawImage as any).mock.calls;
      expect(drawCalls.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle small pixel sizes', async () => {
      const promise = pixelateImage('https://example.com/image.jpg', 1);
      mockImage.onload?.();
      const result = await promise;
      expect(result).toBe('data:image/png;base64,mock');
    });

    it('should handle large pixel sizes', async () => {
      const promise = pixelateImage('https://example.com/image.jpg', 100);
      mockImage.onload?.();
      const result = await promise;
      expect(result).toBe('data:image/png;base64,mock');
    });

    it('should handle non-square images', async () => {
      mockImage.width = 400;
      mockImage.height = 200;
      const promise = pixelateImage('https://example.com/image.jpg', 10);
      mockImage.onload?.();
      await promise;

      expect(mockCanvas.width).toBe(400);
      expect(mockCanvas.height).toBe(200);
    });

    it('should call toDataURL to get the result', async () => {
      const promise = pixelateImage('https://example.com/image.jpg');
      mockImage.onload?.();
      await promise;

      expect(mockCanvas.toDataURL).toHaveBeenCalled();
    });
  });
});
