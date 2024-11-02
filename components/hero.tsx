'use client';

import { useState } from 'react';
import { Button, Center, Stack, Text, Title, Tooltip } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Modes } from '@/services/modes';
import classes from '@/styles/hero.module.css';
import { appinfo } from '@/utils/constants';

type Props = {
  modes: Modes;
};

export default function Hero(props: Props) {
  const { modes } = props;
  const [loading, { toggle }] = useDisclosure();
  const [clickedButton, setClickedButton] = useState<string | null>(null);
  const colors = ['rgba(128, 0, 0, 1)', 'rgba(17, 105, 128, 1)', 'violet'];

  const generateButtonKey = (label: string, index: number) => {
    return `${label}-${index}`;
  };

  const handleClick = (buttonKey: string) => {
    if (clickedButton === null) {
      setClickedButton(buttonKey);
      toggle();
    }
  };

  return (
    <>
      <Title className={classes.title} ta="center" mt={100}>
        <Text
          inherit
          variant="gradient"
          component="span"
          gradient={{ from: 'indigo', to: 'green' }}
        >
          Gaeldle
        </Text>
      </Title>
      <Text ta="center" size="xl" maw={580} mx="auto" mt="xl">
        {appinfo.description}
      </Text>

      <Center>
        <Stack h={300} w={300} bg="var(--mantine-color-body)" justify="center" gap="xl">
          {modes.map((mode, index) => {
            const buttonKey = generateButtonKey(mode.mode, index);
            const isClicked = clickedButton === buttonKey;

            return (
              <Tooltip
                label={mode.description}
                color={colors[index]}
                withArrow
                transitionProps={{ duration: 200 }}
                key={buttonKey}
              >
                <Button
                  variant="filled"
                  component="a"
                  href={`/${mode.mode}`}
                  color={colors[index]}
                  size="md"
                  onClick={() => handleClick(buttonKey)}
                  disabled={loading}
                  aria-disabled={loading}
                  loading={isClicked && loading}
                >
                  <Text c="white" fw={500}>
                    {mode.label}
                  </Text>
                </Button>
              </Tooltip>
            );
          })}
        </Stack>
      </Center>
    </>
  );
}
