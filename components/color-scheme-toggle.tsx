'use client';

import { IconMoonStars, IconSun } from '@tabler/icons-react';
import { ActionIcon, useMantineColorScheme } from '@mantine/core';

export function ColorSchemeToggle() {
  const { colorScheme, setColorScheme } = useMantineColorScheme();

  return (
    <>
      {colorScheme === 'dark' && (
        <ActionIcon variant="dark" aria-label="Sun" onClick={() => setColorScheme('light')}>
          <IconSun style={{ width: '70%', height: '70%' }} stroke={1.5} />
        </ActionIcon>
      )}
      {colorScheme === 'light' && (
        <ActionIcon variant="light" aria-label="Moon" onClick={() => setColorScheme('dark')}>
          <IconMoonStars style={{ width: '70%', height: '70%' }} stroke={1.5} />
        </ActionIcon>
      )}
    </>
  );
}
