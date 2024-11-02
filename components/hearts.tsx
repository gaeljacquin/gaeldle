import { IconHeart } from '@tabler/icons-react';
import { ActionIcon, Group } from '@mantine/core';

type Props = {
  lives: number;
  livesLeft: number;
};

export default function Hearts(props: Props) {
  const { lives, livesLeft } = props;

  return (
    <Group gap="xs">
      {Array.from({ length: lives }).map((_, index) => (
        <ActionIcon
          variant={index < livesLeft ? 'filled' : 'outline'}
          aria-label="Heart"
          color="pink"
          size="xl"
          key={`heart-${index}`}
        >
          <IconHeart style={{ width: '70%', height: '70%' }} stroke={1.5} />
        </ActionIcon>
      ))}
    </Group>
  );
}
