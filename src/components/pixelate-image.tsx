import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { placeholderImage } from '@/utils/client-constants';
import { fileToDataUri, pixelateImage } from '@/utils/pixelate-image';

type PixelateImageProps = {
  imageUrl: string;
  pixelationFactor: number;
  alt: string;
  width: number;
  height: number;
};

const PixelatedImage = ({ imageUrl, pixelationFactor, alt, width, height }: PixelateImageProps) => {
  const [pixelatedSrc, setPixelatedSrc] = useState(imageUrl);
  const [loading, setLoading] = useState(true);
  const originalImageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const loadImage = async () => {
      const dataUri = (await fileToDataUri(imageUrl)) as string;
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
  }, [imageUrl, pixelationFactor, loading]);

  return (
    <div>
      {loading ? (
        <Image
          placeholder="empty"
          className="relative z-10"
          src={placeholderImage.url}
          width={width}
          height={height}
          style={{ objectFit: 'contain', width: 'auto', height: 'auto' }}
          alt={placeholderImage.alt}
          priority
        />
      ) : (
        <Image
          placeholder="empty"
          className="relative z-10"
          src={pixelatedSrc}
          width={width}
          height={height}
          style={{ objectFit: 'contain', width: 'auto', height: 'auto' }}
          alt={alt}
          loading="lazy"
        />
      )}
    </div>
  );
};

export default PixelatedImage;
