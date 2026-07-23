import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

import type { IKRC20Transfer, TKRC20History } from '@/shared/types';
import {
  Card,
  Column,
  Content,
  EndCard,
  Header,
  Icon,
  Layout,
  LoadingSpinner,
  MiddleCard,
  Row,
  StartCard,
  Text
} from '@/ui/components';
import { useTools } from '@/ui/components/ActionComponent';
import { useKrc20ActivityByTxidQuery } from '@/ui/hooks/kasplex';
import { useCurrentAccount } from '@/ui/state/accounts/hooks';
import { selectCurrentKaspaAddress } from '@/ui/state/accounts/reducer';
import { useAppSelector } from '@/ui/state/hooks';
import { selectBlockstreamUrl, selectKasTick, selectNetworkId } from '@/ui/state/settings/reducer';
import { colors } from '@/ui/theme/colors';
import { fontSizes } from '@/ui/theme/font';
import { copyToClipboard, formatLocaleString, shortAddress } from '@/ui/utils';
import { CopyOutlined } from '@ant-design/icons';
import { sompiToAmount } from '@/shared/utils/format';

import { KRC20HistoryCardWithoutToken } from '../KRC20/components';
import { decodePayload } from '@/ui/utils/payload';

interface TxInput {
  previous_outpoint_address: string;
  previous_outpoint_amount: string | number;
}

interface TxOutput {
  script_public_key_address: string;
  amount: string | number;
}

interface TxDetail {
  transaction_id?: string;
  hash?: string;
  is_accepted?: boolean;
  mass?: string | number;
  payload?: string;
  block_time?: number;
  subnetwork_id?: string;
  accepting_block_blue_score?: number;
  accepting_block_hash?: string;
  accepting_block_time?: number;
  block_hash?: string[];
  inputs?: TxInput[];
  outputs?: TxOutput[];
}

interface DecodedPayloadData {
  txType?: string;
  address?: string;
  fields?: Record<string, unknown>;
  error?: string;
}

type TxParticipant = { address: string; amount: string; alianName?: string };

