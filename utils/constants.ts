const appinfo = {
  title: 'Gaeldle',
  description: 'A gaming-themed Wordle clone',
};

const currentDate = new Date();
const currentYear = currentDate.getFullYear();

const whichList = (list: unknown[]) => {
  return list ?? [0];
};

const bgOther1 = 'bg-gael-blue';

export { appinfo, currentYear, whichList, bgOther1 };
