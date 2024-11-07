import { Heart } from 'lucide-react';

type HeartsProps = {
  lives: number;
  livesLeft: number;
  size?: 'sm' | 'md' | 'lg';
};

export default function Hearts({ lives, livesLeft, size = 'sm' }: HeartsProps) {
  let sizeClass;

  switch (size) {
    case 'sm':
      sizeClass = 'w-6 h-6';
      break;
    case 'md':
      sizeClass = 'w-10 h-10';
      break;
    case 'lg':
      sizeClass = 'w-14 h-14';
      break;
  }

  return Array.from({ length: lives }).map((_, index) => (
    <Heart
      key={index}
      className={`${sizeClass} ${index < livesLeft ? 'text-red-600' : ''}`}
      fill={index < livesLeft ? 'currentColor' : 'none'}
    />
  ));
}
