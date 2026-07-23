/**
 * Check if image link is valid
 * @param imageUrl Image URL
 * @param timeout Timeout in milliseconds, default 5000ms
 * @returns Promise<boolean> Returns whether the image is valid
 */
export const validateImageLink = (imageUrl: string, timeout: number = 5000): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    // eslint-disable-next-line no-undef
    const timer: NodeJS.Timeout = setTimeout(() => {
      cleanup();
      resolve(false);
    }, timeout);

    const cleanup = () => {
      img.onload = null;
      img.onerror = null;
      if (timer) {
        clearTimeout(timer);
      }
    };

    // Image loaded successfully
    img.onload = () => {
      cleanup();
      resolve(true);
    };

    // Image loading failed
    img.onerror = () => {
      cleanup();
      resolve(false);
    };

    // Start loading image
    img.src = imageUrl;
  });
};
