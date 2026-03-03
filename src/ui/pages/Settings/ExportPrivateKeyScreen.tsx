/* eslint-disable @typescript-eslint/no-explicit-any */

import { Collapse } from 'antd';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

import type { Account } from '@/shared/types';
import { Button, Card, Column, Content, Header, Input, Layout, Row, Text } from '@/ui/components';
import { useTools } from '@/ui/components/ActionComponent';
import { copyToClipboard, useWallet } from '@/ui/utils';
import { CopyOutlined } from '@ant-design/icons';

type Status = '' | 'error' | 'warning' | undefined;

export default function ExportPrivateKeyScreen() {
  const { t } = useTranslation();
  const { Panel } = Collapse;
  const { state } = useLocation();
  const { account } = state as {
    account: Account;
  };

  const [password, setPassword] = useState('');
  const [disabled, setDisabled] = useState(true);

  const [privateKey, setPrivateKey] = useState({ hex: '', wif: '' });
  const [evmPrivateKey, setEvmPrivateKey] = useState({ hex: '', wif: '' });
  const [status, setStatus] = useState<Status>('');
  const [error, setError] = useState('');
  const wallet = useWallet();
  const tools = useTools();

  const btnClick = async () => {
    try {
      const _res = await wallet.getPrivateKey(password, account);
      setPrivateKey(_res);
      const privateKeyHex = await wallet.walletEVM.getPrivateKey(password, {
        // pubkey: account.pubkey,
        address: account.evmAddress,
        type: account.type
      });
      if (!privateKeyHex) {
        setError('error, cannot get evm private key');
      } else {
        setEvmPrivateKey({ hex: privateKeyHex, wif: 'wif' });
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

  return (
    <Layout>
      <Header
        hideConnectingComp
        onBack={() => {
          window.history.go(-1);
        }}
        title={t('Export Private Key')}
      />
      <Content>
        {privateKey.wif == '' && evmPrivateKey.wif == '' ? (
          <Column gap="lg">
            <Column gap="lg">
              <Text
                text="1. Private key alone gives you full access to your account and funds."
                preset="title"
                color="red"
                selectText
              />
              <Text text="2. Never share it with anyone." preset="title" color="red" selectText />
              <Text text="3. Private key is only stored in your browser." preset="title" color="red" selectText />
              <Text text="4. KasWare will never ask for your private key." preset="title" color="red" selectText />
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
            {error && <Text text={error} preset="regular" color="error" selectText />}

            <Button text={t('Show Private Key')} preset="primary" disabled={disabled} onClick={btnClick} />
          </Column>
        ) : (
          <Column>
            <Text
              text={`${t('If you ever change browsers or move computers')}, ${t(
                'you will need this Private Key to access this account'
              )}. ${t('Save it somewhere safe and secret')}`}
              preset="sub"
              size="sm"
              textCenter
              selectText
            />
            <Collapse
              style={{
                backgroundColor: 'rgb(42, 38, 38)'
              }}
            >
              {privateKey.wif !== '' && (
                <Panel header={<PanelHeader origin={`${t('Kaspa Private Key')}:`} />} key="kaspa">
                  <Card
                    onClick={() => {
                      copy(privateKey.hex);
                    }}
                  >
                    <Row itemsCenter>
                      <Text
                        text={privateKey.hex}
                        color="textDim"
                        style={{
                          overflowWrap: 'anywhere'
                        }}
                      />
                      <CopyOutlined style={{ color: '#888', fontSize: 14 }} />
                    </Row>
                  </Card>
                </Panel>
              )}
              {evmPrivateKey.wif !== '' && (
                <Panel header={<PanelHeader origin={`${t('EVM Private Key')}:`} />} key="evm">
                  <Card
                    onClick={() => {
                      copy(evmPrivateKey.hex);
                    }}
                  >
                    <Row itemsCenter>
                      <Text
                        text={evmPrivateKey.hex}
                        color="textDim"
                        style={{
                          overflowWrap: 'anywhere'
                        }}
                      />
                      <CopyOutlined style={{ color: '#888', fontSize: 14 }} />
                    </Row>
                  </Card>
                </Panel>
              )}
            </Collapse>
          </Column>
        )}
      </Content>
    </Layout>
  );
}

function PanelHeader({ origin }) {
  return (
    <Row justifyCenter itemsCenter>
      <Text text={origin} preset="sub" size="sm" textCenter />
    </Row>
  );
}
