import Link from 'next/link';
import { Center, Flex, Modal, Paper, Text, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

export default function AboutModal() {
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <>
      <Modal opened={opened} onClose={close} title="Gaeldle">
        <Center>
          <Title order={4}>About</Title>
        </Center>
        <Flex justify="flex-start" align="flex-start">
          <Text mt={10}>
            A game celebrating games, for casual and hardcore gamers alike! Inspired by{' '}
            <Link
              href="https://www.nytimes.com/games/wordle/index.html"
              target="_blank"
              className="text-gael-blue hover:text-gael-blue-dark hover:underline"
            >
              Wordle
            </Link>
            ,{' '}
            <Link
              href="https://wikitrivia.tomjwatson.com/"
              target="_blank"
              className="text-gael-blue hover:text-gael-blue-dark hover:underline"
            >
              Wiki Trivia
            </Link>
            ,{' '}
            <Link
              href="https://www.gamedle.wtf/?lang=en"
              target="_blank"
              className="text-gael-blue hover:text-gael-blue-dark hover:underline"
            >
              Gamedle
            </Link>
            , and{' '}
            <Link
              href="https://medium.com/floodgates/the-complete-and-authoritative-list-of-wordle-spinoffs-fb00bfafc448"
              target="_blank"
              className="text-gael-blue hover:text-gael-blue-dark hover:underline"
            >
              all the other spinoffs
            </Link>
            .
          </Text>
        </Flex>
        {/* <Text>
            New games and artwork are picked daily from an ever-growing list of
            games. The list, cover images and artwork are sourced from{" "}
            <Link
              href="https://www.igdb.com/"
              target="_blank"
              className="text-gael-blue hover:text-gael-blue-dark hover:underline"
            >
              IGDB
            </Link>
            .
          </Text> */}
        <Flex justify="flex-start">
          <Text mt={10}>
            All rights go to the rightful owners - no copyright infringement intended.
          </Text>
        </Flex>
        <Flex justify="flex-start">
          <Text mt={10}>
            View our{' '}
            <Link
              href="/privacy"
              className="text-gael-blue hover:text-gael-blue-dark hover:underline"
            >
              Privacy Policy
            </Link>{' '}
            and{' '}
            <Link href="/tos" className="text-gael-blue hover:text-gael-blue-dark hover:underline">
              Terms of Service
            </Link>
          </Text>
        </Flex>
      </Modal>

      <Paper onClick={open}>About</Paper>
    </>
  );
}
