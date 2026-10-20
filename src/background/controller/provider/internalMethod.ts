import { keyringService, permissionService } from '@/background/service';

import wallet from '../wallet';

/**
 * The page announcing itself. Only its name and icon are taken.
 *
 * The `origin` the page sends is ignored: the background stamps it from the port's sender URL when the
 * session is created (`sessionService.getOrCreateSession`). Trusting the param made the permission key
 * page-controlled, which is the one thing it must not be.
 */
const tabCheckin = ({
  data: {
    params: { name, icon }
  },
  session
}) => {
  session.setPageInfo({ name, icon });
};

const getProviderState = async (req) => {
  const {
    session: { origin }
  } = req;

  const isUnlocked = keyringService.memStore.getState().isUnlocked;
  // Both of these describe the user, not the wallet, so they are answered only to a site the user has
  // connected — the same rule `getAccounts` and `getNetwork` already follow, and the rule the *push*
  // side of this pair has always followed (`sessionService.broadcastEvent`). Without it this method was
  // the way round both: every page in every tab learned the active address at load, because the page
  // provider calls this from `initialize()` and publishes it as `window.kasware._selectedAddress`.
  const connected = permissionService.hasPermission(origin);
  const accounts: string[] = [];
  if (isUnlocked && connected) {
    const currentAccount = await wallet.getCurrentAccount();
    if (currentAccount) {
      accounts.push(currentAccount.address);
    }
  }
  return {
    network: connected ? wallet.getNetworkName() : '',
    isUnlocked,
    accounts
  };
};

const keepAlive = () => {
  return 'ACK_KEEP_ALIVE_MESSAGE';
};

export default {
  tabCheckin,
  getProviderState,
  keepAlive
};
