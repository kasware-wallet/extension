/**
 * localStorage provider for background service worker
 * Handles localStorage requests from background via port connection
 */

const WINDOW_PROVIDER_PORT = 'kasware-window-port';

// localStorage method handlers
const localStorageHandlers: Record<string, (...args: any[]) => any> = {
  localStorage_getItem: (key: string): string | null => {
    return localStorage.getItem(key);
  },
  localStorage_setItem: (key: string, value: string): void => {
    localStorage.setItem(key, value);
  },
  localStorage_removeItem: (key: string): void => {
    localStorage.removeItem(key);
  },
  localStorage_clear: (): void => {
    localStorage.clear();
  },
  localStorage_getAllKeys: (): string[] => {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        keys.push(key);
      }
    }
    return keys;
  }
};

/**
 * Initialize the localStorage provider
 * Connects to background and listens for localStorage requests
 */
export function initLocalStorageProvider(): void {
  // Only run in extension context
  if (typeof chrome === 'undefined' || !chrome.runtime?.id) {
    return;
  }

  const port = chrome.runtime.connect({ name: WINDOW_PROVIDER_PORT });

  port.onMessage.addListener((message) => {
    // Parse message if it's a JSON string (from background with shouldUseJson=true)
    let parsedMessage = message;
    if (typeof message === 'string') {
      try {
        parsedMessage = JSON.parse(message);
      } catch (e) {
        console.error('Failed to parse message from background:', e);
        return;
      }
    }

    const { type, messageId, name, args, channel } = parsedMessage;

    // Handle method requests from background
    if (type === 'methodCall' && name) {
      const handler = localStorageHandlers[name];
      if (handler) {
        try {
          const result = handler(...(args || []));
          // Send response back to background
          port.postMessage({
            type: 'methodResponse',
            messageId,
            response: result,
            channel
          });
        } catch (error: any) {
          port.postMessage({
            type: 'methodResponse',
            messageId,
            error: {
              message: error.message,
              stack: error.stack
            },
            channel
          });
        }
      }
    }
  });

  port.onDisconnect.addListener(() => {
    // Port disconnected, could try to reconnect if needed
    console.debug('localStorage provider disconnected');
  });
}
