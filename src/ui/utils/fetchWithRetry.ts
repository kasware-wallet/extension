const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1_000;

/**
 * Fetch with timeout, retry, and optional fallback URLs.
 * Tries the primary URL first, then fallback URLs on failure.
 * Each attempt uses AbortController for timeout.
 */
export async function fetchWithRetryAndFallback(
  urls: string[],
  options?: RequestInit,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
  maxRetries: number = DEFAULT_MAX_RETRIES
): Promise<Response> {
  let lastError: Error | null = null;

  for (const url of urls) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          return response;
        }

        // Non-retryable status codes: don't waste retries on 4xx
        if (response.status >= 400 && response.status < 500) {
          lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
          break; // Skip to next URL
        }

        lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
      } catch (e) {
        clearTimeout(timeoutId);
        if (controller.signal.aborted) {
          lastError = new Error(`Request timed out after ${timeoutMs}ms`);
        } else {
          lastError = e instanceof Error ? e : new Error(String(e));
        }
      }

      // Wait before retrying (skip delay on last attempt)
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }
  }

  throw lastError
    ? new Error(`All fetch attempts failed. Last error: ${lastError.message}`)
    : new Error('All fetch attempts failed');
}
