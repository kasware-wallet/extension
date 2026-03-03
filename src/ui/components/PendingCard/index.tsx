import log from 'loglevel';
import { useEffect, useState } from 'react';

import type { ITxInfo, TPendingTxType } from '@/shared/types';
import { useAppSelector } from '@/ui/state/hooks';
import { selectKasTick } from '@/ui/state/settings/reducer';
import { colors } from '@/ui/theme/colors';
import { fontSizes } from '@/ui/theme/font';
import { formatLocaleString, shortAddress, sleepSecond } from '@/ui/utils';
import { CheckCircleFilled, LoadingOutlined } from '@ant-design/icons';

import { useTools } from '../ActionComponent';
import { Button } from '../Button';
import { Card } from '../Card';
import { Column } from '../Column';
import { Input } from '../Input';
import { Row } from '../Row';
import { Text } from '../Text';

export function TxListCard({
  e,
  handleReplaceTransaction
}: {
  e: ITxInfo;

  handleReplaceTransaction: (id: string, txFee: number) => Promise<void>;
}) {
  const [newTxFee, setNewTxFee] = useState<string>('0.01');
  const kasTick = useAppSelector(selectKasTick);
  const [pending, setPending] = useState<boolean>(false);
  const [isNewTxFee, setIsNewTxFee] = useState<boolean>(false);
  const [showRBFFeature, setShowRBFFeature] = useState<boolean>(false);
  const tools = useTools();
  const [error, setError] = useState<string>('');
  return (
    <>
      <Card
        key={e.transaction_id}
        style={{ gap: 0 }}
        classname="card-select"
        mt="sm"
        onClick={() => setShowRBFFeature(!showRBFFeature)}
      >
        <Column full>
          <Row justifyBetween>
            <Row itemsCenter>
              <Text text={e.mode == 'retrieve' ? '+' : '-'} color={e.mode == 'retrieve' ? 'green' : 'red'} />
              <Text text={`${formatLocaleString(e.amount)} ${kasTick}`} />
            </Row>
            <TxConfirmState
              pending={pending}
              // isAccepted={e.isAccepted}
              status={e.status}
              mode={e.mode}
              // acceptingBlockBlueScore={e.txDetail.accepting_block_blue_score}
              blockTime={Number(e.block_time)}
            />
          </Row>
          <Row justifyBetween itemsCenter>
            <Text text={`${shortAddress(e?.transaction_id)}`} preset="sub" color={isNewTxFee ? 'green' : undefined} />
            <Text text={`tx fee: ${e?.txFee} ${kasTick}`} preset="sub" color={isNewTxFee ? 'green' : undefined} />
          </Row>
        </Column>
      </Card>
      {showRBFFeature === true && e.status == 'submitted' && (
        <>
          <Row style={{ gap: 0 }}>
            <Column fullX>
              <Input
                disabled={pending == true}
                preset="amount"
                placeholder={'input new tx fee'}
                value={`${newTxFee}`}
                onAmountInputChange={(val) => {
                  setNewTxFee(val);
                }}
                // onKeyUp={(e) => handleOnKeyUp(e)}
                autoFocus={true}
              />
            </Column>
            {pending == false && (
              <Button
                style={{
                  height: '46.5px'
                }}
                disabled={false}
                text={'Add tx fee(RBF)'}
                preset="primary"
                onClick={async () => {
                  setPending(true);
                  try {
                    await handleReplaceTransaction(e.transaction_id, Number(newTxFee));
                    setIsNewTxFee(true);
                    await sleepSecond(10);
                    setIsNewTxFee(false);
                  } catch (e) {
                    log.debug('error', e);
                    const errMsg = (e as Error).message ? (e as Error).message : JSON.stringify(e);
                    tools.toastError(errMsg);
                    setError(errMsg);
                    setTimeout(() => setError(''), 10000);
                  }
                  setPending(false);
                }}
              />
            )}
            {pending == true && (
              <Button disabled={true} preset="default">
                <LoadingOutlined style={{ color: '#AAA' }} />
              </Button>
            )}
          </Row>
          {error && <Text text={error} color="error" selectText />}
        </>
      )}
    </>
  );
}

function TxConfirmState({
  pending,
  // isAccepted,
  status,
  mode,
  // acceptingBlockBlueScore,
  blockTime
}: {
  pending: boolean;
  // isAccepted: boolean;
  status: string;
  mode: TPendingTxType;
  // acceptingBlockBlueScore: number;
  blockTime: number;
}) {
  const [timeCount, setTimeCount] = useState('0');
  useEffect(() => {
    if (pending == false) setTimeCount('0');
    const intervalId = setInterval(() => {
      const time = ((new Date().getTime() - Number(blockTime)) / 1000).toFixed(0);
      setTimeCount(time);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [pending]);

  if (status == 'submitted') {
    return (
      <Row selfItemsCenter itemsCenter>
        <LoadingOutlined
          style={{
            fontSize: fontSizes.icon,
            color: colors.grey
          }}
        />
        <Text text={mode} preset="sub" />
        <Text text={`${formatLocaleString(timeCount)} s`} preset="sub" />
      </Row>
    );
  } else {
    return (
      <Row selfItemsCenter itemsCenter>
        <CheckCircleFilled style={{ fontSize: fontSizes.icon, color: colors.green }} />
        <Text selfItemsCenter text={mode} preset="sub" />
        <Text selfItemsCenter text={status} preset="sub" />
      </Row>
    );
  }
}
