/**
 * Applies pixelation effect to an image
 * @param imageUrl - URL of the image to pixelate
 * @param pixelSize - Size of pixels (higher = more pixelated, default: 10)
 * @returns Data URL of the pixelated image
 */
export function pixelateImage(
  imageUrl: string,
  pixelSize: number = 10
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;

      // Draw the image at smaller size
      const scaledWidth = Math.ceil(img.width / pixelSize);
      const scaledHeight = Math.ceil(img.height / pixelSize);

      // Turn off image smoothing for pixelated effect
      ctx.imageSmoothingEnabled = false;

      // Draw small version
      ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight);

      // Scale back up to original size
      ctx.drawImage(
        canvas,
        0,
        0,
        scaledWidth,
        scaledHeight,
        0,
        0,
        canvas.width,
        canvas.height
      );

      resolve(canvas.toDataURL());
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = imageUrl;
  });
}

/**
 * Calculate pixel size based on attempt number
 * @param attempt - Current attempt number (0-4 for 5 attempts)
 * @param maxAttempts - Maximum number of attempts (default: 5)
 * @returns Pixel size for the current attempt
 */
export function getPixelSizeForAttempt(
  attempt: number,
  maxAttempts: number = 5
): number {
  const maxPixelSize = 12;
  const minPixelSize = 5;
  const range = maxPixelSize - minPixelSize;

  // Calculate pixel size based on remaining attempts
  const progress = attempt / (maxAttempts - 1);
  return Math.round(maxPixelSize - progress * range);
}
