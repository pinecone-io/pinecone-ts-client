import { sleep } from '../integration/testHelpers';

export const retry = async (
  asyncFn: () => Promise<any>,
  maxRetries: number = 5,
  delay: number = 3000,
  sleepFn = sleep
) => {
  let attempts = 0;

  while (attempts < maxRetries) {
    try {
      return await asyncFn();
    } catch (error) {
      attempts++;
      if (attempts < maxRetries) {
        const expDelay = delay * Math.pow(2, attempts - 1); // Exponential backoff
        await sleepFn(expDelay);
      } else {
        throw error as Error;
      }
    }
  }
};
