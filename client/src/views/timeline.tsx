'use client';

import cx from 'clsx';
import GameCard from '@/components/game-card';
import ModeHeader from '@/components/modes-header';
import { Game } from '@/services/games';
import { Mode } from '@/services/modes';
import classes from '@/styles/DndList.module.css';

type Props = {
  mode: Mode;
  games: Partial<Game>[];
};

const colors = {
  from: 'pink',
  to: 'lime',
};

export default function Timeline(props: Props) {
  return <></>;
}
