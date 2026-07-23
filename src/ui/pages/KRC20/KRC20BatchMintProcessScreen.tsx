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
import { useFetchInscriptionsCallback } from '@/ui/state/accounts/hooks';
import { selectAccountInscriptions, selectCurrentKaspaAddress } from '@/ui/state/accounts/reducer';
import { useAppDispatch, useAppSelector } from '@/ui/state/hooks';
import { selectKasTick, selectNetworkId } from '@/ui/state/settings/reducer';
import { transactionsActions } from '@/ui/state/transactions/reducer';
import { KRC20MintDeployTabKey, tempUiActions } from '@/ui/state/temp-ui/reducer';
import { formatLocaleString, shortAddress, useWallet } from '@/ui/utils';
import { LoadingSpinner } from '@/ui/components';
import { useNavigate } from '../MainRoute';
import { sompiToAmount } from '@/shared/utils/format';

export default function KRC20BatchMintProcessScreen() {
  const wallet = useWallet();
  const kasTick = useAppSelector(selectKasTick);
  const [searchParams] = useSearchParams();
  const inscribeJsonString = searchParams.get('inscribeJsonString');
  const times = searchParams.get('times') ? Number(searchParams.get('times')) : 0;
  const networkId = searchParams.get('networkId');
  const sourceAddr = searchParams.get('sourceAddr');
  const { t } = useTranslation();
  const tools = useTools();
  const currentAddress = useAppSelector(selectCurrentKaspaAddress);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [error, setError] = useState<string>('');
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [balanceAmount, setBalanceAmount] = useState<string>('');
  const [startCancel, setStartCancel] = useState(false);
  const currentNetworkId = useAppSelector(selectNetworkId);
  const handleCancel = async () => {
    setStartCancel(true);
    await wallet.setBatchMintStatus(false);
    setIsComplete(true);
    setStartCancel(false);
    let arr: string[] = [];
    if (networkId) {
      arr = [].flatMap((arr2) => arr2 || []);
    }
    wallet.onSearchAndRetrieve(arr);
  };

  const krc20Tick = useMemo(() => {
    if (inscribeJsonString) {
      try {
        const json: KasplexData<'mint'> = JSON.parse(inscribeJsonString);
        const tick = json?.tick;
        return tick;
      } catch (e) {
        log.debug('Failed to parse inscribeJsonString:', e);
        return '';
      }
    }
    return '';
  }, [inscribeJsonString]);

  // Single-stage payload mint mode - no commit/reveal split
  useEffect(() => {
    const handleProcess = async () => {
      if (currentNetworkId !== networkId) {
        handleCancel().then(() => {
          tools.toastError('network type changed');
          setError('network type changed');
        });
      } else {
        try {
          if (inscribeJsonString) {
            wallet.signKRC20BatchMintPayload(inscribeJsonString, times);
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
    handleProcess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    wallet.getPendingTxDatas(currentAddress).then((res) => {
      dispatch(transactionsActions.setPendingList(res));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [signPercent, setSignPercent] = useState<{ percent: number; msg: string }>({ percent: 0, msg: '' });
  const successCountRef = useRef(0);
  const failedCountRef = useRef(0);
  const fetchInscription = useFetchInscriptionsCallback();
  const accountInscriptions = useAppSelector(selectAccountInscriptions);
  const displayedItem = useMemo(() => {
    const tempItems = accountInscriptions?.list;
    return tempItems.find((item) => item.tick === krc20Tick);
  }, [accountInscriptions?.list, krc20Tick]);

  const handleBatchMintProcess = (e: string) => {
    try {
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
    } catch (err) {
      log.debug('Failed to parse batch mint process event:', err);
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
    try {
      const res: { percent: number; msg: string } = JSON.parse(e);
      setSignPercent(res);
    } catch (err) {
      log.debug('Failed to parse sign KRC20 process event:', err);
    }
  };
  const fetchBalance = async (sourceAddr: string) => {
    const balance = await wallet.getAddressBalance(sourceAddr);
    setBalanceAmount(balance.amount);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    eventBus.addEventListener('batchmintkrc20process', handleBatchMintProcess);
    return () => {
      eventBus.removeEventListener('batchmintkrc20process', handleBatchMintProcess);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
              <LoadingSpinner size="medium" />
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
                  tempUiActions.updateKRC20MintDeployTab({
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

  useEffect(() => {
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
    fetchKRC20Info();
  }, [successCount, tick, wallet]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
