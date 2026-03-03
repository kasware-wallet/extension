import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

import type { ContactBookItem } from '@/shared/types/contact-book';
import { Button, Content, Header, Input, Layout } from '@/ui/components';
import { RemoveContactPopover } from '@/ui/components/RemoveContactPopover';
import { shortAddress, useWallet } from '@/ui/utils';

export default function EditContactNameScreen() {
  const { t } = useTranslation();

  const { state } = useLocation();
  const { account } = state as {
    account: ContactBookItem;
  };

  const wallet = useWallet();
  const [alianName, setAlianName] = useState('');
  const [removeVisible, setRemoveVisible] = useState(false);
  const handleOnClick = async () => {
    // const newAccount = await wallet.setAccountAlianName(account, alianName);
    const newContact = {
      ...account,
      name: alianName
    };
    await wallet.updateContact(newContact);
    // dispatch(keyringsActions.updateAccountName(newAccount));
    // dispatch(accountsActions.updateAccountName(newAccount));
    window.history.go(-1);
  };

  const handleOnKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ('Enter' == e.key) {
      handleOnClick();
    }
  };

  const validName = useMemo(() => {
    if (alianName.length == 0) {
      return false;
    }
    return true;
  }, [alianName]);
  return (
    <Layout>
      <Header
        onBack={() => {
          window.history.go(-1);
        }}
        title={shortAddress(account.address, 10)}
      />
      <Content>
        <Input
          placeholder={account.name}
          onChange={(e) => {
            setAlianName(e.target.value);
          }}
          onKeyUp={(e) => handleOnKeyUp(e)}
          autoFocus={true}
        />
        <Button disabled={!validName} text={t('Change Contact Name')} preset="primary" onClick={handleOnClick} />
        <Button
          text={t('Remove Contact')}
          preset="danger"
          onClick={() => {
            setRemoveVisible(true);
          }}
        />
      </Content>
      {removeVisible && (
        <RemoveContactPopover
          keyring={account}
          onClose={() => {
            setRemoveVisible(false);
          }}
        />
      )}
    </Layout>
  );
}