export default function TxDetailScreen() {
  const kasTick = useAppSelector(selectKasTick);
  const { state } = useLocation();
  const { txDetail, txId } = state as {
    txDetail: TxDetail;
    txId: string;
  };
  const blockstreamUrl = useAppSelector(selectBlockstreamUrl);
  const [isDecoded, setIsDecoded] = useState(false);

  const { t } = useTranslation();
  const tools = useTools();
  const handleCopy = (text: string) => {
    copyToClipboard(text).then(() => {
      tools.toastSuccess(t('Copied'));
    });
  };

  const txFee = useMemo(() => {
    if (!txDetail?.inputs || !txDetail?.outputs) return '0';

    const inputAmount = txDetail.inputs.reduce(
      (sum: number, input: TxInput) => sum + Number(input.previous_outpoint_amount),
      0
    );

    const outputAmount = txDetail.outputs.reduce((sum: number, output: TxOutput) => sum + Number(output.amount), 0);

    return sompiToAmount(inputAmount - outputAmount, 8);
  }, [txDetail?.inputs, txDetail?.outputs]);

  const payload = useMemo(() => txDetail?.payload, [txDetail?.payload]);

  // Determine how many primary card rows we have for proper StartCard/MiddleCard/EndCard placement
  const hasTxId = !!txDetail?.transaction_id;
  const hasHash = !!txDetail?.hash;
  const hasAccepted = txDetail?.is_accepted !== undefined;
  const hasMass = txDetail?.mass !== undefined;
  const hasTime = !!txDetail?.block_time;
  const hasSubnetwork = !!txDetail?.subnetwork_id;
  const hasFee = txFee && Number(txFee) > 0;

  // Accepting block fields
  const hasAcceptingBlueScore = txDetail?.accepting_block_blue_score !== undefined;
  const hasAcceptingBlockHash = !!txDetail?.accepting_block_hash;
  const hasAcceptingBlockTime = !!txDetail?.accepting_block_time;
  const acceptingFields = [hasAcceptingBlueScore, hasAcceptingBlockHash, hasAcceptingBlockTime].filter(Boolean);
  const hasAcceptingBlock = acceptingFields.length > 0;

  const getCardType = (index: number, total: number): 'start' | 'middle' | 'end' | 'single' => {
    if (total === 1) return 'single'; // single item uses Card with full border-radius
    if (index === 0) return 'start';
    if (index === total - 1) return 'end';
    return 'middle';
  };

  const renderCardWrapper = (type: 'start' | 'middle' | 'end' | 'single', children: React.ReactNode) => {
    if (type === 'start') return <StartCard>{children}</StartCard>;
    if (type === 'end') return <EndCard>{children}</EndCard>;
    if (type === 'single') return <Card>{children}</Card>;
    return <MiddleCard>{children}</MiddleCard>;
  };

  // Build primary info rows
  const primaryRows: { label: string; valueNode: React.ReactNode }[] = [];

  if (hasTxId) {
    primaryRows.push({
      label: t('Transaction ID'),
      valueNode: (
        <Row
          gap="xs"
          itemsCenter
          onClick={() => {
            window.open(`${blockstreamUrl}/transactions/${txDetail.transaction_id}`);
          }}
          style={{ cursor: 'pointer' }}
        >
          <Text text={shortAddress(txDetail.transaction_id!, 6)} preset="link" selectText />
          <Icon icon="link" size={fontSizes.xxs} color="blue" />
          <CopyOutlined
            style={{ color: colors.icon_secondary, fontSize: 14, flexShrink: 0 }}
            onClick={(e) => {
              e.stopPropagation();
              handleCopy(txDetail.transaction_id!);
            }}
          />
        </Row>
      )
    });
  }

  if (hasHash) {
    primaryRows.push({
      label: t('Hash'),
      valueNode: (
        <Row itemsCenter gap="xs" onClick={() => handleCopy(txDetail.hash!)} style={{ cursor: 'pointer' }}>
          <Text text={shortAddress(txDetail.hash!)} wrap />
          <CopyOutlined style={{ color: colors.icon_secondary, fontSize: 14 }} />
        </Row>
      )
    });
  }

  if (hasAccepted) {
    primaryRows.push({
      label: t('Status'),
      valueNode: (
        <Text
          text={txDetail.is_accepted ? t('Accepted') : t('Not Accepted')}
          color={txDetail.is_accepted ? 'green' : 'red'}
        />
      )
    });
  }

  if (hasMass) {
    primaryRows.push({
      label: t('Mass'),
      valueNode: <Text text={`${txDetail.mass}`} wrap />
    });
  }

  if (hasTime) {
    primaryRows.push({
      label: t('Time'),
      valueNode: <Text text={new Date(txDetail.block_time!).toLocaleString()} wrap />
    });
  }

  if (hasSubnetwork) {
    primaryRows.push({
      label: t('Subnetwork ID'),
      valueNode: (
        <Row itemsCenter gap="xs" onClick={() => handleCopy(txDetail.subnetwork_id!)} style={{ cursor: 'pointer' }}>
          <Text text={shortAddress(txDetail.subnetwork_id!)} wrap />
          <CopyOutlined style={{ color: colors.icon_secondary, fontSize: 14 }} />
        </Row>
      )
    });
  }

  if (hasFee) {
    primaryRows.push({
      label: t('Transaction Fee'),
      valueNode: <Text text={`${txFee} ${kasTick}`} wrap color={Number(txFee) >= 1 ? 'warning' : undefined} />
    });
  }

  // Build accepting block rows
  const acceptingRows: { label: string; valueNode: React.ReactNode }[] = [];

  if (hasAcceptingBlueScore) {
    acceptingRows.push({
      label: t('Blue Score'),
      valueNode: <Text text={`${txDetail.accepting_block_blue_score}`} wrap />
    });
  }

  if (hasAcceptingBlockHash) {
    acceptingRows.push({
      label: t('Block Hash'),
      valueNode: (
        <Row
          itemsCenter
          gap="xs"
          onClick={() => handleCopy(txDetail.accepting_block_hash!)}
          style={{ cursor: 'pointer' }}
        >
          <Text text={shortAddress(txDetail.accepting_block_hash!)} wrap />
          <CopyOutlined style={{ color: colors.icon_secondary, fontSize: 14 }} />
        </Row>
      )
    });
  }

  if (hasAcceptingBlockTime) {
    acceptingRows.push({
      label: t('Block Time'),
      valueNode: <Text text={new Date(txDetail.accepting_block_time!).toLocaleString()} wrap />
    });
  }

  return (
    <Layout>
      <Header
        onBack={() => {
          window.history.go(-1);
        }}
        title={t('Transaction Detail')}
      />
      <Content>
        <Column gap="lg">
          {/* Primary transaction info */}
          {primaryRows.length > 0 && (
            <Column gap="zero">
              {primaryRows.map((row, i) => {
                const cardType = getCardType(i, primaryRows.length);
                return (
                  <React.Fragment key={row.label}>
                    {renderCardWrapper(
                      cardType,
                      <Row justifyBetween full itemsCenter py="sm" style={{ overflow: 'hidden' }}>
                        <Text text={row.label} preset="sub" style={{ flexShrink: 0 }} />
                        <div style={{ overflow: 'hidden', minWidth: 0 }}>{row.valueNode}</div>
                      </Row>
                    )}
                  </React.Fragment>
                );
              })}
            </Column>
          )}

          {/* Accepting block info */}
          {hasAcceptingBlock && (
            <Column gap="zero">
              {acceptingRows.map((row, i) => {
                const cardType = getCardType(i, acceptingRows.length);
                return (
                  <React.Fragment key={row.label}>
                    {renderCardWrapper(
                      cardType,
                      <Row justifyBetween full itemsCenter py="sm" style={{ overflow: 'hidden' }}>
                        <Text text={row.label} preset="sub" style={{ flexShrink: 0 }} />
                        <div style={{ overflow: 'hidden', minWidth: 0 }}>{row.valueNode}</div>
                      </Row>
                    )}
                  </React.Fragment>
                );
              })}
            </Column>
          )}

          {/* Block Hash list */}
          {txDetail?.block_hash && txDetail.block_hash.length > 0 && (
            <BlockHashList blockhashs={txDetail.block_hash} onCopy={handleCopy} />
          )}

          {/* Inputs */}
          {txDetail?.inputs && txDetail.inputs.length > 0 && <Inputs inputs={txDetail.inputs} onCopy={handleCopy} />}

          {/* Outputs */}
          {txDetail?.outputs && txDetail.outputs.length > 0 && (
            <Outputs outputs={txDetail.outputs} onCopy={handleCopy} />
          )}

          {/* Payload */}
          {payload && (
            <Column gap="zero">
              <StartCard>
                <Row justifyBetween full itemsCenter py="xxs">
                  <Text text={t('Payload')} preset="sub" />
                  {payload.length > 0 && (
                    <Row itemsCenter gap="xs" onClick={() => setIsDecoded(!isDecoded)} style={{ cursor: 'pointer' }}>
                      <Text text={isDecoded ? 'Hide Decoded' : 'Decode'} color="blue" size="xs" />
                    </Row>
                  )}
                </Row>
              </StartCard>
              <EndCard
                style={{
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  overflowX: 'hidden'
                }}
                py="lg"
              >
                <Text
                  text={payload}
                  wrap
                  style={{
                    userSelect: 'text',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    fontSize: fontSizes.xs
                  }}
                />
              </EndCard>
            </Column>
          )}

          {/* Decoded payload */}
          {payload && payload?.length > 0 && isDecoded && <DecodedPayload payload={payload} />}

          {/* KRC20 Activity */}
          <Krc20HistoryCard txId={txId} />
        </Column>
      </Content>
    </Layout>
  );
}

