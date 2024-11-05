'use client';

import { useRef } from 'react';
import dynamic from 'next/dynamic';
import type { LottieRefCurrentProps } from 'lottie-react';
import animationData from '@/assets/logo.json';

export default function LottieDynamic({ loop }: { loop: boolean }) {
  const Lottie = dynamic(() => import('lottie-react'), { ssr: false });
  const logoRef = useRef<LottieRefCurrentProps>(null);

  return (
    <Lottie
      lottieRef={logoRef}
      animationData={animationData}
      loop={loop}
      aria-label="Gaël Logo"
      aria-labelledby="Gaël"
    />
  );
}
