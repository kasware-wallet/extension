import { useLocation } from 'react-router-dom';

import type { WalletKeyring } from '@/shared/types';
import EditNameScreen from '@/ui/pages/Settings/EditNameScreen';
import { useAppDispatch } from '@/ui/state/hooks';
import { keyringsActions } from '@/ui/state/keyrings/reducer';
import { useWallet } from '@/ui/utils';

export default function EditWalletNameScreen() {
  const { state } = useLocation();
  const { keyring } = state as { keyring: WalletKeyring };

  const wallet = useWallet();
  const dispatch = useAppDispatch();

  const handleSubmit = async (name: string) => {
    const newKeyring = await wallet.setKeyringAlianName(keyring, name || keyring.alianName);
    dispatch(keyringsActions.updateKeyringName(newKeyring));
  };
  const handleBack = () => window.history.go(-1);

  return (
    <EditNameScreen
      title={keyring.alianName}
      placeholder={keyring.alianName}
      buttonText="Change Wallet Name"
      onBack={handleBack}
      onSubmit={handleSubmit}
    />
  );
}