function DecodedPayload({ payload }: { payload: string }) {
  const [decoded, setDecoded] = useState<DecodedPayloadData | string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const data = decodePayload(payload);
      if (typeof data == 'object' && data?.error) {
        setError(data.error);
        setDecoded(null);
      } else {
        setDecoded(data);
        setError(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to decode payload');
      setDecoded(null);
    }
  }, [payload]);

  const jsonReplacer = (_key: string, value: unknown) => (typeof value === 'bigint' ? value.toString() : value);

  const safeStringify = (obj: unknown): string => {
    try {
      return JSON.stringify(obj, jsonReplacer, 2);
    } catch {
      return 'Decoding failed';
    }
  };

  return (
    <Column gap="zero">
      {error && (
        <StartCard>
          <Row justifyBetween full itemsCenter>
            <Text text="Decoded Payload" preset="sub" />
            <Text text={`Error: ${error}`} color="red" wrap />
          </Row>
        </StartCard>
      )}
      {!error && !decoded && (
        <StartCard>
          <Row justifyBetween full itemsCenter py="sm">
            <Text text="Decoded Payload" preset="sub" />
            <Text text="Decoding..." preset="sub" />
          </Row>
        </StartCard>
      )}
      {!error && decoded && (
        <Column gap="zero">
          <StartCard>
            <Row justifyBetween full itemsCenter py="sm">
              <Text text="Decoded Payload" preset="sub" />
            </Row>
          </StartCard>
          <EndCard
            style={{
              flexDirection: 'column',
              alignItems: 'stretch',
              overflowX: 'hidden'
            }}
            py="lg"
          >
            <div
              style={{
                userSelect: 'text',
                maxHeight: 384,
                overflowY: 'auto',
                overflowX: 'hidden',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                fontSize: fontSizes.xs,
                color: colors.white_muted,
                padding: '4px 0'
              }}
            >
              {typeof decoded == 'string'
                ? decoded
                : decoded?.txType == 'KASPLEX_L2_BRIDGE'
                ? decoded?.address
                : decoded?.txType == 'IGRA_BRIDGE_0X92'
                ? safeStringify(decoded?.fields)
                : safeStringify(decoded)}
            </div>
          </EndCard>
        </Column>
      )}
    </Column>
  );
}

