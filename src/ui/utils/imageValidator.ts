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

/**
 * Batch validate image links
 * @param imageUrls Array of image URLs
 * @param timeout Timeout for each link in milliseconds
 * @param concurrency Concurrency number, default 5
 * @returns Promise<{url: string, isValid: boolean}[]> Returns validation result for each URL
 */
export const batchValidateImageLinks = async (
  imageUrls: string[],
  timeout: number = 5000,
  concurrency: number = 5
): Promise<{ url: string; isValid: boolean }[]> => {
  const results: { url: string; isValid: boolean }[] = [];

  // Process in batches to avoid too many simultaneous requests
  for (let i = 0; i < imageUrls.length; i += concurrency) {
    const batch = imageUrls.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(async (url) => ({
        url,
        isValid: await validateImageLink(url, timeout)
      }))
    );
    results.push(...batchResults);
  }

  return results;
};

/**
 * Use fetch to check image link (backup solution)
 * @param imageUrl Image URL
 * @param timeout Timeout in milliseconds, default 5000ms
 * @returns Promise<boolean> Returns whether the image is valid
 */
export const validateImageLinkWithFetch = async (imageUrl: string, timeout: number = 5000): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(imageUrl, {
      method: 'HEAD',
      signal: controller.signal,
      mode: 'no-cors' // Use no-cors mode due to CORS restrictions
    });

    clearTimeout(timer);

    // In no-cors mode, we cannot get specific response status
    // But if we can reach here, it means at least a connection was established
    return true;
  } catch (error) {
    // If it's AbortError, it means timeout
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn(`Image validation timeout for ${imageUrl}`);
    }
    return false;
  }
};
