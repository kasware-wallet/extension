import { Progress } from 'antd';
import BigNumber from 'bignumber.js';
import log from 'loglevel';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';

import eventBus from '@/shared/eventBus';
import type { IKRC20TokenInfo, IKRC20TokenInfoIssue, KasplexData } from '@/shared/types';
import { Button, Column, Content, Footer, Header, Icon, Layout, Row, Text } from '@/ui/components';
import { useTools } from '@/ui/components/ActionComponent';
import { FeeRateBar, PriorityFeeType } from '@/ui/components/FeeRateBar';
import { useAccountBalance, useFetchInscriptionsCallback } from '@/ui/state/accounts/hooks';
import { selectAccountInscriptions, selectCurrentKaspaAddress } from '@/ui/state/accounts/reducer';
import { useRpcStatus } from '@/ui/state/global/hooks';
import { useAppDispatch, useAppSelector } from '@/ui/state/hooks';
import { selectKasTick, selectNetworkId } from '@/ui/state/settings/reducer';
import { usePendingList, useReplaceTransactionCallback } from '@/ui/state/transactions/hooks';
import { transactionsActions } from '@/ui/state/transactions/reducer';
import { useFeeRateOption, useKRC20History } from '@/ui/state/ui/hooks';
import { KRC20MintDeployTabKey, uiActions } from '@/ui/state/ui/reducer';
import { colors } from '@/ui/theme/colors';
import { formatLocaleString, shortAddress, sleepSecond, useWallet } from '@/ui/utils';
import { LoadingOutlined } from '@ant-design/icons';

import { useNavigate } from '../MainRoute';
import { sompiToAmount } from '@/shared/utils/format';

