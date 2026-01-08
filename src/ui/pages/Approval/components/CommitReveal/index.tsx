/* eslint-disable @typescript-eslint/no-explicit-any */
import BigNumber from 'bignumber.js';
import { t } from 'i18next';
import log from 'loglevel';
import React, { useEffect, useMemo, useState } from 'react';

import type { ISubmitCommitParams, ISubmitRevealParams } from '@/shared/types';
import { parseScript } from '@/shared/utils';
import { Button, Card, Column, Content, Footer, Header, Icon, Layout, Row, Text } from '@/ui/components';
import { useTools } from '@/ui/components/ActionComponent';
import { AddressText } from '@/ui/components/AddressText';
import WebsiteBar from '@/ui/components/WebsiteBar';
import { useCurrentAccount } from '@/ui/state/accounts/hooks';
import { useAppSelector } from '@/ui/state/hooks';
import { selectKasTick } from '@/ui/state/settings/reducer';
import { fontSizes } from '@/ui/theme/font';
import { formatLocaleString, useApproval, useWallet } from '@/ui/utils';
import { LoadingOutlined } from '@ant-design/icons';

interface Props {
  header?: React.ReactNode;
  params: {
    data: {
      type: 'Commit' | 'Reveal' | 'Commit & Reveal';
      priorityEntries: any;
      entries: any;
      outputs: { address: string; amount: number }[];
      changeAddress: string;
      priorityFee: number | undefined;
      networkId: string;
      script: string;
      commit: Omit<ISubmitCommitParams, 'script' | 'networkId'>;
      reveal: Omit<ISubmitRevealParams, 'priorityEntries' | 'entries' | 'script' | 'networkId'>;
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

function SignTxDetails({
  txInfo,
  type,
  protocolName,
  content,
  unknownContent,
  mimeType
}: {
  txInfo: TxInfo;
  type: string;
  protocolName: string;
  content: string;
  unknownContent: string | undefined;
  mimeType: string | undefined;
}) {
  const kasTick = useAppSelector(selectKasTick);

  const title = useMemo(() => {
    return protocolName + ' ' + type;
  }, [type]);

  const prettyInscribeJsonString = useMemo(() => {
    if (content?.length > 0) {
      try {
        const json = JSON.parse(content);
        return JSON.stringify(json, null, 2);
      } catch (e) {
        console.error(e);
        return content;
      }
    }
    return '';
  }, [content]);

  return (
    <Column gap="md">
      <Text text={title} preset="title-bold" textCenter mt="lg" mb={'md'} selectText />

      <Row itemsCenter>
        <Text text={'Type:'} preset="default" color="textDim" selectText />
        <Text text={type} style={{ wordWrap: 'break-word' }} selectText />
      </Row>
      <Row itemsCenter>
        <Text text={'Inscription Protocol:'} preset="default" color="textDim" selectText />
        <Text text={protocolName} style={{ wordWrap: 'break-word' }} selectText />
      </Row>
      {mimeType != undefined && mimeType?.length > 0 && (
        <Row itemsCenter>
          <Text text={'Mime:'} preset="default" color="textDim" selectText />
          <Text text={mimeType} style={{ wordWrap: 'break-word' }} selectText />
        </Row>
      )}
      <Column gap="sm">
        <Text text={'Inscription:'} preset="default" color="textDim" selectText />
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
              {unknownContent != undefined && unknownContent?.length > 0 && (
                <div>{`unknown content: ${unknownContent}`}</div>
              )}
            </div>
          </Card>
        </Row>
      </Column>

      {txInfo.toAddressInfos.map((item) => {
        return (
          <Row key={item.address + item.amount}>
            <Text text={t('Send') as string} textCenter color="textDim" selectText />
            <Text
              text={`${formatLocaleString(item.amount)} ${kasTick}`}
              color="white"
              preset="bold"
              textCenter
              selectText
            />
            <Text text={t('to') as string} textCenter color="textDim" selectText />

            <AddressText addressInfo={{ address: item.address, domain: '' }} textCenter />
          </Row>
        );
      })}
      <Column justifyCenter>
        <Text
          text={`${Number(new BigNumber(txInfo.txFee).decimalPlaces(8))} ${kasTick} ${t('transaction fee')}`}
          preset="sub"
          textCenter
          selectText
        />
      </Column>
    </Column>
  );
}

function Section({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <Column>
      <Text text={title} preset="bold" selectText />
      <Card>
        <Row full justifyBetween itemsCenter>
          {children}
        </Row>
      </Card>
    </Column>
  );
}

interface TxInfo {
  toAddressInfos: {
    address: string;
    amount: number;
  }[];
  txFee: number;
  isScammer: boolean;
}

const initTxInfo = {
  toAddressInfos: [],
  txFee: 0,
  isScammer: false
};

export default function CommitReveal({
  params: {
    data: { priorityEntries, entries, outputs, changeAddress, priorityFee, networkId, script, type, commit, reveal },
    session
  },
  header,
  handleCancel,
  handleConfirm
}: Props) {
  const [getApproval, resolveApproval, rejectApproval] = useApproval();
  log.debug('type', type);

  const [txInfo, setTxInfo] = useState<TxInfo>(initTxInfo);

  const [errors, setErrors] = useState<string[]>([]);
  const [protocolName, setProtocolName] = useState<string>('');
  const [mimeType, setMimeType] = useState<string | undefined>('');
  const [content, setContent] = useState<string>('');
  const [unknownContent, setUnknownContent] = useState<string | undefined>('');

  const wallet = useWallet();
  const [loading, setLoading] = useState(true);
  const tools = useTools();
  const currentAccount = useCurrentAccount();

  const init = async () => {
    const { XOnlyPublicKey, mime, protocol, Data, unknown } = parseScript(script);
    setProtocolName(protocol);
    setContent(Data);
    setUnknownContent(unknown);
    setMimeType(mime);
    if (!currentAccount?.pubkey.includes(XOnlyPublicKey)) {
      const txError = 'public key in script is not matching current account public key';
      setErrors((prev) => [...prev, txError]);
      tools.toastError(txError);
    }

    const { isScammer } = await wallet.checkWebsite(session?.origin || '');
    try {
      if (type == 'Commit & Reveal') {
        const info = await wallet.prepareCreateTransaction({
          priorityEntries: commit.priorityEntries || [],
          entries: commit.entries,
          outputs: commit.outputs,
          changeAddress: commit.changeAddress,
          priorityFee: commit.priorityFee,
          networkId,
          script
        });
        const p2shAddress = await wallet.getP2shAddressFromScriptBuilder(script, networkId);
        log.debug('p2shAddress', p2shAddress);
        const outputs1 = info.toAddressInfos.filter(
          (item) => item.address !== p2shAddress && p2shAddress !== undefined
        );
        const outputs2 = [...outputs1, ...(reveal?.outputs || [])];

        const outputP2shAddress = info.toAddressInfos.filter(
          (item) => item.address == p2shAddress && p2shAddress !== undefined
        );
        // check if the p2sh address generated by the script is in the outputs
        if (outputP2shAddress?.length === 0) {
          throw new Error('outputs does not contain the p2sh address generated by the script');
        }
        const revealTotalOutputValue = reveal.outputs?.reduce((acc, cur) => acc + cur.amount, 0) || 0;
        const revealChangeAddressAmount = outputP2shAddress[0].amount - revealTotalOutputValue;
        const revealChangeInfo = { address: reveal.changeAddress, amount: revealChangeAddressAmount };

        if (currentAccount.address !== reveal.changeAddress) {
          outputs2.push(revealChangeInfo);
        }

        const combinedTxFee =
          (info.txFee - (commit.priorityFee || 0)) * 2 + (commit.priorityFee || 0) + (reveal.priorityFee || 0);

        setTxInfo({ toAddressInfos: outputs2, txFee: combinedTxFee, isScammer });
      } else {
        const info = await wallet.prepareCreateTransaction({
          priorityEntries,
          entries,
          outputs,
          changeAddress,
          priorityFee,
          networkId,
          script
        });
        setTxInfo({ ...info, isScammer });
      }
    } catch (e) {
      log.debug(e);
      const txError = (e as any).message;
      setErrors((prev) => [...prev, txError]);
      tools.toastError(txError);
    }

    setLoading(false);
  };

  useEffect(() => {
    init();
  }, []);

  if (!handleCancel) {
    handleCancel = () => {
      rejectApproval();
    };
  }

  if (!handleConfirm) {
    handleConfirm = () => {
      if (type == 'Commit & Reveal') {
        resolveApproval({ commit, reveal, script, networkId });
      } else {
        resolveApproval({
          priorityEntries,
          entries,
          outputs,
          changeAddress,
          priorityFee,
          networkId,
          script
        });
      }
    };
  }

  const detailsComponent = useMemo(() => {
    return (
      <SignTxDetails
        txInfo={txInfo}
        type={type}
        protocolName={protocolName}
        content={content}
        mimeType={mimeType}
        unknownContent={unknownContent}
      />
    );
  }, [txInfo]);
  if (loading) {
    return (
      <Layout>
        <Content itemsCenter justifyCenter>
          <Icon size={fontSizes.xxxl} color="gold">
            <LoadingOutlined />
          </Icon>
        </Content>
      </Layout>
    );
  }

  if (!header && session) {
    header = (
      <Header>
        <WebsiteBar session={session} />
      </Header>
    );
  }

  if (txInfo.isScammer) {
    return (
      <Layout>
        <Content>
          <Column>
            <Text text="Phishing Detection" preset="title-bold" textCenter mt="xxl" selectText />
            <Text text="Malicious behavior and suspicious activity have been detected." mt="md" selectText />
            <Text
              text="Your access to this page has been restricted by KasWare Wallet as it might be unsafe."
              mt="md"
              selectText
            />
          </Column>
        </Content>

        <Footer>
          <Row full>
            <Button text="Reject (blocked by KasWare Wallet)" preset="danger" onClick={handleCancel} full />
          </Row>
        </Footer>
      </Layout>
    );
  }

  return (
    <Layout>
      {header}
      <Content>
        <Column gap="xxs">
          {detailsComponent}
          {errors &&
            errors.map((error, index) => {
              if (errors.length == 1) {
                return <Text key={index} text={`${error}`} color="error" mt="md" selectText />;
              }
              return <Text key={index} text={`${index + 1}: ${error}`} color="error" selectText />;
            })}
        </Column>
      </Content>

      <Footer>
        <Column gap="sm">
          <Text
            mt="md"
            mb="md"
            text={
              'Disclaimer: Double check the transaction details before confirming. KasWare Wallet is not responsible for any loss of funds.'
            }
            preset="xsub"
            color="textDim"
            selectText
          />
        </Column>
        <Row full>
          <Button preset="default" text="Reject" onClick={handleCancel} full />
        </Row>
      </Footer>
    </Layout>
  );
}
