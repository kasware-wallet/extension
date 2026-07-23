import log from 'loglevel';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 10_000;

async function fetchWithRetry(url: string, retries = MAX_RETRIES): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
      }
      return response;
    } catch (e) {
      if (attempt < retries) {
        log.warn(`Fetch failed (attempt ${attempt + 1}/${retries + 1}), retrying in ${RETRY_DELAY_MS / 1000}s: ${url}`);
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      } else {
        throw e;
      }
    }
  }
  throw new Error('Unreachable');
}

export async function getJson(jsonUrl: string): Promise<any | undefined> {
  try {
    const response = await fetchWithRetry(jsonUrl);
    return await response.json();
  } catch (e) {
    log.error(e);
    throw new Error('Network response issue: ' + (e as Error).message);
  }
}

export async function getBase64JSON(jsonUrl: string): Promise<any | undefined> {
  try {
    const response = await fetchWithRetry(jsonUrl);
    const data = await response.json();
    const content = data.content;
    const decoded = Buffer.from(content, 'base64');
    const str = decoded.toString();
    return JSON.parse(str);
  } catch (e) {
    log.error(e);
    throw new Error('Network response issue: ' + (e as Error).message);
  }
}
