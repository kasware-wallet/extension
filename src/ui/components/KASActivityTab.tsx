import { Avatar } from 'antd';
import log from 'loglevel';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { TKRC20History } from '@/shared/types';
import { NetworkType } from '@/shared/types';
import { Card, Column, Icon, LoadingSpinner, Row, Text } from '@/ui/components';

import { useTools } from '@/ui/components/ActionComponent';

import { Empty } from '@/ui/components/Empty';

import { selectCurrentAccount, selectCurrentKaspaAddress } from '@/ui/state/accounts/reducer';
import { selectRpcStatus } from '@/ui/state/global/reducer';
import { useAppDispatch, useAppSelector } from '@/ui/state/hooks';

import { selectBlockstreamUrl, selectKasTick, selectNetworkId, selectNetworkType } from '@/ui/state/settings/reducer';
import { useFetchTxActivitiesCallback, useIncomingTx } from '@/ui/state/transactions/hooks';
import { selectTxActivities, transactionsActions } from '@/ui/state/transactions/reducer';

import { fontSizes } from '@/ui/theme/font';
import { formatLocaleString, formatTimeAgo, shortAddress, useWallet } from '@/ui/utils';
import { useKrc20ActivitiesQuery } from '@/ui/utils/hooks/kasplex/fetchKrc20AddressTokenList';

import igraIcon from '@/assets/igra.png';
import kasplexIcon from '@/assets/icons/kasplex.ico';

import { useNavigate } from '../pages/MainRoute';

import { IGRA_HEX, IGRA_PAYLOAD_HEX_LEN, KASPLEX_HEX, KASPLEX_L2_BRIDGE_HEX } from '@/ui/utils/payload';

const KASPLEX_BRIDGE_ENTRY_ADDRESS_MAINNET = 'kaspa:qypr0qj7luv26laqlquan9n2zu7wyen87fkdw3kx3kd69ymyw3tj4tsh467xzf2';
const KASPLEX_BRIDGE_ENTRY_ADDRESS_TN10 = 'kaspatest:qyp7xxc2c2u0rs6uhgrs88ljjd0tlgjjxnu5a48899xmma894p68mggzct64wuu';
// IGRA txId prefixes: 97b1 = chain ID 38833, 97b4 = chain ID 38836
const IGRA_TXID_PREFIXES = ['97b1', '97b4'];
import { useRpcStatus } from '../state/global/hooks';

// Custom hook to poll blueScore until it reaches the target
function useBlueScore(targetBlueScore: number) {
  const rpcStatus = useRpcStatus();
  const wallet = useWallet();
  const [blueScore, setBlueScore] = useState<number>(300000000);
  const shouldStopRef = useRef(false);

  // Poll when target > 0 and current blueScore < target
  const needsPolling = targetBlueScore > 0 && blueScore < targetBlueScore;

  useEffect(() => {
    if (!rpcStatus || !needsPolling) return;

    shouldStopRef.current = false;

    const pollBlueScore = async () => {
      if (shouldStopRef.current) return;
      try {
        const score = await wallet.getBlueScore();
        if (!shouldStopRef.current) {
          setBlueScore(score);
        }
      } catch (e) {
        log.debug('Failed to get blueScore', e);
      }
    };

    pollBlueScore();
    const interval = setInterval(pollBlueScore, 2000);

    return () => {
      shouldStopRef.current = true;
      clearInterval(interval);
    };
  }, [wallet, needsPolling, rpcStatus]);

  return blueScore;
}

