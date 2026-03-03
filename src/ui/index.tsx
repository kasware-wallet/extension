/* eslint-disable @typescript-eslint/no-explicit-any */
import message from 'antd/lib/message';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';

import browser from '@/shared/webapi/browser';
import '@/evm/ui/style/index.less';
import { updateChainStore } from '@/utils/chain';
import { KASPA_EVENTS } from '@/shared/constant';
import eventBus from '@/shared/eventBus';
import { Message } from '@/shared/utils';
import '@/shared/utils/logger';
import AccountUpdater from '@/ui/state/accounts/updater';
import '@/ui/styles/global.less';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';

import { ActionComponentProvider } from './components/ActionComponent';
import AsyncMainRoute from './pages/MainRoute';
import store from './state';
import { initBizStore, initWallet } from './state/models/app';
import { chainsActions, chainsInit } from './state/models/chains';
import { getUITypeName, WalletProvider } from './utils';
import i18n from './utils/i18n';
import type { WalletController } from '@/ui/utils';

// disabled sentry
// Sentry.init({
//   dsn: 'https://15ca58bf532f4234a2f400cd11edfa2f@o4504750033403904.ingest.sentry.io/4505044300201984',
//   integrations: [new Sentry.BrowserTracing(), new Sentry.Replay()],
//   // Performance Monitoring
//   tracesSampleRate: 1.0, // Capture 100% of the transactions, reduce in production!
//   // Session Replay
//   replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
//   replaysOnErrorSampleRate: 1.0 // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
// });

// import 'default-passive-events'

// const AsyncMainRoute = lazy(() => import('./pages/MainRoute'));

message.config({
  maxCount: 1
});

// For fix chrome extension render problem in external screen
if (
  // From testing the following conditions seem to indicate that the popup was opened on a secondary monitor
  window.screenLeft < 0 ||
  window.screenTop < 0 ||
  window.screenLeft > window.screen.width ||
  window.screenTop > window.screen.height
) {
  browser.runtime.getPlatformInfo().then(function (info) {
    if (info.os === 'mac') {
      const fontFaceSheet = new CSSStyleSheet();
      fontFaceSheet.insertRule(`
        @keyframes redraw {
          0% {
            opacity: 1;
          }
          100% {
            opacity: .99;
          }
        }
      `);
      fontFaceSheet.insertRule(`
        html {
          animation: redraw 1s linear infinite;
        }
      `);
      (document as any).adoptedStyleSheets = [...(document as any).adoptedStyleSheets, fontFaceSheet];
    }
  });
}

const { PortMessage } = Message;

const portMessageChannel = new PortMessage();

// portMessageChannel.connect('popup');
portMessageChannel.connect(getUITypeName());

const wallet = new Proxy(
  {},
  {
    get(obj, key) {
      switch (key) {
        case 'openapi':
          return new Proxy(
            {},
            {
              get(obj, key) {
                return function (...params: any) {
                  return portMessageChannel.request({
                    type: 'openapi',
                    method: key,
                    params
                  });
                };
              }
            }
          );
          break;
        case 'openapiEVM':
          return new Proxy(
            {},
            {
              get(obj, key) {
                return function (...params: any) {
                  return portMessageChannel.request({
                    type: 'openapiEVM',
                    method: key,
                    params
                  });
                };
              }
            }
          );
          break;
        case 'walletEVM':
          return new Proxy(
            {},
            {
              get(obj, key) {
                return function (...params: any) {
                  return portMessageChannel.request({
                    type: 'walletEVM',
                    method: key,
                    params
                  });
                };
              }
            }
          );
          break;
          break;
        case 'testnetOpenapiEVM':
          return new Proxy(
            {},
            {
              get(obj, key) {
                return function (...params: any) {
                  return portMessageChannel.request({
                    type: 'testnetOpenapiEVM',
                    method: key,
                    params
                  });
                };
              }
            }
          );
          break;
        case 'fakeTestnetOpenapiEVM':
          return new Proxy(
            {},
            {
              get(obj, key) {
                return function (...params: any) {
                  return portMessageChannel.request({
                    type: 'fakeTestnetOpenapiEVM',
                    method: key,
                    params
                  });
                };
              }
            }
          );
          break;
        default:
          return function (...params: any) {
            return portMessageChannel.request({
              type: 'controller',
              method: key,
              params
            });
          };
      }
    }
  }
) as WalletController;

portMessageChannel.listen((data) => {
  if (data.type === 'broadcast') {
    eventBus.emit(data.method, data.params);
  }
  if (data.type === 'sendToUI') {
    eventBus.emit(data.method, data.params);
  }
});

eventBus.addEventListener(KASPA_EVENTS.broadcastToBackground, (data) => {
  portMessageChannel.request({
    type: 'broadcast',
    method: data.method,
    params: data.data
  });
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24 // 24 hours
    }
  }
});

const persister = createSyncStoragePersister({
  storage: window.localStorage
});

store.dispatch(initWallet({ wallet }));
eventBus.addEventListener('syncChainList', (params) => {
  store.dispatch(chainsActions.setField(params));
  updateChainStore(params);
});

store.dispatch(initBizStore());

store.dispatch(chainsInit());

await wallet.getLocale().then(async (locale: string | undefined) => {
  await i18n.changeLanguage(locale);
  const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
  root.render(
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
      <Provider store={store}>
        <WalletProvider wallet={wallet}>
          <ActionComponentProvider>
            <AccountUpdater />
            <AsyncMainRoute />
          </ActionComponentProvider>
        </WalletProvider>
      </Provider>
    </PersistQueryClientProvider>
  );
});
