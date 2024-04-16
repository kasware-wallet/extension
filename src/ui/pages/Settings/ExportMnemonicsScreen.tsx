/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ADDRESS_TYPES } from '@/shared/constant';
import { WalletKeyring } from '@/shared/types';
import { Button, Card, Column, Content, Grid, Header, Icon, Input, Layout, Row, Text } from '@/ui/components';
import { useTools } from '@/ui/components/ActionComponent';
import { colors } from '@/ui/theme/colors';
import { copyToClipboard, useLocationState, useWallet } from '@/ui/utils';
import { WarningOutlined } from '@ant-design/icons';

type Status = '' | 'error' | 'warning' | undefined;

export default function ExportMnemonicsScreen() {
  const { keyring } = useLocationState<{ keyring: WalletKeyring }>();

  const { t } = useTranslation();

  const [password, setPassword] = useState('');
  const [disabled, setDisabled] = useState(true);

  const [mnemonic, setMnemonic] = useState('');
  const [status, setStatus] = useState<Status>('');
  const [error, setError] = useState('');
  const wallet = useWallet();
  const tools = useTools();

  const [passphrase, setPassphrase] = useState('');

  const btnClick = async () => {
    try {
      const { mnemonic, hdPath, passphrase } = await wallet.getMnemonics(password, keyring);
      setMnemonic(mnemonic);
      setPassphrase(passphrase);
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
  const words = mnemonic.split(' ');

  const pathName = ADDRESS_TYPES.find((v) => v.hdPath === keyring.hdPath)?.name || 'custom';
  return (
    <Layout>
      <Header
        onBack={() => {
          window.history.go(-1);
        }}
        title={t('Seed Phrase')}
      />

      <Content>
        {mnemonic == '' ? (
          <Column>
            <Card style={{ backgroundColor: '#2c2323' }} rounded>
              <Column>
                <WarningOutlined style={{ fontSize: '300%', color: colors.red }} />
              </Column>
            </Card>
            <Column gap="lg">
              <Text
                text="1. Seed phrase alone gives you full access to your wallets and funds."
                preset="regular"
                color="red"
              />

              <Text text="2. Never sharer it with anyone." preset="regular"color="red" />

              <Text text="3. Seed phrase is only stored in your browser." preset="regular" color="red" />
              <Text text="4. KasWare will never ask for your seed phrase." preset="regular" color="red" />
            </Column>

            <Text text="" preset="title" textCenter my="xl" />
            <Input
              preset="password"
              onChange={(e) => {
                setPassword(e.target.value);
              }}
              onKeyUp={(e) => handleOnKeyUp(e)}
              autoFocus={true}
            />
            {error && <Text text={error} preset="regular" color="error" />}

            <Button
              disabled={disabled}
              text={t('Show Seed Phrase')}
              preset="primary"
              onClick={btnClick}
              style={{ marginTop: 5 }}
            />
          </Column>
        ) : (
          <Column>
            <Card style={{ backgroundColor: '#2c2323' }}>
              <Text
                text="This phrase is the ONLY way to recover your wallet. Do NOT share it with anyone! (click to copy)"
                color="red"
                textCenter
                mt="xl"
                mb="xl"
              />
            </Card>

            <Row
              justifyCenter
              onClick={(e) => {
                copy(mnemonic);
              }}>
              <Icon icon="copy" color="textDim" />
              <Text text="Copy to clipboard" color="textDim" />
            </Row>

            <Row justifyCenter>
              <Grid columns={3}>
                {words.map((v, index) => {
                  return (
                    <Row key={index}>
                      <Card preset="style2" style={{ width: 100, margin: '3px 1px', padding: '10px 15px 10px 7px' }}>
                        <Row full>
                          <Text text={`${index + 1}.`} color="textDim" />
                          <Text text={v} selectText disableTranslate />
                        </Row>
                      </Card>
                    </Row>
                  );
                })}
              </Grid>
            </Row>
            <Card mt="lg">
              <Column>
                <Text text="Advance Options" />
                <Text
                  text={`Derivation Path: ${keyring.hdPath} (${pathName})`}
                  preset="sub"
                  onClick={() => {
                    copy(keyring.hdPath);
                  }}
                  disableTranslate
                />
                {passphrase && <Text text={`Passphrase: ${passphrase}`} preset="sub" disableTranslate />}
              </Column>
            </Card>
          </Column>
        )}
      </Content>
    </Layout>
  );
}
