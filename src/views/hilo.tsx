'use client';

import { useEffect, useState } from 'react';
import GameCard from '@/components/game-card';
import ModeHeader from '@/components/modes-header';
import { Game } from '@/services/games';
import { Mode } from '@/services/modes';

type Props = {
  mode: Mode;
  games: Partial<Game>[];
};

type FormType = {
  operator: string;
};

export default function Hilo(props: Props) {
  const { mode, games } = props;
  const [currentGame, setCurrentGame] = useState<Partial<Game>>(games[0]);
  const [nextGame, setNextGame] = useState<Partial<Game>>(games[1]);
  const [livesLeft, setLivesLeft] = useState<number>(mode.lives);
  const colors = {
    from: 'cyan',
    to: 'green',
  };
  // const formBefore = useForm({
  //   mode: 'uncontrolled',
  //   initialValues: {
  //     operator: '<',
  //   },
  // });
  // const formAfter = useForm({
  //   mode: 'uncontrolled',
  //   initialValues: {
  //     operator: '>',
  //   },
  // });
  const handleSubmit = (values: FormType) => {
    console.log(values);
  };

  useEffect(() => {
    console.log(currentGame, nextGame);
  }, [currentGame, nextGame]);

  return <></>;
}
