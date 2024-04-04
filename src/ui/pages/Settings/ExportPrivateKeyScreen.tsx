/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

import { Account } from '@/shared/types';
import { Button, Card, Column, Content, Header, Icon, Input, Layout, Row, Text } from '@/ui/components';
import { useTools } from '@/ui/components/ActionComponent';
import { copyToClipboard, useWallet } from '@/ui/utils';

type Status = '' | 'error' | 'warning' | undefined;

export default function ExportPrivateKeyScreen() {
  const { t } = useTranslation();

  const { state } = useLocation();
  const { account } = state as {
    account: Account;
  };

  const [password, setPassword] = useState('');
  const [disabled, setDisabled] = useState(true);

  const [privateKey, setPrivateKey] = useState({ hex: '', wif: '' });
  const [status, setStatus] = useState<Status>('');
  const [error, setError] = useState('');
  const wallet = useWallet();
  const tools = useTools();

  const btnClick = async () => {
    try {
      const _res = await wallet.getPrivateKey(password, account);
      setPrivateKey(_res);
    } catch (e) {
      setStatus('error');
      setError((e as any).message);
    }
  };

  const handleOnKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ('Enter' == e.key) {
      btnClick();
    }
  };

  useEffect(() => {
    setDisabled(true);
    if (password) {
      setDisabled(false);
      setStatus('');
      setError('');
    }
  }, [password]);

  function copy(str: string) {
    copyToClipboard(str);
    tools.toastSuccess(t('Copied'));
  }

  return (
    <Layout>
      <Header
        onBack={() => {
          window.history.go(-1);
        }}
        title={t('Export Private Key')}
      />
      <Content>
        {privateKey.wif == '' ? (
          <Column gap="lg">
            <Column gap="lg">
              <Text
                text="1. Private key alone gives you full access to your account and funds."
                preset="title"
                color="red"
              />
              <Text text="2. Never sharer it with anyone." preset="title" color="red" />
              <Text text="3. Private key is only stored in your browser." preset="title" color="red" />
              <Text text="4. KasWare will never ask for your private key." preset="title" color="red" />
            </Column>

            <Text text=" Please read the tips above carefully" preset="title" textCenter my="xl" />
            <Input
              preset="password"
              onChange={(e) => {
                setPassword(e.target.value);
              }}
              onKeyUp={(e) => handleOnKeyUp(e)}
              autoFocus={true}
            />
            {error && <Text text={error} preset="regular" color="error" />}

            <Button text={t('Show Private Key')} preset="primary" disabled={disabled} onClick={btnClick} />
          </Column>
        ) : (
          <Column>
            <Text
              text={`${t('If you ever change browsers or move computers')}, ${t('you will need this Private Key to access this account')}. ${t('Save it somewhere safe and secret')}`}
              preset="sub"
              size="sm"
              textCenter
            />
            <Text text={`${t('HEX Private Key')}:`} preset="sub" size="sm" textCenter mt="lg" />

            <Card
              onClick={(e) => {
                copy(privateKey.hex);
              }}>
              <Row>
                <Icon icon="copy" color="textDim" />
                <Text
                  text={privateKey.hex}
                  color="textDim"
                  style={{
                    overflowWrap: 'anywhere'
                  }}
                />
              </Row>
            </Card>
          </Column>
        )}
      </Content>
    </Layout>
  );
}