function BlockHashList({ blockhashs, onCopy }: { blockhashs: string[]; onCopy: (text: string) => void }) {
  const { t } = useTranslation();
  return (
    <Column gap="zero">
      {blockhashs.map((blockhash: string, index: number) => {
        const isLast = index === blockhashs.length - 1;
        const CardType = blockhashs.length === 1 ? Card : index === 0 ? StartCard : isLast ? EndCard : MiddleCard;
        return (
          <CardType key={index}>
            <Row justifyBetween full itemsCenter py="sm" style={{ overflow: 'hidden' }}>
              <Text text={index === 0 ? t('Block Hash') : `#${index}`} preset="sub" style={{ flexShrink: 0 }} />
              <Row
                itemsCenter
                gap="xs"
                onClick={() => onCopy(blockhash)}
                style={{ cursor: 'pointer', overflow: 'hidden', minWidth: 0 }}
              >
                <Text text={shortAddress(blockhash)} wrap />
                <CopyOutlined style={{ color: colors.icon_secondary, fontSize: 14, flexShrink: 0 }} />
              </Row>
            </Row>
          </CardType>
        );
      })}
    </Column>
  );
}

function Inputs({ inputs, onCopy }: { inputs: TxInput[]; onCopy: (text: string) => void }) {
  const kasTick = useAppSelector(selectKasTick);
  const currentAccount = useCurrentAccount();
  const blockstreamUrl = useAppSelector(selectBlockstreamUrl);
  const senders = useMemo(() => {
    const data: TxParticipant[] = [];
    inputs.forEach((i) => {
      const address = i.previous_outpoint_address;
      const amount = sompiToAmount(i.previous_outpoint_amount, 8).replace(/\.0+$/, '');
      const alianName = currentAccount.address == address ? 'Self' : undefined;
      data.push({
        address,
        amount,
        alianName
      });
    });
    return data;
  }, [currentAccount.address, inputs]);

  return (
    <Column gap="zero">
      {senders.map((sender, index: number) => {
        const isLast = index === senders.length - 1;
        const CardType = senders.length === 1 ? Card : index === 0 ? StartCard : isLast ? EndCard : MiddleCard;
        return (
          <CardType key={index}>
            <Row justifyBetween full itemsCenter py="sm" style={{ overflow: 'hidden' }}>
              <Row itemsCenter gap="xs" style={{ flexShrink: 0 }}>
                {sender.alianName && <Text text={sender.alianName} color="aqua" size="xs" />}
              </Row>
              <Row justifyEnd itemsCenter gap="sm" style={{ overflow: 'hidden', flex: '1 1 0%', minWidth: 0 }}>
                <Row gap="zero" style={{ flexShrink: 0 }}>
                  <Text text="-" color="red" />
                  <Text text={`${formatLocaleString(sender.amount)} ${kasTick}`} preset="sub" />
                </Row>
                <Row
                  gap="xs"
                  itemsCenter
                  onClick={() => {
                    window.open(`${blockstreamUrl}/addresses/${sender.address}`);
                  }}
                  style={{ cursor: 'pointer', overflow: 'hidden', minWidth: 0 }}
                >
                  <Text text={shortAddress(sender.address)} preset="link" />
                  <Icon icon="link" size={fontSizes.xxs} color="blue" />
                  <CopyOutlined
                    style={{ color: colors.icon_secondary, fontSize: 14, flexShrink: 0 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onCopy(sender.address);
                    }}
                  />
                </Row>
              </Row>
            </Row>
          </CardType>
        );
      })}
    </Column>
  );
}

