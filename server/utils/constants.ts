const bgIncorrect = 'bg-gael-red';
const bgPartial = 'bg-gradient-to-r from-gael-blue to-gael-purple';
const bgCorrect = 'bg-gael-green';
const bgOther1 = 'bg-gael-blue';
const bgOther2 = 'bg-indigo-500';
const testGameIgdbIds = process.env.TEST_GAME_IGDB_IDS.split(',')
  .map((id) => parseInt(id.trim(), 10))
  .filter((id) => !isNaN(id)) ?? [0];

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

const cacheDuration = 6000 * 48; // 48 hours

const whichList = (list: unknown[]) => {
  return list ?? [0];
};

export {
  bgIncorrect,
  bgPartial,
  bgCorrect,
  bgOther1,
  bgOther2,
  testGameIgdbIds,
  today,
  tomorrow,
  cacheDuration,
  whichList,
};
