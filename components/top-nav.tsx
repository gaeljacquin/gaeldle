'use client';

import Link from 'next/link';
import { IconChevronDown } from '@tabler/icons-react';
import { Burger, Center, Container, Group, Menu } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import AboutModal from '@/components/about-modal';
import { ColorSchemeToggle } from '@/components/color-scheme-toggle';
import LottieDynamic from '@/components/lottie-dynamic';
import { type Mode, type Modes } from '@/services/modes';
import classes from '@/styles/top-nav.module.css';

type Props = {
  modes: Modes;
};

export default function TopNav(props: Props) {
  const { modes } = props;
  const aboutModal = () => {
    return <AboutModal />;
  };
  const links = [
    { link: '/', label: 'Home', modal: null },
    { link: '#', label: 'About', modal: aboutModal },
    {
      link: '#',
      label: 'Modes',
      links: modes.map((mode: Mode) => {
        return { link: `/${mode.mode ?? ''}`, label: mode.label ?? '', modal: null };
      }),
    },
  ];
  const [opened, { toggle }] = useDisclosure(false);

  const items = links.map((link) => {
    const menuItems = link.links?.map((item) => (
      <Menu.Item key={item.link}>{item.label}</Menu.Item>
    ));

    if (menuItems) {
      return (
        <Menu key={link.label} transitionProps={{ exitDuration: 0 }} withinPortal>
          <Menu.Target>
            <a href={link.link} className={classes.link} aria-label={link.label}>
              <span className={classes.linkLabel}>{link.label}</span>
              <IconChevronDown size="0.9rem" stroke={1.5} />
            </a>
          </Menu.Target>
          <Menu.Dropdown>{menuItems}</Menu.Dropdown>
        </Menu>
      );
    }

    if (link.modal) {
      return (
        <a
          key={link.label}
          href={link.link}
          className={classes.link}
          onClick={(event) => event.preventDefault()}
        >
          {link.modal()}
        </a>
      );
    }

    return (
      <a key={link.label} href={link.link} className={classes.link}>
        {link.label}
      </a>
    );
  });

  return (
    <header className={classes.header}>
      <Container size="md">
        <div className={classes.inner}>
          <Center w={90} mt={7}>
            <Link href="https://gaeljacquin.com" target="_blank">
              <LottieDynamic loop={false} />
            </Link>
          </Center>
          <Group gap={5} visibleFrom="sm">
            {items}
            <ColorSchemeToggle />
          </Group>
          <Burger opened={opened} onClick={toggle} size="sm" hiddenFrom="sm" />
        </div>
      </Container>
    </header>
  );
}
