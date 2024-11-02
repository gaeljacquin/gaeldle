'use client';

import { Badge, Button, Center, Container, Grid, Group, Paper, Text } from '@mantine/core';
import GameCard from '@/components/game-card';
import Hearts from '@/components/hearts';
import ModeHeader from '@/components/mode-header';
import { Games } from '@/services/games';
import { Mode } from '@/services/modes';

type Props = {
  mode: Mode;
  games: Games;
};

export default function Hilo(props: Props) {
  const { mode, games } = props;
  const currentGame = games[0];
  const nextGame = games[1];
  const colors = {
    from: 'cyan',
    to: 'green',
  };

  return (
    <>
      <ModeHeader mode={mode} colors={colors} />
      <Container mt={100}>
        <Grid align="center" justify="center">
          <Grid.Col span={3}>
            <Center mt={10}>
              <GameCard game={nextGame} />
            </Center>
          </Grid.Col>
          <Grid.Col span={6}>
            <Paper shadow="sm" radius="lg" withBorder p="xl">
              <Center mt={10} mb={20}>
                <Hearts lives={mode.lives} livesLeft={mode.lives - 1} />
              </Center>
              <Center>
                <Group>
                  <Button variant="filled" color="red">
                    Released Before
                  </Button>
                  <Button variant="filled" color="blue">
                    Released After
                  </Button>
                </Group>
              </Center>
              <Center mt={20}>
                <Text size="sm" fw={500}>
                  NB: Ties are marked as correct either way
                </Text>
              </Center>
              <Center mt={20}>
                <Group gap="sm">
                  <Badge
                    size="lg"
                    variant="gradient"
                    gradient={{ from: 'blue', to: 'violet', deg: 100 }}
                  >
                    Streak: 0
                  </Badge>
                  <Badge
                    size="lg"
                    variant="gradient"
                    gradient={{ from: 'red', to: 'grape', deg: 100 }}
                  >
                    Max Streak: 0
                  </Badge>
                </Group>
              </Center>
              {/* <Center mt={10}>
                <Group gap="sm">
                  <Badge size="md" variant="filled" color="rgba(247, 59, 59, 1)">
                    Incorrect
                  </Badge>
                  <Badge size="md" variant="filled" color="rgba(26, 125, 6, 1)">
                    Correct
                  </Badge>
                </Group>
              </Center> */}
            </Paper>
          </Grid.Col>
          <Grid.Col span={3}>
            <Center mt={10}>
              <GameCard game={currentGame} />
            </Center>
          </Grid.Col>
        </Grid>
      </Container>
    </>
  );
}
