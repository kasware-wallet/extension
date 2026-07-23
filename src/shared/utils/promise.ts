export const promiseWithTimeout = <T>(promise: Promise<T>, ms = 5000): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Request timed out')), ms);
    promise
      .then((result: T) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((err: any) => {
        clearTimeout(timer);
        reject(err);
      });
  });
};
