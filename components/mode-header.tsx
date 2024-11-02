import { Text, Title } from '@mantine/core';
import { Mode } from '@/services/modes';
import classes from '@/styles/hero.module.css';

type Props = {
  mode: Mode;
  colors: {
    from: string;
    to: string;
  };
};

export default function ModeHeader(props: Props) {
  const { mode, colors } = props;

  return (
    <>
      <Title className={classes.title} ta="center" mt={-50} order={2}>
        <Text
          inherit
          variant="gradient"
          component="span"
          gradient={{ from: colors.from, to: colors.to }}
        >
          {mode.label}
        </Text>
        {mode.description && <Text mt={10}>{mode.description}</Text>}
      </Title>
    </>
  );
}
