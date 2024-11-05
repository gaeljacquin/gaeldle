import { Dispatch, SetStateAction } from "react";

export const fileToDataUri = (url: string) => {
  return new Promise((resolve) => {
    const imgElement = new window.Image();
    imgElement.crossOrigin = "Anonymous";
    imgElement.src = url;
    imgElement.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = imgElement.width;
      canvas.height = imgElement.height;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(imgElement, 0, 0);
      resolve(canvas.toDataURL());
    };
  });
};

export const pixelateImage = (
  originalImage: HTMLImageElement,
  pixelationFactor: number,
  setPixelatedSrc: Dispatch<SetStateAction<string>>,
  setLoading: (arg0: boolean) => void
) => {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  const originalWidth = originalImage?.width;
  const originalHeight = originalImage?.height;

  canvas.width = originalWidth;
  canvas.height = originalHeight;

  context?.drawImage(originalImage, 0, 0, originalWidth, originalHeight);

  const originalImageData = context?.getImageData(
    0,
    0,
    originalWidth,
    originalHeight
  ).data;

  if (pixelationFactor !== 0) {
    for (let y = 0; y < originalHeight; y += pixelationFactor) {
      for (let x = 0; x < originalWidth; x += pixelationFactor) {
        const pixelIndexPosition = (x + y * originalWidth) * 4;

        if (context && originalImageData) {
          context.fillStyle = `rgba(
              ${originalImageData[pixelIndexPosition]},
              ${originalImageData[pixelIndexPosition + 1]},
              ${originalImageData[pixelIndexPosition + 2]},
              ${originalImageData[pixelIndexPosition + 3]}
            )`;
        }

        context?.fillRect(x, y, pixelationFactor, pixelationFactor);
      }
    }
  }
  setPixelatedSrc(canvas.toDataURL());
  setLoading(false);
};
