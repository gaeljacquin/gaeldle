const bgIncorrect = 'bg-gael-red';
const bgPartial = 'bg-yellow-600';
const bgCorrect = 'bg-gael-green';
const bgOther1 = 'bg-gael-blue';
const bgOther2 = 'bg-indigo-500';
const testGameIgdbIds = process.env.TEST_GAME_IGDB_IDS.split(',')
  .map((id) => parseInt(id.trim(), 10))
  .filter((id) => !isNaN(id)) ?? [0];

export {
  bgIncorrect,
  bgPartial,
  bgCorrect,
  bgOther1,
  bgOther2,
  testGameIgdbIds,
};
