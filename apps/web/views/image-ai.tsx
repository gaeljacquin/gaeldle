import GameListPlusImage from '@/components/game-list-plus-image';
import { redirect } from 'next/navigation';

export default function ImageAI() {
  if (process.env.NODE_ENV === 'development') {
    return <GameListPlusImage gameModeSlug="image-ai" />;
  }

  redirect('/');
}
