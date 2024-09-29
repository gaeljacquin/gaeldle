const gSeconds = 10000;

function getLastSegment(requestUrl: string) {
  const url = new URL(requestUrl);
  const segments = url.pathname.split("/");
  const lastSegment = segments.pop() ?? "";

  return lastSegment;
}

const start = new Date();
const nextDay = new Date(start);
nextDay.setDate(start.getDate() + 1);
nextDay.setHours(0, 0, 0, 0);

const genKey = (key: string) => {
  if (process.env.NODE_ENV === "development") {
    key += "_dev";
  }

  key += `-${nextDay.toISOString().split("T")[0]}`;

  return key;
};

export { gSeconds, getLastSegment, genKey };
