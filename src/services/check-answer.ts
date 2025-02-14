import { Game, Games } from '@/services/games';
import { getCoverVal, getHiloVal, getTimelineVal } from '@/services/redis';
import { Operator } from '@/types/zhilo';
import { bgCorrect, bgIncorrect, bgOther2, bgPartial } from '@/utils/server-constants';

export type coverCheckAnswerProps = {
  key: string;
  igdbId: number;
  livesLeft: number;
};

export type hiloCheckAnswerProps = {
  key: string;
  game: Game;
  operator: Operator;
};

export type timelineCheckAnswerProps = {
  key: string;
  timeline: Partial<Game>[];
  livesLeft: number;
};

export async function coverCheckAnswer(props: coverCheckAnswerProps): Promise<unknown> {
  const { key, igdbId, livesLeft } = props;
  const val = (await getCoverVal(key)) as Game;

  if (!val) {
    return val;
  }

  const answer = igdbId === val.igdbId;
  const correctIgdbId = answer ? val.igdbId : 0;
  const correctName = answer ? val.name : '';
  const extra = livesLeft === 0 ? { igdbId: val.igdbId, name: val.name } : {};

  return { igdbId: correctIgdbId, name: correctName, extra };
}

export async function hiloCheckAnswer(props: hiloCheckAnswerProps) {
  const { key, game, operator } = props;
  const val = (await getHiloVal(key, ['frd', 'frdFormatted'])) as Partial<Game>;
  let answer: boolean;

  if (!val) {
    return val;
  }

  switch (operator) {
    case '>':
      answer = (val.frd ?? 0) >= game.frd;
      break;
    case '<':
      answer = (val.frd ?? 0) <= game.frd;
      break;
    default:
      answer = false;
      break;
  }

  const bgStatus = answer ? bgCorrect : bgIncorrect;

  return { answer, frd: val.frd, frdFormatted: val.frdFormatted, bgStatus };
}

export async function timelineCheckAnswer(props: timelineCheckAnswerProps) {
  const { key, timeline, livesLeft } = props;
  const correctTimeline = (await getTimelineVal(key)) as Game[];

  if (!correctTimeline) {
    return correctTimeline;
  }

  let answer = true;
  let goodTimeline: Games = [];

  const updatedTimeline = timeline.map((card, index) => {
    if (card.igdbId === correctTimeline[index].igdbId) {
      return {
        ...card,
        bgStatus: bgCorrect,
        frd: correctTimeline[index].frd,
        frdFormatted: correctTimeline[index].frdFormatted,
        correctIndex: index,
      };
    } else {
      if (answer) {
        answer = false;
      }

      const listLength = (correctTimeline as []).length;
      const correctIndex = (correctTimeline as []).findIndex(
        (game: Game) => game.igdbId === card.igdbId
      );
      const positionDifference = Math.abs(index - correctIndex);
      const proximity = ((listLength - positionDifference) / listLength) * 100;

      return {
        ...card,
        bgStatus: card.frd ? bgPartial : bgIncorrect,
        latestIndex: index,
        proximity,
      };
    }
  });

  const gameOver = !answer && livesLeft === 0;

  if (gameOver) {
    goodTimeline = correctTimeline.map((game: Game) => {
      return {
        ...game,
        bgStatus: bgOther2,
      };
    });
  } else if (answer) {
    goodTimeline = correctTimeline.map((game: Game) => {
      return {
        ...game,
        bgStatus: bgCorrect,
      };
    });
  }

  return { answer, updatedTimeline, goodTimeline };
}