export default function KASActivityTab() {
  const navigate = useNavigate();
  const networkId = useAppSelector(selectNetworkId);
  const currentAddress = useAppSelector(selectCurrentKaspaAddress);
  const transactionInfos = useAppSelector(selectTxActivities);
  const incomingTx = useIncomingTx();
  const fetchTxActivities = useFetchTxActivitiesCallback();
  const wallet = useWallet();
  const [loading, setLoading] = useState(false);
  const dispatch = useAppDispatch();
  const kasTick = useAppSelector(selectKasTick);
  const [krc20TxIds, setkrc20TxIds] = useState<string[]>([]);

  const blockstreamUrl = useAppSelector(selectBlockstreamUrl);
  const currentAccount = useAppSelector(selectCurrentAccount);
  const { t } = useTranslation();
  const currentNetworkType = useAppSelector(selectNetworkType);
  const tools = useTools();
  // const rpcStatus = useRpcStatus();
  const rpcStatus = useAppSelector(selectRpcStatus);
  const { activities: krc20Activities, refetch: refetchKrc20Activities } = useKrc20ActivitiesQuery(
    networkId,
    currentAddress
  );
  const startFetchTxActivities = useCallback(() => {
    setLoading(true);
    fetchTxActivities()
      .finally(() => {
        setLoading(false);
      })
      .catch((e) => {
        log.debug(e.message);
        dispatch(transactionsActions.setTxActivities([]));
        tools.toastError(e?.message || 'Failed to fetch transactions');
      });
    refetchKrc20Activities().catch((e) => {
      log.debug(e);
      tools.toastError(e?.message || 'Failed to fetch KRC20 activities');
    });
  }, [dispatch, fetchTxActivities, refetchKrc20Activities, tools, currentAccount?.address]);
  useEffect(() => {
    const timer = setTimeout(() => {
      startFetchTxActivities();
    }, 1000);
    return () => {
      clearTimeout(timer);
    };
  }, [currentAccount?.address, networkId, startFetchTxActivities]);
  useEffect(() => {
    if (krc20Activities && krc20Activities.length > 0) {
      const txIds = krc20Activities.map((e: TKRC20History) => e.hashRev);
      setkrc20TxIds(txIds);
    }
  }, [krc20Activities]);

  useEffect(() => {
    wallet.getPendingTxDatas(currentAddress).then((res) => {
      // txListRef.current = res;
      dispatch(transactionsActions.setPendingList(res));
    });
  }, [currentAddress, dispatch, wallet]);

  // Calculate the minimum blue score needed for all transactions to be confirmed
  // Poll blueScore only if any transaction needs more confirmations (< 100)
  const minBlueScoreNeeded = useMemo(() => {
    if (!transactionInfos || transactionInfos.length === 0) return 0;
    const scores = transactionInfos
      .filter((tx) => tx.isAccepted !== false && tx.txDetail?.accepting_block_blue_score)
      .map((tx) => tx.txDetail.accepting_block_blue_score + 100);
    return scores.length > 0 ? Math.max(...scores) : 0;
  }, [transactionInfos]);

  const blueScore = useBlueScore(minBlueScoreNeeded);

  if (currentNetworkType !== NetworkType.Mainnet && currentNetworkType !== NetworkType.Testnet) {
    return (
      <Row justifyCenter>
        <Text text="Not Supported." mt="md" />
      </Row>
    );
  }
  // if (transactionInfos && transactionInfos.length > 0) {
  return (
    <>
      {incomingTx && (
        <Card
          key={'incomingtx'}
          classname="card-select"
          my="sm"
          fullX
          justifyCenter
          selfItemsCenter
          style={{ minHeight: 40 }}
          onClick={() => {
            if (loading === false) startFetchTxActivities();
          }}
        >
          <Text text="incoming transaction..." size="sm" />
        </Card>
      )}
      {transactionInfos && transactionInfos.length > 0 && (
        <div>
          {loading && (
            <Row justifyCenter mt="sm">
              <LoadingSpinner size="medium" />
            </Row>
          )}
          {transactionInfos.map((e) => (
            <Card
              key={e.transaction_id}
              classname="card-select"
              mt="sm"
              onClick={() => {
                navigate('TxDetailScreen', {
                  txDetail: e.txDetail,
                  txId: e.transaction_id
                });
              }}
            >
              <Row full justifyBetween>
                <Column full>
                  <Row justifyBetween>
                    <Row itemsCenter>
                      <Text
                        text={e.mode == 'Receive' ? '+' : '-'}
                        color={e.mode == 'Receive' ? 'green' : 'red'}
                        selectText
                      />
                      <Text text={`${formatLocaleString(e.amount)} ${kasTick}`} selectText />
                      <TxAvatar
                        txId={e.transaction_id}
                        krc20TxIds={krc20TxIds}
                        txPayload={e?.payload}
                        relatedAddress={e.relatedAddresses}
                      />
                    </Row>
                    <TxConfirmState
                      isAccepted={e.isAccepted}
                      acceptingBlockBlueScore={e.txDetail.accepting_block_blue_score}
                      blueScore={blueScore}
                    />
                  </Row>
                  <Row justifyBetween>
                    <Text text={shortAddress(e.transaction_id)} preset="sub" />
                    <Text text={formatTimeAgo(e.block_time)} preset="sub" />
                  </Row>
                </Column>
              </Row>
            </Card>
          ))}
          <Card
            key={'more-tx'}
            classname="card-select"
            mt="sm"
            onClick={() => {
              window.open(`${blockstreamUrl}/addresses/${currentAccount.address}`);
            }}
          >
            <Row full justifyCenter itemsCenter>
              <Text preset="link" text={t('More')} size="md" />
              <Icon icon="link" size={fontSizes.xs} color="blue" />
            </Row>
          </Card>
        </div>
      )}
      {loading && (
        <Row justifyCenter mt="sm">
          <LoadingSpinner size="medium" />
        </Row>
      )}
      {loading === false && (!transactionInfos || transactionInfos.length == 0) && <Empty />}
    </>
  );
}

