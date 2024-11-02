'use client';

import { Card, Center, Image, Text } from '@mantine/core';
import { Game } from '@/services/games';

type Props = {
  game: Partial<Game>;
  showBar?: boolean;
  showTooltip?: boolean;
  showPos?: boolean;
};

export default function GameCard(props: Props) {
  const { game, showBar = true, showTooltip = true, showPos = false } = props;

  // const posComp = (index: number) => {
  //   return <span>{index + 1}</span>;
  // };

  return (
    <Card shadow="sm" padding="md" radius="lg">
      <Card.Section>
        <Image src={game.imageUrl} h={200} w={128} alt={game.name} />
        {showBar && (
          <Center style={{ backgroundColor: 'rgba(18, 92, 55, 1)' }} p="sm">
            <Text c="white">uwu</Text>
          </Center>
        )}
      </Card.Section>
    </Card>
  );
}
