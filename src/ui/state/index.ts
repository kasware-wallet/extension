import { load, save } from 'redux-localstorage-simple';

import onStoreInitialized from '@/ui/state/models/_uistore';
import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query/react';

import accounts from './accounts/reducer';
import { updateVersion } from './global/actions';
import global from './global/reducer';
import historyReducer from './history/reducer';
import keyrings from './keyrings/reducer';
import { accountToDisplayReducer } from './models/accountToDisplay';
import { addressManagementReducer } from './models/addressManagement';
import appReducer from './models/app';
import { appVersionReducer } from './models/appVersion';
import { bridgeReducer } from './models/bridge';
import { chainsReducer } from './models/chains';
import contactBookReducer from './models/contactBook';
import { createMnemonicsReducer } from './models/createMnemonics';
import { customRPCReducer } from './models/customRPC';
import evmTansactionsReducer from './models/evmTransactions';
import { gasAccountReducer } from './models/gasAccount';
import { importMnemonicsReducer } from './models/importMnemonics';
import { newUserGuideReducer } from './models/newUserGuide';
import { openapiReducer } from './models/openapi';
import { permissionReducer } from './models/permission';
import { preferenceReducer } from './models/preference';
import { securityEngineReducer } from './models/securityEngine';
import { signReducer } from './models/sign';
import { swapReducer } from './models/swap';
import { whitelistReducer } from './models/whitelist';
import settings from './settings/reducer';
import transactions from './transactions/reducer';
import ui from './ui/reducer';

const PERSISTED_KEYS: string[] = ['ui'];
const store = configureStore({
  reducer: {
    accounts,
    transactions,
    settings,
    global,
    keyrings,
    ui,
    history: historyReducer,
    // evm below

    app: appReducer,
    appVersion: appVersionReducer,
    // account: accountReducer,
    permission: permissionReducer,
    preference: preferenceReducer,
    openapi: openapiReducer,
    contactBook: contactBookReducer,
    accountToDisplay: accountToDisplayReducer,
    createMnemonics: createMnemonicsReducer,
    importMnemonics: importMnemonicsReducer,
    addressManagement: addressManagementReducer,

    evmTransactions: evmTansactionsReducer,
    chains: chainsReducer,
    whitelist: whitelistReducer,
    swap: swapReducer,
    customRPC: customRPCReducer,
    securityEngine: securityEngineReducer,
    sign: signReducer,
    bridge: bridgeReducer,
    gasAccount: gasAccountReducer,
    newUserGuide: newUserGuideReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ thunk: true }).concat(save({ states: PERSISTED_KEYS, debounce: 1000 })),
  preloadedState: load({ states: PERSISTED_KEYS, disableWarnings: true })
});
onStoreInitialized(store);
store.dispatch(updateVersion());

setupListeners(store.dispatch);

export default store;

export type AppState = ReturnType<typeof store.getState>;
export type TAppDispatch = typeof store.dispatch;