function TxAvatar({
  txId,
  krc20TxIds,
  txPayload,
  relatedAddress
}: {
  txId: string;
  krc20TxIds: string[];
  txPayload: string | undefined;
  relatedAddress?: string[];
}) {
  const payloadIconUrl = useMemo(() => {
    if (!txPayload?.length) return undefined;
    const PAYLOAD_ICON_MAP = {
      [IGRA_HEX]: igraIcon,
      [KASPLEX_HEX]: kasplexIcon,
      [KASPLEX_L2_BRIDGE_HEX]: kasplexIcon
    };
    const matchedHex = Object.keys(PAYLOAD_ICON_MAP).find((hex) => {
      if (hex === IGRA_HEX)
        return (
          txPayload.startsWith(hex) &&
          txPayload.length === IGRA_PAYLOAD_HEX_LEN &&
          IGRA_TXID_PREFIXES.some((p) => txId.startsWith(p))
        );
      if (hex === KASPLEX_L2_BRIDGE_HEX)
        return (
          txPayload.startsWith(hex) &&
          (relatedAddress?.includes(KASPLEX_BRIDGE_ENTRY_ADDRESS_MAINNET) ||
            relatedAddress?.includes(KASPLEX_BRIDGE_ENTRY_ADDRESS_TN10))
        );
      return txPayload.startsWith(hex);
    });
    return matchedHex ? PAYLOAD_ICON_MAP[matchedHex] : undefined;
  }, [txPayload, txId, relatedAddress]);

  if (txId !== undefined && krc20TxIds.includes(txId)) {
    return <Avatar size={16} src={kasplexIcon} />;
  } else if (txPayload && txPayload?.length > 0 && payloadIconUrl && payloadIconUrl?.length > 0) {
    return <Avatar size={16} src={payloadIconUrl} />;
  } else {
    return null;
  }
}

function TxConfirmState({
  isAccepted,
  acceptingBlockBlueScore,
  blueScore
}: {
  isAccepted: boolean;
  acceptingBlockBlueScore: number;
  blueScore: number;
}) {
  if (isAccepted == false) {
    return (
      <Row>
        <Text text={isAccepted ? 'Accepted' : 'Not Accepted'} preset="sub" />
      </Row>
    );
  }
  if (!blueScore || blueScore <= 0 || blueScore - acceptingBlockBlueScore <= 0) {
    return (
      <Row>
        <Text text={isAccepted ? 'Accepted' : 'Not Accepted'} preset="sub" />
      </Row>
    );
  }
  if (blueScore - acceptingBlockBlueScore < 100) {
    return (
      <Row>
        <Text text={`${blueScore - acceptingBlockBlueScore} Confirmed`} preset="sub" />
      </Row>
    );
  }
  return (
    <Row>
      <Text text={'Confirmed'} preset="sub" />
    </Row>
  );
}
