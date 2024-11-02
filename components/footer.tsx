'use client';

import Link from 'next/link';
import { IconBrandGithub, IconBrandLinkedin } from '@tabler/icons-react';
import { ActionIcon, Anchor, Center, Container, Group, rem, Text } from '@mantine/core';
import LottieDynamic from '@/components/lottie-dynamic';
import classes from '@/styles/footer.module.css';
import { currentYear } from '@/utils/constants';

export default function Footer() {
  return (
    <div className={classes.footer}>
      <Container className={classes.inner}>
        <Center w={90} mt={7}>
          <Link href="https://gaeljacquin.com" target="_blank">
            <LottieDynamic loop />
          </Link>
        </Center>
        <Text size="sm" className={classes.description}>
          &copy; 2024{currentYear !== 2024 && `-${currentYear}`}{' '}
          <Anchor
            variant="gradient"
            href="https://gaeljacquin.com"
            underline="hover"
            target="_blank"
            fw={500}
            fz="md"
            gradient={{ from: 'pink', to: 'yellow' }}
          >
            Gaël Jacquin
          </Anchor>
          . All rights reserved.
        </Text>
        <Group gap={8} className={classes.links} justify="flex-end" wrap="nowrap">
          <ActionIcon
            component="a"
            size="lg"
            variant="gradient"
            aria-label="LinkedIn gradient action icon"
            gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
            href="https://linkedin.com/in/gaeljacquin"
          >
            <IconBrandLinkedin style={{ width: rem(24), height: rem(24) }} stroke={1.5} />
          </ActionIcon>
          <ActionIcon
            component="a"
            size="lg"
            aria-label="GitHub gradient action icon"
            gradient={{ from: 'gray', to: 'rgba(2, 17, 33, 1)', deg: 90 }}
            href="https://github.com/gaeljacquin"
          >
            <IconBrandGithub style={{ width: rem(24), height: rem(24) }} stroke={1.5} />
          </ActionIcon>
        </Group>
      </Container>
    </div>
  );
}
