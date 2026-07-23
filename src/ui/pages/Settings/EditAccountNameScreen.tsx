import { useLocation } from 'react-router-dom';

import type { Account } from '@/shared/types';
import EditNameScreen from '@/ui/pages/Settings/EditNameScreen';
import { accountsActions } from '@/ui/state/accounts/reducer';
import { useAppDispatch } from '@/ui/state/hooks';
import { keyringsActions } from '@/ui/state/keyrings/reducer';
import { useWallet } from '@/ui/utils';

export default function EditAccountNameScreen() {
  const { state } = useLocation();
  const { account } = state as { account: Account };

  const wallet = useWallet();
  const dispatch = useAppDispatch();

  const handleSubmit = async (name: string) => {
    const newAccount = await wallet.setAccountAlianName(account, name);
    dispatch(keyringsActions.updateAccountName(newAccount));
    dispatch(accountsActions.updateAccountName(newAccount));
  };
  const handleBack = () => window.history.go(-1);

  return (
    <EditNameScreen
      title={account.alianName || ''}
      placeholder={account.alianName || ''}
      buttonText="Change Account Name"
      onBack={handleBack}
      onSubmit={handleSubmit}
    />
  );
}
