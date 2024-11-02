'use client';

import { useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Center,
  CheckIcon,
  Combobox,
  Grid,
  Group,
  Image,
  Input,
  InputBase,
  Paper,
  Text,
  useCombobox,
} from '@mantine/core';
import Hearts from '@/components/hearts';
import ModeHeader from '@/components/mode-header';
import { Game, Games } from '@/services/games';
import { Mode } from '@/services/modes';

type Props = {
  mode: Mode;
  game: Game;
  games: Games;
};

function SelectOption(props: Partial<Game>) {
  const { name } = props;

  return (
    <Group>
      <div>
        <Text fz="sm">{name}</Text>
      </div>
    </Group>
  );
}

export default function Cover(props: Props) {
  const { mode, game, games } = props;
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });
  const colors = {
    from: 'cyan',
    to: 'green',
  };
  const [value, setValue] = useState<string | null>(null);
  const selectedGame = games.find((game) => String(game.igdbId) === value);
  const options = games.map((game, index) => (
    <Combobox.Option value={String(game.igdbId)} key={game.igdbId} disabled={index === 1}>
      <Group gap="xs">
        <SelectOption {...game} />
        {String(game.igdbId) === value && <CheckIcon size={12} />}
      </Group>
    </Combobox.Option>
  ));

  return (
    <>
      <ModeHeader mode={mode} colors={colors} />

      <Grid grow gutter="sm" p="lg" mt={50}>
        <Grid.Col span={6}>
          <Card shadow="sm" radius="md" withBorder w={512}>
            <Card.Section>
              <Paper>
                <Image src={game.imageUrl} alt="Game Cover" />
                <Center>
                  <Group gap="sm" mt={20} mb={20}>
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
              </Paper>
            </Card.Section>
          </Card>
        </Grid.Col>

        <Grid.Col span={6}>
          <Center mb={20}>
            <Hearts lives={mode.lives} livesLeft={mode.lives - 1} />
          </Center>
          <Grid my={20}>
            <Grid.Col span={8}>
              <Button variant="filled" color="teal" size="md" radius="md" fullWidth>
                Guess
              </Button>
            </Grid.Col>
            <Grid.Col span={4}>
              <Button variant="filled" color="black" size="md" radius="md" fullWidth>
                Clear
              </Button>
            </Grid.Col>
          </Grid>
          <>
            {/* <Box mb="xs">
              <Text span size="sm" c="dimmed">
                Selected game:{' '}
              </Text>

              <Text span size="sm">
                {selectedItem || 'Nothing selected'}
              </Text>
            </Box> */}

            <Combobox
              store={combobox}
              withinPortal={false}
              onOptionSubmit={(val) => {
                setValue(val);
                combobox.closeDropdown();
                combobox.updateSelectedOptionIndex('active');
              }}
              resetSelectionOnOptionHover
            >
              <Combobox.Target>
                <InputBase
                  component="button"
                  type="button"
                  pointer
                  rightSection={<Combobox.Chevron />}
                  onClick={() => combobox.toggleDropdown()}
                  rightSectionPointerEvents="none"
                >
                  {selectedGame ? (
                    <SelectOption {...selectedGame} />
                  ) : (
                    <Input.Placeholder>Select Game</Input.Placeholder>
                  )}
                </InputBase>
              </Combobox.Target>

              <Combobox.Dropdown>
                <Combobox.Options mah={200} style={{ overflowY: 'auto' }}>
                  {options.length === 0 ? <Combobox.Empty>Nothing found</Combobox.Empty> : options}
                </Combobox.Options>
              </Combobox.Dropdown>
            </Combobox>
          </>
        </Grid.Col>
      </Grid>
    </>
  );
}
