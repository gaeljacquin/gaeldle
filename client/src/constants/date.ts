const currentDate = new Date();

export const currentYear = currentDate.getFullYear();

const startDate = new Date("2017-02-01T00:00:00Z"); // Using UTC to avoid timezone issues

// Calculate the difference in milliseconds
const differenceInMs = currentDate.getTime() - startDate.getTime();

// Convert the difference from milliseconds to years
const differenceInYears = differenceInMs / (1000 * 60 * 60 * 24 * 365.25);

export const yoe = Math.floor(differenceInYears);
