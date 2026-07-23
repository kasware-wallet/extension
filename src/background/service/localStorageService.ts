/**
 * localStorage service for background service worker
 * Uses callWindow to access localStorage via UI context
 */


let isInitialized = false;

/**
 * Initialize the localStorage service
 * Must be called before using localStorage methods
 */
export function initLocalStorageService(): void {
  if (isInitialized) {
    return;
  }
  isInitialized = true;
}

/**
 * Check if localStorage service is available
 * Returns true if UI context is connected
 */
export function isLocalStorageServiceAvailable(): boolean {
  return isInitialized;
}