export default function KRC20BatchMintProcessScreen() {
  const kasTick = useAppSelector(selectKasTick);
  const [searchParams] = useSearchParams();
  const inscribeJsonString = searchParams.get('inscribeJsonString');
  const times = searchParams.get('times') ? Number(searchParams.get('times')) : 0;
  const networkId = searchParams.get('networkId');
  const sourceAddr = searchParams.get('sourceAddr');
  const priorityFee = searchParams.get('priorityFee') ? Number(searchParams.get('priorityFee')) : 0;
  const { t } = useTranslation();
  const handleReplaceTransaction = useReplaceTransactionCallback();
  const tools = useTools();
  const currentAddress = useAppSelector(selectCurrentKaspaAddress);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [error, setError] = useState<string>('');
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [balanceAmount, setBalanceAmount] = useState<string>('');
  const [startCancel, setStartCancel] = useState(false);
  const krc20History = useKRC20History();
  const currentNetworkId = useAppSelector(selectNetworkId);
  const [pending, setPending] = useState<boolean>(false);
  const [isNewTxFee, setIsNewTxFee] = useState<boolean>(false);
  const fRO = useFeeRateOption();
  const handleCancel = async () => {
    setStartCancel(true);
    await wallet.setBatchMintStatus(false);
    setIsComplete(true);
    setStartCancel(false);
    let arr: string[] = [];
    if (networkId) {
      arr = [
        krc20History[networkId]?.mintArr,
        krc20History[networkId]?.deployArr,
        krc20History[networkId]?.transferArr
      ].flatMap((arr2) => arr2 || []);
    }
    if (fRO[PriorityFeeType.AVG]?.feeRate && fRO[PriorityFeeType.AVG].feeRate <= 1) {
      wallet.onSearchAndRetrieve(arr);
    } else {
      log.debug('feeRate is larger than 1. User needs to retrieve txs manually.');
    }
  };

  const krc20Tick = useMemo(() => {
    if (inscribeJsonString) {
      const json: KasplexData<'mint'> = JSON.parse(inscribeJsonString);
      const tick = json?.tick;
      return tick;
    }
    return '';
  }, [inscribeJsonString]);

  const handleProcess = async () => {
    if (currentNetworkId !== networkId) {
      handleCancel().then(() => {
        tools.toastError('network type changed');
        setError('network type changed');
      });
    } else {
      try {
        if (inscribeJsonString) {
          wallet.signKRC20BatchMintCommit(inscribeJsonString, times, priorityFee);
          wallet.signKRC20BatchMintReveal(inscribeJsonString, times, priorityFee);
        } else {
          tools.toastError('inscribeJsonString is empty');
          setError('inscribeJsonString is empty');
        }
      } catch (e) {
        log.debug((e as Error).message);
        setError((e as Error).message);
      }
    }
  };

  const handleInitPendingTxs = async () => {
    if (sourceAddr) {
      const res = await wallet.getPendingTxDatas(sourceAddr);
      for (let i = 0; i < res.length; i++) {
        const txId = res[i].transaction_id;
        const txFee = 0.001 + priorityFee;
        await handleReplaceTransaction(txId, txFee);
      }
    }
  };
  useEffect(() => {
    handleProcess();
  }, []);

  useEffect(() => {
    try {
      handleInitPendingTxs();
    } catch (e) {
      log.debug(e);
    }
  }, []);
  useEffect(() => {
    wallet.getPendingTxDatas(currentAddress).then((res) => {
      dispatch(transactionsActions.setPendingList(res));
    });
  }, []);

  useEffect(() => {
    const handleTabClose = () => {
      // event.preventDefault();
      handleCancel();
      // return (event.returnValue = 'Are you sure you want to exit?');
    };
    window.addEventListener('beforeunload', handleTabClose);
    return () => {
      window.removeEventListener('beforeunload', handleTabClose);
    };
  }, []);
  const wallet = useWallet();
  const [signPercent, setSignPercent] = useState<{ percent: number; msg: string }>({ percent: 0, msg: '' });
  const successCountRef = useRef(0);
  const failedCountRef = useRef(0);
  const fetchInscription = useFetchInscriptionsCallback();
  const accountInscriptions = useAppSelector(selectAccountInscriptions);
  const displayedItem = useMemo(() => {
    const tempItems = accountInscriptions?.list;
    return tempItems.find((item) => item.tick === krc20Tick);
  }, [accountInscriptions?.list, krc20Tick]);
  const rpcStatus = useRpcStatus();
  const [txFee, setTxFee] = useState(0);
  const accountBalance = useAccountBalance();
  const [currentPriorityFee, setCurrentPriorityFee] = useState(priorityFee);
  const [newPriorityFee, setNewPriorityFee] = useState(0);
  const pendingList = usePendingList();

  useEffect(() => {
    const fetchTxFee = async () => {
      const fee = await wallet
        .getTxFee(currentAddress, currentAddress, currentAddress, 20, 0, accountBalance.amount == '20' ? true : false)
        .catch((err) => {
          console.error('fetchTxFee error', err);
          setTxFee(0.0001);
        });
      if (fee) {
        setTxFee(fee);
      } else {
        setTxFee(0.0001);
      }
    };
    fetchTxFee();
  }, [currentAddress, rpcStatus]);
  const handleBatchMintProcess = (e: string) => {
    const obj: { successCount?: number; failedCount?: number; error?: string } = JSON.parse(e);
    if (obj?.successCount && obj?.successCount > 0) {
      successCountRef.current++;
      if (successCountRef.current >= times) handleCancel();
      fetchInscription()
        .finally()
        .catch((e) => {
          log.debug(e.message);
        });
    }
    if (obj?.failedCount && obj?.failedCount > 0) {
      failedCountRef.current++;
    }
    if (obj?.error != undefined) {
      const error = obj.error;
      handleCancel().then(() => {
        tools.toastError(error);
        setError(error);
      });
    }
  };
  const handleBatchMintProcessRef = useRef(handleBatchMintProcess);
  handleBatchMintProcessRef.current = handleBatchMintProcess;
  const processorBalanceHandler = (event: {
    address: string;
    balance: {
      mature: string | number | bigint | BigNumber | undefined;
      pending: string | number | bigint | BigNumber | undefined;
      outgoing: string | number | bigint | BigNumber | undefined;
    };
  }) => {
    if (event.address !== sourceAddr) return;
    const amount = sompiToAmount(event.balance?.mature, 8);
    const pending = sompiToAmount(event.balance?.pending, 8);
    const outgoing = sompiToAmount(event.balance?.outgoing, 8);
    const amt = new BigNumber(amount).plus(pending).plus(outgoing).toString();
    setBalanceAmount(amt);
  };

  const signKRC20ProcessHandler = (e: string) => {
    const res: { percent: number; msg: string } = JSON.parse(e);
    setSignPercent(res);
  };
  const fetchBalance = async (sourceAddr: string) => {
    const balance = await wallet.getAddressBalance(sourceAddr);
    setBalanceAmount(balance.amount);
  };

  const handleUpdate = async () => {
    if (newPriorityFee <= 0) return;
    setPending(true);
    log.debug('handle update');
    // network is congested and need rbf to free utxos
    if (successCountRef.current == 0) {
      const res = pendingList.filter((e) => e.mode == 'commit');
      if (res.length > 0) {
        for (const e of res) {
          await handleReplaceTransaction(e.transaction_id, newPriorityFee);
        }
      }
      const res2 = pendingList.filter((e) => e.mode == 'sendkas');
      if (res2.length > 0) {
        for (const e of res2) {
          await handleReplaceTransaction(e.transaction_id, newPriorityFee);
        }
        await sleepSecond(3);
        if (inscribeJsonString) await wallet.signKRC20BatchMintCommit(inscribeJsonString, times, newPriorityFee);
      }
      if (res2.length == 0 && res.length == 0) {
        if (inscribeJsonString) await wallet.signKRC20BatchMintCommit(inscribeJsonString, times, newPriorityFee);
      }
    }

    try {
      setCurrentPriorityFee(newPriorityFee);
      await wallet.setBatchMintPriorityFee(newPriorityFee);
      setIsNewTxFee(true);
      for (const e of pendingList) {
        const oldId = e.transaction_id;
        await handleReplaceTransaction(oldId, newPriorityFee);
      }
    } catch (e) {
      tools.toastError((e as Error).message ? (e as Error).message : JSON.stringify(e));
    }

    await sleepSecond(5);
    setIsNewTxFee(false);
    setPending(false);
  };
  useEffect(() => {
    eventBus.addEventListener('signkrc20process', signKRC20ProcessHandler);
    return () => {
      eventBus.removeEventListener('signkrc20process', signKRC20ProcessHandler);
    };
  }, []);

  useEffect(() => {
    if (sourceAddr) fetchBalance(sourceAddr);
    eventBus.addEventListener('processor-balance-event', processorBalanceHandler);

    return () => {
      eventBus.removeEventListener('processor-balance-event', processorBalanceHandler);
    };
  }, []);

  useEffect(() => {
    eventBus.addEventListener('batchmintkrc20process', handleBatchMintProcess);
    return () => {
      eventBus.removeEventListener('batchmintkrc20process', handleBatchMintProcess);
    };
  }, []);

  return (
    <Layout>
      <Header title={`${t('Mint')} ${krc20Tick}`} />
      <Content>
        <Column gap="zero">
          <Row justifyCenter>
            <Text
              text="*Do not switch network or close the window. Or minting will be stopped."
              color="warning"
              textCenter
            />
          </Row>

          <TokenInfo tick={krc20Tick} successCount={successCountRef.current} handleCancel={handleCancel} />
          <Progress
            percent={Number(((successCountRef.current / times) * 100).toFixed(0))}
            success={{ percent: Number(((successCountRef.current / times) * 100).toFixed(0)) }}
          />
          <Text textCenter text={signPercent.msg} color="textDim" style={{ wordWrap: 'break-word' }} preset="sub" />
          <Row justifyBetween fullX itemsCenter py="sm">
            <Text text={'Finished/Target:'} color="textDim" />
            <Row gap="zero">
              <Text text={successCountRef.current} color="green" style={{ wordWrap: 'break-word' }} />
              <Text text={`/${times}`} color="textDim" style={{ wordWrap: 'break-word' }} />
            </Row>
          </Row>
          {displayedItem != undefined && (
            <Row justifyBetween fullX itemsCenter py="sm">
              <Text text={`${krc20Tick} balance:`} color="textDim" />
              <Text
                text={formatLocaleString(sompiToAmount(Number(displayedItem.balance) ?? 0, displayedItem.dec))}
                color="textDim"
                style={{ wordWrap: 'break-word' }}
              />
            </Row>
          )}
          <Row justifyBetween fullX itemsCenter py="sm">
            <Text text={`${kasTick} balance: `} color="textDim" />
            <Text
              text={`${formatLocaleString(Number(balanceAmount).toFixed(8))} ${kasTick}`}
              color="textDim"
              style={{ wordWrap: 'break-word' }}
            />
          </Row>
          <Row justifyBetween fullX itemsCenter py="sm">
            <Text text={'Address: '} color="textDim" />
            <Text
              text={shortAddress(sourceAddr ? sourceAddr : '')}
              color="textDim"
              style={{ wordWrap: 'break-word' }}
            />
          </Row>
          <Row justifyBetween fullX itemsCenter py="sm">
            <Text text={'Current upper limit tx fee:'} color="textDim" />
            <Text
              text={`${new BigNumber(currentPriorityFee).plus(txFee).decimalPlaces(8).toNumber()} ${kasTick}`}
              color={isNewTxFee ? 'green' : 'textDim'}
              style={{ wordWrap: 'break-word' }}
            />
          </Row>

          <Column mt="md" style={{ borderWidth: '1px', borderColor: colors.grey }}>
            <FeeRateBar
              txFee={txFee}
              defaultIndex={PriorityFeeType.CUSTOM}
              onChange={(val) => {
                setNewPriorityFee(val - txFee > 0 ? Number(new BigNumber(val).minus(txFee).decimalPlaces(8)) : 0);
              }}
            />
            <Row justifyCenter fullX itemsCenter py="md">
              {' '}
              <Text
                mt="md"
                mb="md"
                color="white"
                text={`${t('Upper limit tx fee:')} ${new BigNumber(newPriorityFee)
                  .plus(txFee)
                  .decimalPlaces(8)
                  .toNumber()} ${kasTick}`}
                textCenter
              />{' '}
              {pending == false && (
                <Button disabled={false} text={t('Update')} preset="primary" onClick={handleUpdate} />
              )}
              {pending == true && (
                <Button disabled={true} preset="default">
                  <LoadingOutlined style={{ color: '#AAA' }} />
                </Button>
              )}
            </Row>
          </Column>

          {isComplete == true && error.length == 0 && (
            <Row justifyCenter mt="xl">
              <Icon icon="success" size={50} style={{ alignSelf: 'center' }} />
            </Row>
          )}
          {error.length > 0 && (
            <Row justifyCenter mt="md">
              <Text text={error} color="error" style={{ wordWrap: 'normal' }} selectText />
            </Row>
          )}
          {startCancel && (
            <Row justifyCenter>
              <Icon>
                <LoadingOutlined />
              </Icon>
            </Row>
          )}
        </Column>
      </Content>
      <Footer>
        {isComplete == false && error.length == 0 && (
          <Row justifyCenter>
            <Button
              text={startCancel ? 'Cancelling' : 'Cancel'}
              preset="default"
              onClick={() => {
                handleCancel();
              }}
            />
          </Row>
        )}
        {isComplete == false && error.length > 0 && (
          <Row full>
            <Button
              full
              text={t('Done')}
              onClick={() => {
                navigate('WalletTabScreen');
              }}
            />
          </Row>
        )}
        {isComplete == true && (
          <Row full>
            <Button
              preset="primary"
              text="Mint Again"
              onClick={() => {
                dispatch(
                  uiActions.updateKRC20MintDeployTab({
                    // eslint-disable-next-line no-undef
                    krc20MintDeployTabKey: KRC20MintDeployTabKey.MINT
                  })
                );
                navigate('KRC20MintDeployScreen', { tick: krc20Tick });
              }}
              full
            />
            <Button
              full
              text={t('Done')}
              onClick={() => {
                navigate('WalletTabScreen');
              }}
            />
          </Row>
        )}
      </Footer>
    </Layout>
  );
}

