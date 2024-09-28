const gSeconds = 10000;

function getLastSegment(requestUrl: string) {
  const url = new URL(requestUrl);
  const segments = url.pathname.split("/");
  const lastSegment = segments.pop() ?? "";

  return lastSegment;
}

function genKey(key: string) {
  if (process.env.NODE_ENV === "development") {
    key += "_dev";
  }

  return key;
}

export { gSeconds, getLastSegment, genKey };
