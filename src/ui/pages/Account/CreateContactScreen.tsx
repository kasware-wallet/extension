import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button, Column, Content, Header, Input, Layout } from '@/ui/components';
import { useWallet } from '@/ui/utils';
import { isValidAddress } from '@ethereumjs/util';
import { useAsync } from 'react-use';

export default function CreateContactScreen() {
  const { t } = useTranslation();
  const wallet = useWallet();
  const [disabled, setDisabled] = useState(true);
  const [alianName, setAlianName] = useState('');
  const [defaultName, setDefaultName] = useState('');
  const [toInfo, setToInfo] = useState<{
    address: string;
    domain: string;
  }>({
    address: '',
    domain: ''
  });

  const handleAddressChange = useCallback((val: { address: string; domain: string }) => {
    setToInfo(val);
  }, []);
  const handleOnClick = async () => {
    const newContact = {
      name: alianName || defaultName,
      address: toInfo.address,
      isAlias: true,
      isContact: true
    };
    await wallet.addContact(newContact);
    window.history.go(-1);
    // await wallet.deriveNewAccountFromMnemonic(currentKeyring, alianName || defaultName);
    // tools.toastSuccess('Success');
    // const currentAccount = await wallet.getCurrentAccount();
    // setCurrentAccount(currentAccount);
    // navigate('WalletTabScreen');
  };

  const handleOnKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ('Enter' == e.key) {
      handleOnClick();
    }
  };

  const init = async () => {
    // const accountName = await wallet.getNextAlianName(currentKeyring);
    const items = await wallet.listContact();
    const name = items && items?.length > 0 ? 'Contact ' + (items.length + 1).toString() : 'Contact 1';
    setDefaultName(name);
  };
  useEffect(() => {
    init();
  }, []);
  useAsync(async () => {
    setDisabled(true);

    if (!(await wallet.isValidKaspaAddr(toInfo.address)) && !isValidAddress(toInfo.address)) {
      return;
    }
    setDisabled(false);
  }, [toInfo]);

  return (
    <Layout>
      <Header
        onBack={() => {
          window.history.go(-1);
        }}
        title={t('New contact')}
      />
      <Content>
        <Column>
          <Input
            placeholder={defaultName}
            onChange={(e) => {
              setAlianName(e.target.value);
            }}
            onKeyUp={(e) => handleOnKeyUp(e)}
            autoFocus={true}
          />
          <Input
            preset="address"
            defaultValue={toInfo.address}
            addressInputData={toInfo}
            onAddressInputChange={handleAddressChange}
            autoFocus={true}
          />
          <Button
            disabled={disabled}
            text="Confirm"
            preset="primary"
            onClick={() => {
              handleOnClick();
            }}
          />
        </Column>
      </Content>
    </Layout>
  );
}
