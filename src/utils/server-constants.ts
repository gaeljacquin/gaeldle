const gSeconds = 10000;

function getLastSegment(requestUrl: string) {
  const url = new URL(requestUrl);
  const segments = url.pathname.split('/');
  const lastSegment = segments.pop() ?? '';

  return lastSegment;
}

/** Timestamp start */
const todayStart = new Date();
todayStart.setHours(0, 0, 0, 0);

const todayEnd = new Date();
todayEnd.setHours(23, 59, 59, 999);

const tomorrowStart = new Date(todayStart);
tomorrowStart.setDate(todayStart.getDate() + 1);

const tomorrowEnd = new Date(todayEnd);
tomorrowEnd.setDate(todayEnd.getDate() + 1);

const today = { start: todayStart, end: todayEnd };
const tomorrow = { start: tomorrowStart, end: tomorrowEnd };
/** Timestamp end */

const genKey = (key: string) => {
  if (process.env.NODE_ENV === 'development') {
    key += '_dev';
  }

  return key;
};

const bgTextSpecial1 = 'bg-gradient-to-r from-blue-500 to-teal-400';
const bgTextSpecial2 = 'bg-gradient-to-r from-gael-purple to-red-500';

const appinfo = {
  title: 'Gaeldle',
  description: 'A gaming-themed Wordle clone',
};

const whichList = (list?: unknown[]) => {
  return list ?? [0];
};

const bgIncorrect = 'bg-gael-red';
const bgPartial = 'bg-gradient-to-r from-gael-blue to-gael-purple';
const bgCorrect = 'bg-gael-green';
const bgOther1 = 'bg-gael-blue';
const bgOther2 = 'bg-indigo-500';

const fmTimelineContainer = {
  hidden: { opacity: 1, scale: 0 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      delayChildren: 0.3,
      staggerChildren: 0.2,
    },
  },
};

export {
  gSeconds,
  getLastSegment,
  genKey,
  today,
  tomorrow,
  bgTextSpecial1,
  bgTextSpecial2,
  appinfo,
  whichList,
  bgIncorrect,
  bgPartial,
  bgCorrect,
  bgOther1,
  bgOther2,
  fmTimelineContainer,
};
