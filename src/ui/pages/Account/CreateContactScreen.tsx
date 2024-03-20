/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from 'react';

import { Button, Column, Content, Header, Input, Layout } from '@/ui/components';
import { isValidAddress, useWallet } from '@/ui/utils';

import { Inscription } from '@/shared/types';

export default function CreateContactScreen() {
  const wallet = useWallet();
  const [disabled, setDisabled] = useState(true);
  const [alianName, setAlianName] = useState('');
  const [defaultName, setDefaultName] = useState('');
  const [toInfo, setToInfo] = useState<{
    address: string;
    domain: string;
    inscription?: Inscription;
  }>({
    address: '',
    domain: '',
    inscription: undefined
  });
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
    // navigate('MainScreen');
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
  useEffect(() => {
    setDisabled(true);

    if (!isValidAddress(toInfo.address)) {
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
        title="New contact"
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
            onAddressInputChange={(val) => {
              setToInfo(val);
            }}
            autoFocus={true}
          />
          <Button
            disabled={disabled}
            text="Confirm"
            preset="primary"
            onClick={(e) => {
              handleOnClick();
            }}
          />
        </Column>
      </Content>
    </Layout>
  );
}
