import log from 'loglevel';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import eventBus from '@/shared/eventBus';

import { Button } from '@/ui/components/Button';
import { Card, LoadingSpinner, Row, Text } from '@/ui/components';
import { Empty } from '@/ui/components/Empty';
import { useTools } from '@/ui/components/ActionComponent';

import { selectCurrentAccount } from '@/ui/state/accounts/reducer';
import { selectRpcStatus } from '@/ui/state/global/reducer';
import { useAppSelector } from '@/ui/state/hooks';

import { selectKasTick } from '@/ui/state/settings/reducer';
import { useFetchUtxosCallback } from '@/ui/state/transactions/hooks';
import { selectUtxos } from '@/ui/state/transactions/reducer';

import { formatLocaleString, shortAddress, useWallet } from '@/ui/utils';

import { useNavigate } from '../../MainRoute';

import { sompiToAmount } from '@/shared/utils/format';

export default function UTXOTab() {
  const rpcStatus = useAppSelector(selectRpcStatus);
  const utxos = useAppSelector(selectUtxos);
  const currentAccount = useAppSelector(selectCurrentAccount);
  const fetchUtxos = useFetchUtxosCallback();
  const wallet = useWallet();
  const [loading, setLoading] = useState(false);
  const tools = useTools();
  const { t } = useTranslation();
  const kasTick = useAppSelector(selectKasTick);
  const compound = async () => {
    setLoading(true);
    try {
      const result = await wallet.compoundUtxos([currentAccount]);
      setLoading(false);
      if (result == null || result == undefined) {
        tools.toastError('failed, please try again');
      } else {
        // await reloadAccounts();
        tools.toastSuccess('success');
      }
    } catch (e) {
      setLoading(false);
      tools.toastError((e as Error).message);
    }
  };
  useEffect(() => {
    if (!rpcStatus) return;
    const timer = setTimeout(() => {
      if (rpcStatus) {
        setLoading(true);
        fetchUtxos()
          .finally(() => {
            setLoading(false);
          })
          .catch((e) => {
            log.debug(e.message);
          });
      }
    }, 800);
    const utxosChangedHandler = () => {
      setLoading(true);
      fetchUtxos().finally(() => {
        setLoading(false);
      });
    };
    eventBus.addEventListener('utxosChangedNotification', utxosChangedHandler);
    return () => {
      clearTimeout(timer);
      eventBus.removeEventListener('utxosChangedNotification', utxosChangedHandler);
    };
  }, [currentAccount.address, rpcStatus, fetchUtxos]);
  const navigate = useNavigate();
  if (utxos && utxos.length > 0) {
    return (
      <>
        {utxos.length > 100 && (
          <Row justifyCenter my="xs" itemsCenter>
            <Text text="Too many UTXOs. Please compound them." color="warning" preset="sub" />
          </Row>
        )}
        <div>
          {utxos.length > 1 && (
            <Row justifyBetween itemsCenter>
              <Text text={`${formatLocaleString(utxos.length)} UTXOs`} preset="sub" />
              {loading == true && (
                <Row justifyCenter>
                  <LoadingSpinner size="medium" />
                </Row>
              )}
              <Button
                text={t('Compound')}
                preset="default"
                onClick={() => {
                  compound();
                }}
              />
            </Row>
          )}
          {utxos.map((e, index) => {
            if (index > 20) return null;
            return (
              <Card
                key={e.entry.outpoint.transactionId + e.entry.amount}
                classname="card-select"
                mt="sm"
                onClick={() => {
                  navigate('UtxoDetailScreen', { utxoDetail: e });
                }}
              >
                <Row full justifyBetween itemsCenter>
                  <Text text={`${formatLocaleString(sompiToAmount(e.entry.amount, 8))} ${kasTick}`} />
                  {e?.entry.outpoint?.transactionId ? (
                    <Text text={shortAddress(e?.entry.outpoint?.transactionId)} preset="sub" />
                  ) : (
                    <Text text={e.entry.blockDaaScore} preset="sub" />
                  )}
                </Row>
              </Card>
            );
          })}
        </div>
      </>
    );
  } else if (loading) {
    return (
      <Row justifyCenter>
        <LoadingSpinner size="medium" />
      </Row>
    );
  } else {
    return <Empty />;
  }
}
