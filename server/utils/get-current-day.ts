const start = new Date();
start.setHours(0, 0, 0, 0);

const end = new Date();
end.setHours(23, 59, 59, 999);

const currentDay = { start: start, end: end };

const nextDay = new Date(start);
nextDay.setDate(start.getDate() + 1);
nextDay.setHours(0, 0, 0, 0);

export { currentDay, nextDay };