function TokenInfo({
  tick,
  successCount,
  handleCancel
}: {
  tick: string;
  successCount: number;
  handleCancel: () => void;
}) {
  const [tokenInfo, setTokenInfo] = useState<IKRC20TokenInfo | IKRC20TokenInfoIssue>();
  const wallet = useWallet();
  const [infoArray, setInfoArray] = useState<Array<{ name: string; value: string }>>([]);
  const fetchKRC20Info = async () => {
    if (tick) {
      try {
        const tokenInfos = await wallet.getKRC20TokenInfo(tick);
        if (tokenInfos && Array.isArray(tokenInfos) && tokenInfos.length > 0) {
          setTokenInfo(tokenInfos[0]);
        }
      } catch (e) {
        log.debug(e);
      }
    }
  };
  useEffect(() => {
    fetchKRC20Info();
  }, [successCount]);

  useEffect(() => {
    if (tokenInfo) {
      const infoA: { name: string; value: string }[] = [];
      let maxBN = new BigNumber(0);
      let mintedBN = new BigNumber(0);
      let dec = tokenInfo?.dec;
      if (dec == undefined || Number(dec) <= 0) {
        dec = '8';
      }
      if (tokenInfo.max) {
        maxBN = new BigNumber(tokenInfo.max).dividedBy(Math.pow(10, Number(dec)));
      }
      if (tokenInfo.minted) {
        mintedBN = new BigNumber(tokenInfo.minted).dividedBy(Math.pow(10, Number(dec)));
      }
      if (tokenInfo.state) {
        if (tokenInfo.state == 'finished') {
          infoA.push({
            name: 'Token State',
            value: '0 left:please stop minting'
          });
          handleCancel();
        } else if (tokenInfo.state == 'deployed' && maxBN.isGreaterThan(0)) {
          const leftNumber = maxBN.minus(mintedBN);
          infoA.push({
            name: 'Token State',
            value: `${formatLocaleString(leftNumber)} left`
          });
          if (Number(leftNumber) <= 0) handleCancel();
        } else {
          infoA.push({
            name: 'Token State',
            value: tokenInfo.state
          });
        }
      }
      setInfoArray(infoA);
    }
  }, [tokenInfo]);

  return (
    <Column gap="zero" fullX>
      <Row justifyBetween full itemsCenter py="sm">
        <Text text="Tick" preset="sub" />
        <Text text={tick} />
      </Row>

      {infoArray &&
        infoArray.length > 0 &&
        infoArray.map((info, index) => {
          return (
            <Row justifyBetween full itemsCenter py="sm" key={index}>
              <Text text={info.name} preset="sub" />
              <Text text={info.value} color={info?.value?.startsWith('0 left') ? 'error' : 'white'} />
            </Row>
          );
        })}
    </Column>
  );
}
