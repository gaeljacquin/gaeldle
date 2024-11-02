'use client';

import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import cx from 'clsx';
import { Badge, Button, Center, Container, Flex, Group } from '@mantine/core';
import { useListState } from '@mantine/hooks';
import GameCard from '@/components/game-card';
import Hearts from '@/components/hearts';
import ModeHeader from '@/components/mode-header';
import { Game } from '@/services/games';
import { Mode } from '@/services/modes';
import classes from '@/styles/DndList.module.css';

type Props = {
  mode: Mode;
  games: Partial<Game>[];
};

const colors = {
  from: 'pink',
  to: 'lime',
};

export default function Timeline(props: Props) {
  const { mode, games } = props;
  const [state, handlers] = useListState(games);

  const items = state.map((game, index) => (
    <Draggable key={game.igdbId} index={index} draggableId={String(game.igdbId)}>
      {(provided, snapshot) => (
        <div
          className={cx(classes.item, {
            [classes.itemDragging]: snapshot.isDragging,
          })}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          ref={provided.innerRef}
        >
          <GameCard game={game} />
        </div>
      )}
    </Draggable>
  ));

  return (
    <>
      <ModeHeader mode={mode} colors={colors} />
      <Container mt={100}>
        <Center mb={20}>
          <Hearts lives={mode.lives} livesLeft={mode.lives - 1} />
        </Center>
        <Group gap="sm" mb={40} align="center" justify="center">
          <Badge size="lg" variant="filled" color="red">
            Incorrect
          </Badge>
          <Badge size="lg" variant="gradient" gradient={{ from: 'pink', to: 'grape', deg: 200 }}>
            Displaced
          </Badge>
          <Badge size="lg" variant="filled" color="green">
            Correct
          </Badge>
        </Group>
        <DragDropContext
          onDragEnd={({ destination, source }) =>
            handlers.reorder({ from: source.index, to: destination?.index || 0 })
          }
        >
          <Droppable droppableId="dnd-list" direction="horizontal">
            {(provided) => (
              <Flex
                mih={400}
                {...provided.droppableProps}
                ref={provided.innerRef}
                gap="md"
                justify="center"
                align="center"
                direction="row"
                wrap="nowrap"
              >
                {items}
                {provided.placeholder}
              </Flex>
            )}
          </Droppable>
        </DragDropContext>

        <Group gap="md" align="center" justify="center" mt={50}>
          <Button variant="filled" color="teal" size="md" radius="md">
            Guess
          </Button>
          <Button variant="filled" color="black" size="md" radius="md">
            Clear
          </Button>
        </Group>
      </Container>
    </>
  );
}
