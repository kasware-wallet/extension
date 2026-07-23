import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

import type { ContactBookItem } from '@/shared/types/contact-book';
import { Button } from '@/ui/components';
import { RemoveContactPopover } from '@/ui/components/RemoveContactPopover';
import EditNameScreen from '@/ui/pages/Settings/EditNameScreen';
import { shortAddress, useWallet } from '@/ui/utils';

export default function EditContactNameScreen() {
  const { t } = useTranslation();
  const { state } = useLocation();
  const { account } = state as { account: ContactBookItem };

  const wallet = useWallet();
  const [removeVisible, setRemoveVisible] = useState(false);

  const handleSubmit = async (name: string) => {
    const newContact = { ...account, name };
    await wallet.updateContact(newContact);
  };
  const handleBack = () => window.history.go(-1);

  const extraActions = (
    <>
      <Button
        text={t('Remove Contact')}
        preset="danger"
        onClick={() => {
          setRemoveVisible(true);
        }}
      />
      {removeVisible && (
        <RemoveContactPopover
          keyring={account}
          onClose={() => {
            setRemoveVisible(false);
          }}
        />
      )}
    </>
  );

  return (
    <EditNameScreen
      title={shortAddress(account.address, 10)}
      placeholder={account.name}
      buttonText="Change Contact Name"
      onBack={handleBack}
      onSubmit={handleSubmit}
      extraActions={extraActions}
    />
  );
}
