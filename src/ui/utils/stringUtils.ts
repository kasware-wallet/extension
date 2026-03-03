export const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch (err) {
    return false;
  }
};

export function isValidWsUrl(url) {
  if (typeof url !== 'string') return false; // Check if it's a string first
  try {
    const parsedUrl = new URL(url);
    // Protocol must be ws or wss
    return parsedUrl.protocol === 'ws:' || parsedUrl.protocol === 'wss:';
  } catch (err) {
    return false; // Invalid URL format
  }
}
