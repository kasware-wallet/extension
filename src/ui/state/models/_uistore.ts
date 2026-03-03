import { onBackgroundStoreChanged } from '@/evm/ui/utils/broadcastToUI';
import type { AppState } from '@/ui/state';
import { preferenceActions } from '@/ui/state/models/preference';
import { whitelistActions } from '@/ui/state/models/whitelist';
import type { ToolkitStore } from '@reduxjs/toolkit/dist/configureStore';
import { accountsActions } from '../accounts/reducer';

// import { onBackgroundStoreChanged } from '../utils/broadcastToUI';

export default (store: ToolkitStore) => {
  onBackgroundStoreChanged('contactBookEVM', (payload) => {
    const state = store.getState() as AppState;
    const currentAccount = state.accounts.current;
    const currentAddr = currentAccount?.evmAddress;

    if (currentAddr && payload.partials[currentAddr]) {
      const aliasName = payload.partials[currentAddr]!.name;
      currentAccount.alianName = aliasName;
      store.dispatch(
        accountsActions.setField({
          alianName: aliasName,
          currentAccount: { ...currentAccount }
        })
      );
    }
  });

  onBackgroundStoreChanged('preferenceEVM', (payload) => {
    switch (payload.changedKey) {
      case 'themeMode': {
        store.dispatch(
          preferenceActions.setField({
            themeMode: payload.partials.themeMode
          })
        );
        break;
      }
      // case 'curvePointsMap': {
      //   dispatch.account.setField({
      //     curvePointsMap: payload.partials.curvePointsMap,
      //   })
      //   break;
      // }
    }
  });

  onBackgroundStoreChanged('whitelist', (payload) => {
    switch (payload.changedKey) {
      case 'whitelists': {
        store.dispatch(
          whitelistActions.setField({
            whitelist: payload.partials.whitelists
          })
        );
        break;
      }
      case 'enabled': {
        store.dispatch(
          whitelistActions.setField({
            enabled: payload.partials.enabled
          })
        );
        break;
      }
    }
  });
};
