import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { bgTextSpecial1, bgTextSpecial2 } from '@/utils/server-constants';

const textVictory = 'You got it! 😀';
const textGameOver = 'Game over 😭';
const textFlawlessVictory = 'Flawless victory! 😎';
const imgWidth = 600;
const imgHeight = 600;
const imgAlt = (alt: string) => {
  return `Game of the Day - ${alt}`;
};

const GamesFormInit = () => {
  return useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });
};

const FormSchema = z.object({
  game: z.object({
    igdbId: z.number({
      required_error: 'Please select a game',
    }),
    name: z.string({
      required_error: 'Please select a game',
    }),
  }),
});

const bgIncorrect = 'bg-gael-red';
const bgPartial = 'bg-gradient-to-r from-gael-blue to-gael-purple';
const bgCorrect = 'bg-gael-green';
const bgOther1 = 'bg-gael-blue';
const bgOther2 = 'bg-indigo-500';

const cardImgSize = 128;
const cardImgClasses = 'w-full h-48 object-cover';
const cardImgClassesAlt = 'w-full h-96 object-cover';

const textSubmit = 'Submit';
const textAlreadyGuessed = 'Already guessed';
const textTryAgain = 'Try again';
const textStartingPosition = 'Starting position';

const currentDate = new Date();
const currentYear = currentDate.getFullYear();
const startDate = new Date('2017-02-01T00:00:00Z'); // Using UTC to avoid timezone issues
// Calculate the difference in milliseconds
const differenceInMs = currentDate.getTime() - startDate.getTime();
// Convert the difference from milliseconds to years
const differenceInYears = differenceInMs / (1000 * 60 * 60 * 24 * 365.25);
const yoe = Math.floor(differenceInYears);

// Badge groups
const levels = [
  { text: 'Easy', backgroundClass: bgCorrect },
  { text: 'Moderate', backgroundClass: bgPartial },
  { text: 'Hard', backgroundClass: bgIncorrect },
];
const timelineLegend = [
  { text: 'Incorrect', backgroundClass: bgIncorrect },
  { text: 'Displaced', backgroundClass: bgPartial },
  { text: 'Correct', backgroundClass: bgCorrect },
];
const timeline2Legend = [
  { text: 'Incorrect', backgroundClass: bgIncorrect },
  { text: 'Correct', backgroundClass: bgCorrect },
];
const streakCounters = (streak: number, bestStreak: number) => {
  return [
    { text: `Streak: ${streak}`, backgroundClass: bgTextSpecial1 },
    { text: `Best Streak: ${bestStreak}`, backgroundClass: bgTextSpecial2 },
  ];
};

const placeholderImage = {
  url: 'https://fakeimg.pl/512x720?text=?',
  alt: 'Placeholder Image',
};

export {
  bgCorrect,
  bgIncorrect,
  bgOther1,
  bgOther2,
  bgPartial,
  cardImgClasses,
  cardImgClassesAlt,
  cardImgSize,
  currentYear,
  FormSchema,
  imgHeight,
  imgWidth,
  levels,
  placeholderImage,
  textAlreadyGuessed,
  textFlawlessVictory,
  textGameOver,
  textStartingPosition,
  textSubmit,
  textTryAgain,
  textVictory,
  timeline2Legend,
  timelineLegend,
  yoe,
  GamesFormInit,
  imgAlt,
  streakCounters,
};
