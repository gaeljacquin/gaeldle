import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { SkeletonImage } from "./skeleton-image";
import { fileToDataUri, pixelateImage } from "@/lib/pixelate-image";

type PixelateImageProps = {
  imageUrl: string
  pixelationFactor: number
  alt: string
  width: number
  height: number
}

const PixelatedImage = ({ imageUrl, pixelationFactor, alt, width, height }: PixelateImageProps) => {
  const [pixelatedSrc, setPixelatedSrc] = useState(imageUrl);
  const [loading, setLoading] = useState(true);
  const originalImageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const loadImage = async () => {
      const dataUri = await fileToDataUri(imageUrl) as string;
      setPixelatedSrc(dataUri);
      const imgElement = new window.Image();
      imgElement.src = dataUri;
      imgElement.onload = () => {
        originalImageRef.current = imgElement;

        if (pixelationFactor > 0) {
          pixelateImage(imgElement, pixelationFactor, setPixelatedSrc, setLoading);
        }
      };
    };
    loadImage();
  }, [imageUrl, pixelationFactor]);

  return (
    <div>
      {loading ? (
        <SkeletonImage width={width} height={height} />
      ) : (
        <Image
          src={pixelatedSrc}
          alt={alt}
          width={width}
          height={height}
        />
      )}
    </div>
  );
};

export default PixelatedImage;
