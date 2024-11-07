'use client';

import { useRef } from 'react';
import type { LottieRefCurrentProps } from 'lottie-react';
import Lottie from 'lottie-react';
import animationData from '@/assets/logo.json';

export default function LottieComp({ loop }: { loop: boolean }) {
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
