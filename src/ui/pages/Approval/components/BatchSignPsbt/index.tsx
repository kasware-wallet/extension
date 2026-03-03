import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { SignPsbtOptions } from '@/shared/types';
import { TxType } from '@/shared/types';
import { Button, Card, Column, Content, Footer, Header, Layout, Row, Text } from '@/ui/components';
import WebsiteBar from '@/ui/components/WebsiteBar';
import { useApproval, useWallet } from '@/ui/utils';
import { t } from 'i18next';

interface Props {
  header?: React.ReactNode;
  params: {
    data: {
      psbtHex: string;
      options: SignPsbtOptions;
      type: TxType;
      inscribeJsonString: string;
      destAddr?: string;
    };
    session?: {
      origin: string;
      icon: string;
      name: string;
    };
  };
  handleCancel?: () => void;
  handleConfirm?: () => void;
}

interface TxInfo {
  psbtHex: string;
  isScammer: boolean;
  inscribeJsonString: string;
  destAddr?: string;
}

const initTxInfo: TxInfo = {
  psbtHex: '',
  isScammer: false,
  inscribeJsonString: '',
  destAddr: ''
};

function isKRC20Transaction(type: TxType): boolean {
  return (
    type === TxType.SIGN_KRC20_TRANSFER ||
    type === TxType.SIGN_KRC20_MINT ||
    type === TxType.SIGN_KRC20_MINT_BATCH ||
    type === TxType.SIGN_KRC20_DEPLOY
  );
}

function shouldReturnInscribeData(type: TxType): boolean {
  return type === TxType.SIGN_KRC20_DEPLOY || type === TxType.SIGN_KRC20_MINT || type === TxType.SIGN_KRC20_TRANSFER;
}

function SignTxDetails({ txInfo, type }: { txInfo: TxInfo; type: TxType }) {
  const title = useMemo(() => {
    if (type === TxType.SIGN_KRC20_MINT_BATCH) {
      return t('Batch Mint KRC20 Token');
    }
    if (type === TxType.SIGN_KRC20_TRANSFER_BATCH) {
      return t('Transfer KRC20 Token');
    }
    return '';
  }, [type]);

  const prettyInscribeJsonString = useMemo(() => {
    if (txInfo?.inscribeJsonString) {
      try {
        const json = JSON.parse(txInfo.inscribeJsonString);
        return JSON.stringify(json, null, 2);
      } catch (error) {
        console.error('Failed to parse inscribeJsonString:', error);
        return txInfo.inscribeJsonString;
      }
    }
    return '';
  }, [txInfo?.inscribeJsonString]);

  if (type === TxType.SIGN_KRC20_MINT_BATCH || type === TxType.SIGN_KRC20_TRANSFER_BATCH) {
    return (
      <Column gap="lg">
        <Text text={title} preset="title-bold" textCenter mt="lg" mb={'md'} />
        <Row justifyCenter fullX mt={'zero'} mb="sm">
          <Card fullX>
            <div
              style={{
                userSelect: 'text',
                maxHeight: 384,
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                flexWrap: 'wrap',
                fontSize: '1rem'
              }}
            >
              {prettyInscribeJsonString}
            </div>
          </Card>
        </Row>
      </Column>
    );
  }

  return null;
}

export default function BatchSignPsbt({
  params: {
    data: { psbtHex, type, inscribeJsonString, destAddr },
    session
  },
  header,
  handleCancel,
  handleConfirm
}: Props) {
  const [, resolveApproval, rejectApproval] = useApproval();
  const [txInfo, setTxInfo] = useState<TxInfo>(initTxInfo);
  const mountedRef = useRef(true);

  const wallet = useWallet();

  useEffect(() => {
    const init = async () => {
      if (!psbtHex) {
        if (mountedRef.current) {
          if (isKRC20Transaction(type)) {
            setTxInfo({ ...initTxInfo, inscribeJsonString, destAddr });
          } else {
            setTxInfo({ ...initTxInfo });
          }
        }
        return;
      }

      const { isScammer } = await wallet.checkWebsite(session?.origin || '');

      if (mountedRef.current) {
        setTxInfo({
          psbtHex,
          isScammer,
          inscribeJsonString,
          destAddr
        });
      }
    };

    init();

    return () => {
      mountedRef.current = false;
    };
  }, [psbtHex, type, inscribeJsonString, destAddr, session?.origin, wallet]);

  const defaultHandleCancel = useCallback(() => {
    rejectApproval();
  }, [rejectApproval]);

  const defaultHandleConfirm = useCallback(() => {
    if (shouldReturnInscribeData(type)) {
      resolveApproval({
        inscribeJsonString: txInfo.inscribeJsonString,
        type,
        destAddr: txInfo.destAddr
      });
    } else {
      resolveApproval({
        psbtHex: txInfo.psbtHex
      });
    }
  }, [type, txInfo.inscribeJsonString, txInfo.destAddr, txInfo.psbtHex, resolveApproval]);

  const detailsComponent = useMemo(() => {
    return <SignTxDetails txInfo={txInfo} type={type} />;
  }, [txInfo, type]);

  const headerElement = useMemo(() => {
    if (header) return header;
    if (session) {
      return (
        <Header>
          <WebsiteBar session={session} />
        </Header>
      );
    }
    return null;
  }, [header, session]);

  if (txInfo.isScammer) {
    return (
      <Layout>
        <Content>
          <Column>
            <Text text="Phishing Detection" preset="title-bold" textCenter mt="xxl" />
            <Text text="Malicious behavior and suspicious activity have been detected." mt="md" />
            <Text
              text="Your access to this page has been restricted by KasWare Wallet as it might be unsafe."
              mt="md"
            />
          </Column>
        </Content>

        <Footer>
          <Row full>
            <Button
              text={t('Reject (blocked by KasWare Wallet)')}
              preset="danger"
              onClick={handleCancel || defaultHandleCancel}
              full
            />
          </Row>
        </Footer>
      </Layout>
    );
  }

  return (
    <Layout>
      {headerElement}
      <Content>
        <Column gap="xxs">{detailsComponent}</Column>
      </Content>

      <Footer>
        <Row full>
          <Button preset="default" text={t('Reject')} onClick={handleCancel || defaultHandleCancel} full />
          <Button
            preset="primary"
            text={type === TxType.SIGN_TX ? t('Sign') : t('Sign & Pay')}
            onClick={handleConfirm || defaultHandleConfirm}
            full
          />
        </Row>
      </Footer>
    </Layout>
  );
}
