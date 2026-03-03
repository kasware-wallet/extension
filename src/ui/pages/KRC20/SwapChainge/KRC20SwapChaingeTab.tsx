import Drawer from 'antd/lib/drawer';
import BigNumber from 'bignumber.js';
import log from 'loglevel';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate as useNavigateReact } from 'react-router-dom';

import { MINIMUM_KAS_BALANCE } from '@/shared/constant';
import type { IChaingeToken } from '@/shared/types';
import { Button, Column, Footer, Row, Text } from '@/ui/components';
import ErrorMessage from '@/ui/components/messages/ErrorMessage';
import { useTools } from '@/ui/components/ActionComponent';
import { FeeRateBar } from '@/ui/components/FeeRateBar';
import SwitchTokensButton from '@/ui/components/SwitchTokensButton';
import { useAccountAddress, useFetchInscriptionsCallback } from '@/ui/state/accounts/hooks';
import { accountsActions, selectAccountBalance } from '@/ui/state/accounts/reducer';
import { useRpcStatus } from '@/ui/state/global/hooks';
import { useAppDispatch, useAppSelector } from '@/ui/state/hooks';
import { selectKasTick, selectNetworkId } from '@/ui/state/settings/reducer';
import useAggregateQuote from '@/ui/state/transactions/chainge/useAggregateQuote';
import { useChaingeTokens } from '@/ui/state/transactions/chainge/useChaingeTokens';
import { useEstimateChaingeTransactionFeesCallback, useFetchDecimalCallback } from '@/ui/state/transactions/hooks';
import { useAvgFeeRate, useFetchFeeRateOptionCallback } from '@/ui/state/ui/hooks';
import { formatLocaleString, formatPercentage, useWallet } from '@/ui/utils';
import ErrorMessages from '@/ui/utils2/constants/errorMessages';
import { useWalletTokens } from '@/ui/utils/hooks/wallet/useWalletTokens';

import ReviewOrder from './ReviewOrder';
import ReviewOrderButton from './ReviewOrderButton';
import SwapLoading from './SwapLoading';
import SwapTokenSelect from './SwapTokenSelect';
import YouPaySection from './YouPaySection';
import YouReceiveSection from './YouReceiveSection';
import useDebounce from 'ahooks/lib/useDebounce';

/**
 * slippage - e.g., 1 means 1%
 */
