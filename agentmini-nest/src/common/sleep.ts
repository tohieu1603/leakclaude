// Promise-based sleep used by retry/backoff helpers
export const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));
