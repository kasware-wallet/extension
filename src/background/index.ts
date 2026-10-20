import { openExtensionInTab } from '@/shared/browser';
import { KASPA_EVENTS, MANIFEST_VERSION } from '@/shared/constant';
import eventBus from '@/shared/eventBus';
import { Message } from '@/shared/utils';
import '@/shared/utils/logger';
import { ethErrors } from 'eth-rpc-errors';
import 'reflect-metadata';
import browser from 'webextension-polyfill';
import { browserRuntimeOnConnect, browserRuntimeOnInstalled } from '../shared/webapi/browser';
import { providerController, walletController } from './controller';
import {
  contactBookService,
  keyringService,
  openapiService,
  permissionService,
  preferenceService,
  sessionService
} from './service';
import { initLocalStorageService } from './service/localStorageService';
import { storage } from './webapi';

const { PortMessage } = Message;

/**
 * The origin a port's sender URL belongs to — the key every permission, session and approval is stored
 * under, so it must come from the browser and never from the page.
 *
 * A url that `new URL` cannot parse answers `''` rather than throwing: `''` matches no permission, so the
 * request fails closed, while a throw here would take down the whole port listener.
 */
const getOriginFromUrl = (url: string) => {
  try {
    return new URL(url).origin;
  } catch {
    return '';
  }
};

let appStoreLoaded = false;
async function restoreAppState() {
  const keyringState = await storage.get('keyringState');
  keyringService.loadStore(keyringState);
  keyringService.store.subscribe((value) => storage.set('keyringState', value));
  await keyringService.initKapaWasm();

  await preferenceService.init();

  await openapiService.init();

  await permissionService.init();

  await contactBookService.init();
  // Initialize localStorage service for background to access UI's localStorage
  // Note: This only works when UI (popup/notification/tab) is open
  initLocalStorageService();

  appStoreLoaded = true;

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'getBackgroundReady') {
      sendResponse({
        data: {
          ready: true
        }
      });
    }
  });

}

restoreAppState();

// for page provider
browserRuntimeOnConnect((port) => {
  if (port.name === 'popup' || port.name === 'notification' || port.name === 'tab') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pm = new PortMessage(port as any);
    pm.listen((data) => {
      // log.debug('type',data?.type,data?.method,data?.params)
      if (!appStoreLoaded) {
        throw ethErrors.provider.disconnected();
      }
      if (data?.type) {
        switch (data.type) {
          case 'broadcast':
            eventBus.emit(data.method, data.params);
            break;
          case 'openapi':
            if (walletController.openapi[data.method]) {
              return walletController.openapi[data.method].apply(null, data.params);
            }
            break;
          case 'controller':
          default:
            if (data.method && walletController[data.method]) {
              return walletController[data.method].apply(null, data.params);
            }
        }
      }
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const boardcastCallback = (data: any) => {
      pm.request({
        type: 'broadcast',
        method: data.method,
        params: data.params
      });
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sendToUICallback = (data: { method: any; params: any }) => {
      pm.request({
        type: 'sendToUI',
        method: data.method,
        params: data.params
      });
    };

    if (port.name === 'popup') {
      preferenceService.setPopupOpen(true);

      port.onDisconnect.addListener(() => {
        preferenceService.setPopupOpen(false);
      });
    }

    eventBus.addEventListener(KASPA_EVENTS.broadcastToUI, boardcastCallback);
    eventBus.addEventListener(KASPA_EVENTS.sendToUI, sendToUICallback);
    port.onDisconnect.addListener(() => {
      eventBus.removeEventListener(KASPA_EVENTS.broadcastToUI, boardcastCallback);
      eventBus.removeEventListener(KASPA_EVENTS.sendToUI, sendToUICallback);
      // gradually close rpc when popup window is closed --shwan
      openapiService.countDownToCloseRpc();
    });

    return;
  }
  if (!port.sender?.tab) {
    return;
  }
  const pm = new PortMessage(port);

  pm.listen(async (data) => {
    if (!appStoreLoaded) {
      throw ethErrors.provider.disconnected();
    }
    const sessionId = port.sender?.tab?.id;
    let result;
    if (data.form === 'evm') {
      const origin = getOriginFromUrl(port.sender.url);
      const session = sessionServiceEVM.getOrCreateSession(sessionId, origin);
      const req = { data, session, origin };
      if (!session?.origin) {
        const tabInfo = await browser.tabs.get(sessionId);
        // prevent tabCheckin not triggered, re-fetch tab info when session have no info at all
        session?.setProp({
          origin,
          name: tabInfo.title || '',
          icon: tabInfo.favIconUrl || ''
        });
      }
      // for background push to respective page
      req.session!.setPortMessage(pm);
      if (
        subscriptionManager.methods[data?.method] &&
        permissionService.getConnectedSite(session!.origin)?.isConnected
      ) {
        return subscriptionManager.methods[data.method].call(null, req);
      }
      result = providerControllerEVM(req);
    } else {
      // Stamped from the port's sender URL, never from the page: `origin` keys every permission, session
      // and approval below this line, and `tabCheckin` used to set it from page-supplied params, so a page
      // could check in as another site and inherit its grants. The EVM branch above never had that shape.
      const senderOrigin = getOriginFromUrl(port.sender?.url || '');
      const session = sessionService.getOrCreateSession(sessionId, senderOrigin);

      const req = { data, session };
      // for background push to respective page
      req.session.pushMessage = (event, data) => {
        pm.send('kaspa_message', { event, data });
      };
      result = await providerController(req);
    }
    // if (result) result.form = 'evm'
    return result;
  });

  port.onDisconnect.addListener(() => {
    // todo
  });
});

const addAppInstalledEvent = () => {
  if (appStoreLoaded) {
    openExtensionInTab();
    return;
  }
  setTimeout(() => {
    addAppInstalledEvent();
  }, 1000);
};

browserRuntimeOnInstalled((details) => {
  if (details.reason === 'install') {
    addAppInstalledEvent();
  }
});

if (MANIFEST_VERSION === 'mv3') {
  // Keep alive for MV3
  const INTERNAL_STAYALIVE_PORT = 'CT_Internal_port_alive';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let alivePort: any = null;

  setInterval(() => {
    // log.debug('Highlander', Date.now());
    if (alivePort == null) {
      // eslint-disable-next-line no-undef
      alivePort = chrome.runtime.connect({ name: INTERNAL_STAYALIVE_PORT });

      // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
      alivePort.onDisconnect.addListener((p: any) => {
        // eslint-disable-next-line no-undef
        if (chrome.runtime.lastError) {
          // log.debug('(DEBUG Highlander) Expected disconnect (on error). SW should be still running.',p);
        } else {
          // log.debug('(DEBUG Highlander): port disconnected',p);
        }

        alivePort = null;
      });
    }

    if (alivePort) {
      alivePort.postMessage({ content: 'keep alive~' });

      // eslint-disable-next-line no-undef
      if (chrome.runtime.lastError) {
        // log.debug(`(DEBUG Highlander): postMessage error: ${chrome.runtime.lastError.message}`);
      } else {
        // log.debug(`(DEBUG Highlander): sent through ${alivePort.name} port`);
      }
    }
  }, 5000);
}