export default function KRC20SwapChaingeTab({ slippage, locationToken }: { slippage: number; locationToken: any }) {
  const wallet = useWallet();

  const { tokens, walletError } = useWalletTokens();
  const rpcStatus = useRpcStatus();
  const accountBalance = useAppSelector((s) => selectAccountBalance(s, undefined));

  const avgFeeRate = useAvgFeeRate();
  const fetchFeeRateOption = useFetchFeeRateOptionCallback();
  // const fetchPrice = useFetchKasPriceCallback();
  const fetchDecimal = useFetchDecimalCallback();

  const [payAmount, setPayAmount] = useState('');
  const [amountError, setAmountError] = useState<string | null>(null);
  const [payToken, setPayToken] = useState<IChaingeToken | null>(null);
  const [receiveToken, setReceiveToken] = useState<IChaingeToken | null>(null);

  const [gasFee, setGasFee] = useState<string>('');
  const [gasFeeError, setGasFeeError] = useState<string | null>(null);
  const [isReviewOrderOpen, setIsReviewOrderOpen] = useState(false);
  const [isPayTokenSelectOpen, setIsPayTokenSelectOpen] = useState(false);
  const [isReceiveTokenSelectOpen, setIsReceiveTokenSelectOpen] = useState(false);
  const [feeDrawerVisible, setFeeDrawerVisible] = useState(false);
  const [baseTxFee, setBaseTxFee] = useState(0.0002);
  const debouncedPayAmount = useDebounce<string>(payAmount, { wait: 500 });
  const [priorityFee, setPriorityFee] = useState(0);
  const [exchangeRate, setExchangeRate] = useState<number>(0);
  const kasTick = useAppSelector(selectKasTick);

  const { t } = useTranslation();
  const currentAddress = useAccountAddress();
  const fetchInscription = useFetchInscriptionsCallback();
  const dispatch = useAppDispatch();
  const networkId = useAppSelector(selectNetworkId);

  const estimateChaingeTransactionFee = useEstimateChaingeTransactionFeesCallback();

  const { data: chaingeTokens, isLoading, isError, error: queryError } = useChaingeTokens();
  const { aggregateQuote, receiveAmount, setReceiveAmount, loadingQuote, quoteError } = useAggregateQuote(
    payToken,
    receiveToken,
    payAmount
  );
  const navigateReact = useNavigateReact();

  useEffect(() => {
    setGasFee(new BigNumber(baseTxFee).plus(priorityFee).toString());
  }, [baseTxFee, priorityFee]);
  useEffect(() => {
    if (payAmount && receiveAmount && Number(receiveAmount) > 0 && Number(payAmount) > 0) {
      const rate = new BigNumber(receiveAmount).dividedBy(payAmount).toFixed(8);
      setExchangeRate(Number(rate));
    }
  }, [payAmount, receiveAmount]);
  // useEffect(() => {
  //   fetchPrice();
  // }, []);
  useEffect(() => {
    fetchInscription().catch((e) => {
      log.debug(e?.message);
      dispatch(
        accountsActions.setInscriptions({
          address: currentAddress,
          list: []
        })
      );
    });
  }, [networkId, currentAddress]);

  useEffect(() => {
    fetchFeeRateOption();
  }, []);

  const fetchEstimatedFee = () => {
    if (!payToken || !payAmount || Number(payAmount) <= 0) return;
    if (Number(accountBalance.amount) < MINIMUM_KAS_BALANCE) {
      setGasFeeError(ErrorMessages.NETWORK.INSUFFICIENT_BALANCE);
      return;
    }

    try {
      estimateChaingeTransactionFee({
        fromAmount:
          payToken.ticker !== 'KAS'
            ? Math.round(Number(payAmount) * Math.pow(10, payToken.decimals || 8)).toString()
            : payAmount,
        fromToken: payToken
      })
        .then((estimatedFee) => {
          setBaseTxFee(Number(estimatedFee));
          if (avgFeeRate > 1) {
            const priorityFee = new BigNumber(estimatedFee).multipliedBy(avgFeeRate).minus(estimatedFee).toNumber();
            setPriorityFee(priorityFee);
          }
          setGasFeeError('');
        })
        .catch((e) => {
          if (e instanceof Error) {
            if (e.message === 'Storage mass exceeds maximum') {
              setGasFeeError(ErrorMessages.FEES.STORAGE_MASS(payAmount));
            } else {
              setGasFeeError(e.message);
            }
          } else {
            setGasFeeError(JSON.stringify(e));
          }
        });
    } catch (err) {
      console.error('Error in scaling payAmount:', err);
      setGasFeeError('Invalid amount provided');
    }
  };
  const tools = useTools();
  useEffect(() => {
    fetchEstimatedFee();
  }, [payToken, debouncedPayAmount, accountBalance.amount]);

  useEffect(() => {
    const setTokens = async () => {
      if (chaingeTokens) {
        const defaultPayToken = chaingeTokens.find((token) =>
          locationToken ? token.ticker === locationToken.tick : token.ticker === 'NACHO'
        );
        const defaultReceiveToken = chaingeTokens.find((token) => token.ticker === 'KAS');
        const initialPayToken = defaultPayToken || chaingeTokens[0];
        const payTicker = defaultPayToken?.ticker || chaingeTokens[0].ticker;
        const dec = await fetchDecimal(payTicker?.toLowerCase()).catch((e) => {
          console.error(e);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tools.toastError((e as any).message);
        });
        const payTokenDec = dec || 8;

        setPayToken({ ...initialPayToken, decimals: payTokenDec });
        const initialReceiveToken = defaultReceiveToken || chaingeTokens[1];
        const rDec = await fetchDecimal(initialReceiveToken.ticker.toLowerCase()).catch((e) => {
          console.error(e);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tools.toastError((e as any).message);
        });
        const receiveTokenDec = rDec || 8;

        setReceiveToken({ ...initialReceiveToken, decimals: receiveTokenDec });
      }
    };

    setTokens();
  }, [chaingeTokens, locationToken, isError, queryError, wallet, tools]);

  const handlePayAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPayAmount(e.target.value);
  };

  const handleAmountErrorChange = (error: string | null) => {
    setAmountError(error);
  };

  const handleSwitch = () => {
    setPayAmount('');
    setReceiveAmount('');
    setPayToken(receiveToken);
    setReceiveToken(payToken);
  };

  const openPayTokenSelect = () => setIsPayTokenSelectOpen(true);
  const openReceiveTokenSelect = () => setIsReceiveTokenSelectOpen(true);
  const closePayTokenSelect = () => setIsPayTokenSelectOpen(false);
  const closeReceiveTokenSelect = () => setIsReceiveTokenSelectOpen(false);

  const selectToken = (token: IChaingeToken) => {
    setPayToken(token);
    closePayTokenSelect();
  };

  const selectReceiveToken = (token: IChaingeToken) => {
    setReceiveToken(token);
    closeReceiveTokenSelect();
  };

  return (
    <>
      <Column>
        <div className="flex flex-col h-full justify-between">
          <div>
            {isLoading || !rpcStatus ? (
              <SwapLoading />
            ) : (
              <>
                <YouPaySection
                  payAmount={payAmount}
                  payToken={payToken}
                  openTokenSelect={openPayTokenSelect}
                  onAmountChange={handlePayAmountChange}
                  onAmountErrorChange={handleAmountErrorChange}
                  tokens={tokens}
                />
                <SwitchTokensButton onSwitch={handleSwitch} />
                <YouReceiveSection
                  receiveAmount={receiveAmount}
                  receiveToken={receiveToken}
                  payAmount={payAmount}
                  openTokenSelect={openReceiveTokenSelect}
                  aggregateQuote={aggregateQuote}
                  loadingQuote={loadingQuote}
                />
                <Row justifyBetween>
                  <Text
                    mt="md"
                    text="Recent swap history"
                    preset="link"
                    onClick={() => {
                      navigateReact('/krc20/swap/history');
                    }}
                    selectText
                  />
                  <Text mt="md" mb="sm" text={'Powered by knot.meme'} preset="xsub" color="textDim" selectText />
                </Row>
                {exchangeRate > 0 && (
                  <Text
                    mt="md"
                    text={`1 ${payToken?.ticker} = ${formatLocaleString(exchangeRate)} ${receiveToken?.ticker}`}
                    preset="sub"
                    color="textDim"
                    selectText
                  />
                )}
                {aggregateQuote !== undefined && (
                  <Row>
                    <Text mt="md" text="Price impact: " preset="sub" color="textDim" selectText />
                    <Text
                      mt="md"
                      text={formatPercentage(aggregateQuote.priceImpact)}
                      preset="sub"
                      color={`${parseFloat(aggregateQuote.priceImpact) <= 10 ? 'textDim' : 'warning'}`}
                      selectText
                    />
                  </Row>
                )}
                <Text mt="md" text={'Service fee: 3%'} preset="sub" color="textDim" selectText />
                {Number(gasFee) > 0 && (
                  <Row justifyBetween mb="md">
                    <Row
                      onClick={() => {
                        setFeeDrawerVisible(true);
                      }}
                    >
                      <Text
                        mt="md"
                        preset="link"
                        text={`${t('Transaction fee:')} ${formatLocaleString(gasFee)} ${kasTick}`}
                        textCenter
                      />
                    </Row>
                  </Row>
                )}
                {(quoteError || queryError || gasFeeError || walletError) && (
                  <Row py="md" justifyCenter itemsCenter>
                    <ErrorMessage message={quoteError || queryError?.message || gasFeeError || walletError || ''} />
                  </Row>
                )}
                {}
              </>
            )}
          </div>
        </div>
        <Drawer
          placement={'bottom'}
          closable={false}
          onClose={closePayTokenSelect}
          open={isPayTokenSelectOpen}
          key={'isPayTokenSelectOpen'}
        >
          <SwapTokenSelect tokens={chaingeTokens} onSelectToken={selectToken} />
        </Drawer>

        <Drawer
          placement={'bottom'}
          closable={false}
          onClose={closeReceiveTokenSelect}
          open={isReceiveTokenSelectOpen}
          key={'isReceiveTokenSelectOpen'}
        >
          <SwapTokenSelect tokens={chaingeTokens} onSelectToken={selectReceiveToken} />
        </Drawer>
        <Drawer
          placement={'bottom'}
          closable={false}
          onClose={() => setIsReviewOrderOpen(false)}
          open={isReviewOrderOpen}
          key={'isReviewOrderOpen'}
        >
          {isReviewOrderOpen && payToken && receiveToken && aggregateQuote && (
            <ReviewOrder
              payToken={payToken}
              receiveToken={receiveToken}
              payAmount={payAmount}
              slippage={slippage.toString()}
              priorityFee={priorityFee}
              gasFee={gasFee}
              aggregateQuote={aggregateQuote}
              onClose={() => setIsReviewOrderOpen(false)}
            />
          )}
        </Drawer>
        {/* <Drawer
            placement={'bottom'}
            closable={false}
            onClose={() => setIsSlippageOpen(false)}
            open={isSlippageOpen}
            key={'isSlippageOpen'}>
            
              {isSlippageOpen && (
                <SlippageSettings
                  onClose={() => setIsSlippageOpen(false)}
                  onSelectSlippage={setSlippage}
                  slippage={slippage}
                />
              )}
            
          </Drawer> */}
        <Drawer
          placement={'bottom'}
          closable={false}
          onClose={() => setFeeDrawerVisible(false)}
          open={feeDrawerVisible}
          key={'fee-drawer'}
        >
          <Column mt="lg">
            <Text text={`${t('Customize TX Fee')} ( ${t('Optional')} )`} color="textDim" preset="sub" selectText />
            <FeeRateBar
              txFee={baseTxFee}
              onChange={(val) => {
                setPriorityFee(val - baseTxFee > 0 ? Number(new BigNumber(val).minus(baseTxFee).decimalPlaces(8)) : 0);
              }}
            />
            <Text
              mt="xxl"
              preset="sub"
              text={`${t('Transaction fee:')} ${formatLocaleString(
                new BigNumber(priorityFee).plus(baseTxFee).decimalPlaces(8)
              )} ${kasTick}`}
              textCenter
              selectText
            />
            <Row mt="xxl" full></Row>
            <Button preset="primary" text={t('Close')} onClick={() => setFeeDrawerVisible(false)}></Button>
          </Column>
        </Drawer>
      </Column>
      <Footer px="zero">
        <ReviewOrderButton
          amountError={amountError}
          gasFeeError={gasFeeError}
          amountOutUsd={aggregateQuote?.amountOutUsd || 'loading'}
          payAmount={payAmount}
          loadingQuote={loadingQuote}
          payToken={payToken}
          receiveToken={receiveToken}
          setIsReviewOrderOpen={() => setIsReviewOrderOpen(true)}
        />
      </Footer>
    </>
  );
}