function Outputs({ outputs, onCopy }: { outputs: TxOutput[]; onCopy: (text: string) => void }) {
  const kasTick = useAppSelector(selectKasTick);
  const currentAccount = useCurrentAccount();
  const blockstreamUrl = useAppSelector(selectBlockstreamUrl);
  const recipients = useMemo(() => {
    const data: TxParticipant[] = [];
    outputs.forEach((i) => {
      const address = i.script_public_key_address;
      const amount = sompiToAmount(i.amount, 8).replace(/\.0+$/, '');
      const alianName = currentAccount.address == address ? 'Self' : undefined;
      data.push({
        address,
        amount,
        alianName
      });
    });
    return data;
  }, [currentAccount.address, outputs]);

  return (
    <Column gap="zero">
      {recipients.map((recipient, index: number) => {
        const isLast = index === recipients.length - 1;
        const CardType = recipients.length === 1 ? Card : index === 0 ? StartCard : isLast ? EndCard : MiddleCard;
        return (
          <CardType key={index}>
            <Row justifyBetween full itemsCenter py="sm" style={{ overflow: 'hidden' }}>
              <Row itemsCenter gap="xs" style={{ flexShrink: 0 }}>
                {recipient.alianName && <Text text={recipient.alianName} color="aqua" size="xs" />}
              </Row>
              <Row justifyEnd itemsCenter gap="sm" style={{ overflow: 'hidden', flex: '1 1 0%', minWidth: 0 }}>
                <Row gap="zero" style={{ flexShrink: 0 }}>
                  <Text text="+" color="green" />
                  <Text text={`${formatLocaleString(recipient.amount)} ${kasTick}`} preset="sub" />
                </Row>
                <Row
                  gap="xs"
                  itemsCenter
                  onClick={() => {
                    window.open(`${blockstreamUrl}/addresses/${recipient.address}`);
                  }}
                  style={{ cursor: 'pointer', overflow: 'hidden', minWidth: 0 }}
                >
                  <Text text={shortAddress(recipient.address)} preset="link" />
                  <Icon icon="link" size={fontSizes.xxs} color="blue" />
                  <CopyOutlined
                    style={{ color: colors.icon_secondary, fontSize: 14, flexShrink: 0 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onCopy(recipient.address);
                    }}
                  />
                </Row>
              </Row>
            </Row>
          </CardType>
        );
      })}
    </Column>
  );
}

function Krc20HistoryCard({ txId }: { txId: string }) {
  const networkId = useAppSelector(selectNetworkId);
  const [krc20History, setkrc20History] = useState<TKRC20History | null>();
  const address = useAppSelector(selectCurrentKaspaAddress);
  const { activity, isLoading } = useKrc20ActivityByTxidQuery(networkId, txId, true);
  useEffect(() => {
    if (activity) {
      const to = (activity as IKRC20Transfer)?.to;
      const from = activity?.from;
      if (to == address || from == address) setkrc20History(activity);
      else setkrc20History(null);
    } else {
      setkrc20History(null);
    }
  }, [activity, address]);
  if (isLoading) {
    return (
      <Row justifyCenter mt="sm">
        <LoadingSpinner size="medium" />
      </Row>
    );
  }
  return <>{krc20History && <KRC20HistoryCardWithoutToken history={krc20History} />}</>;
}
