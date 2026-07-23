import { useMemo } from 'react';

import type { ContactBookItem } from '@/shared/types/contact-book';
import { shortAddress, useWallet } from '@/ui/utils';

import { ConfirmationPopover } from '../ConfirmationPopover';
import { Text } from '..';

export const RemoveContactPopover = ({ keyring, onClose }: { keyring: ContactBookItem; onClose: () => void }) => {
  const wallet = useWallet();

  const displayAddress = useMemo(() => {
    if (!keyring.address) {
      return 'Invalid';
    }
    return shortAddress(keyring.address);
  }, [keyring.address]);

  const handleRemove = async () => {
    await wallet.removeContact(keyring.address);
    window.history.go(-1);
  };

  return (
    <ConfirmationPopover
      onClose={onClose}
      confirmText="Remove"
      confirmPreset="danger"
      onConfirm={handleRemove}
      cardWidth={200}
    >
      <>
        <Text text={keyring.name} textCenter />
        <Text text={displayAddress} preset="sub" textCenter />
      </>
    </ConfirmationPopover>
  );
};
