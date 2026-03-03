/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ADDRESS_TYPES } from '@/shared/constant';
import type { WalletKeyring } from '@/shared/types';
import { AddressType } from '@/shared/types';
import { Button, Card, Column, Content, Grid, Header, Input, Layout, Row, Text } from '@/ui/components';
import { useTools } from '@/ui/components/ActionComponent';
import { colors } from '@/ui/theme/colors';
import { copyToClipboard, useLocationState, useWallet } from '@/ui/utils';
import { CopyOutlined, WarningOutlined } from '@ant-design/icons';

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
  const [addressTypeStr, setAddressTypeStr] = useState('');

  const btnClick = async () => {
    try {
      const { mnemonic, passphrase, addressType } = await wallet.getMnemonics(password, keyring);
      setMnemonic(mnemonic);
      setPassphrase(passphrase);
      switch (addressType) {
        case AddressType.KASPA_44_972:
          setAddressTypeStr('legacy');
          break;
        case AddressType.KASPA_ONEKEY_44_111111:
          setAddressTypeStr('OneKey');
          break;
        case AddressType.KASPA_TANGEM_44_111111:
          setAddressTypeStr('Tangem(ECDSA)');
          break;
        case AddressType.KASPA_CHAINGE_44_111111_0_0:
          setAddressTypeStr('Chainge');
          break;
        default:
          setAddressTypeStr('standard');
          break;
      }
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
        hideConnectingComp
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

              <Text text="2. Never share it with anyone." preset="regular" color="red" />

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
            {error && <Text text={error} preset="regular" color="error" selectText />}

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
                text={`The seedphrase ${
                  passphrase ? 'and passphrase are' : 'is'
                } the ONLY way to recover your wallet. Do NOT share it with anyone!`}
                color="red"
                textCenter
                mt="xl"
                mb="xl"
              />
            </Card>

            {passphrase && (
              <Card
                onClick={() => {
                  copy(passphrase);
                }}
              >
                <Row fullX justifyBetween>
                  <Row selfItemsCenter>
                    <Text text={'Passphrase: '} disableTranslate color="textDim" />
                    <Text text={`${passphrase}`} disableTranslate />
                  </Row>
                  <Row itemsCenter>
                    <CopyOutlined style={{ color: '#888', fontSize: 14 }} />
                  </Row>
                </Row>
              </Card>
            )}

            <Row
              justifyCenter
              itemsCenter
              onClick={() => {
                copy(mnemonic);
              }}
            >
              <Text text="Copy Seedphrase" color="textDim" />
              <CopyOutlined style={{ color: '#888', fontSize: 14 }} />
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
            <Card justifyBetween>
              <Column>
                <Row
                  fullX
                  selfItemsCenter
                  onClick={() => {
                    copy(keyring.hdPath);
                  }}
                >
                  <Text text={'Derivation Path: '} disableTranslate color="textDim" />
                  <Text text={`${keyring.hdPath} (${pathName})`} disableTranslate />
                </Row>
                {addressTypeStr && (
                  <Row fullX selfItemsCenter>
                    <Text text={'Address Type: '} disableTranslate color="textDim" />
                    <Text text={`${addressTypeStr}`} disableTranslate />
                  </Row>
                )}
              </Column>
            </Card>
          </Column>
        )}
      </Content>
    </Layout>
  );
}
