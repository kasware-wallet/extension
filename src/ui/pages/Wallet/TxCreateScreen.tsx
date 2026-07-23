import { Checkbox, Drawer, Tabs } from 'antd';
import type { CheckboxChangeEvent } from 'antd/es/checkbox';
import type { TabsProps } from 'antd';
import BigNumber from 'bignumber.js';
import log from 'loglevel';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { COIN_DUST, KASPLEX } from '@/shared/constant';
import type { IResultPsbtHex, RawTxInfo } from '@/shared/types';
import { TxType } from '@/shared/types';
import {
  constructKRC20TransferIssueJsonStrLowerCase,
  constructKRC20TransferJsonStrLowerCase,
  truncateToDecimals
} from '@/shared/utils';
import {
  Button,
  Card,
  Column,
  Content,
  Footer,
  Header,
  Input,
  Layout,
  LoadingSpinner,
  Row,
  Text,
  RecentTab,
  ContactsTab,
  MyAccountTab,
  TokenCard
} from '@/ui/components';
import { FeeRateBar } from '@/ui/components/FeeRateBar';
import { KasAmountInput } from '@/ui/components/Input';
import { SubInputAmount } from '@/ui/components/SubInputAmount';
import { useNavigate } from '@/ui/pages/MainRoute';
import { useFetchInscriptionsQuery, useKRC20Price } from '@/ui/state/accounts/hooks';
import { selectAccountBalance, selectAccountInscriptions } from '@/ui/state/accounts/reducer';
import { useRpcStatus } from '@/ui/state/global/hooks';
import { useAppDispatch, useAppSelector } from '@/ui/state/hooks';
import { selectKasTick } from '@/ui/state/settings/reducer';
import { usePrepareSendKASCallback, useSafeBalance } from '@/ui/state/transactions/hooks';
import { selectKaspaTx } from '@/ui/state/transactions/reducer';
import { useAvgFeeRate, useUiTxCreateScreen, useUpdateUiTxCreateScreenCallback } from '@/ui/state/temp-ui/hooks';
import { colors } from '@/ui/theme/colors';
import { fontSizes } from '@/ui/theme/font';
import { formatLocaleString, useLocationState, useWallet, isKRC20Issue } from '@/ui/utils';
import { MINI_AMOUNT_FOR_COMMIT } from '@/ui/utils/constants';
import { useKaspaPrice } from '@/ui/utils/hooks/price/usePrice';
import { amountToSompi, sompiToAmount } from '@/shared/utils/format';
import { tempUiActions } from '@/ui/state/temp-ui/reducer';
import { useAsync } from 'react-use';
import useDebounce from 'ahooks/lib/useDebounce';

interface LocationState {
  rawTxInfo: RawTxInfo;
  tick: string;
  type?: TxType;
}

export default function TxCreateScreen() {
  const { t } = useTranslation();
  const accountBalance = useAppSelector((s) => selectAccountBalance(s, undefined));
  const accountInscriptions = useAppSelector(selectAccountInscriptions);
  const safeBalance = useSafeBalance();
  const navigate = useNavigate();
  const kaspaTx = useAppSelector(selectKaspaTx);
  const [inputAmount, setInputAmount] = useState(kaspaTx.toSompi > 0 ? sompiToAmount(kaspaTx.toSompi, 8) : '');
  const debouncedInputAmount = useDebounce(inputAmount, { wait: 500 });
  const [disabled, setDisabled] = useState(true);
  const setUiState = useUpdateUiTxCreateScreenCallback();
  const uiState = useUiTxCreateScreen();
  const avgFeeRate = useAvgFeeRate();
  const rpcStatus = useRpcStatus();
  const dataFromForward = useLocationState<LocationState>();
  const kasTick = useAppSelector(selectKasTick);
  const [error, setError] = useState('');
  const kasPrice = useKaspaPrice();
  const tick = uiState.tick;
  const decimal = Number(uiState.decimals) ?? 8;
  const priorityFee = uiState.priorityFee;
  const feeRate = uiState.feeRate || avgFeeRate;
  const toInfo = uiState.toInfo;
  const [autoAdjust, setAutoAdjust] = useState(false);
  const [baseTxFee, setBaseTxFee] = useState(0); // base fee at feeRate=1
  const { inputToken, balance } = useMemo(() => {
    if (uiState.type == TxType.SIGN_KRC20_TRANSFER && isKRC20Issue(uiState.tokenType)) {
      const _item = accountInscriptions?.list.find((v) => v.ca == uiState.ca);
      return {
        inputToken: {
          tokenType: uiState.tokenType,
          type: TxType.SIGN_KRC20_TRANSFER,
          tick: _item?.tick || undefined,
          ca: uiState.ca,
          dec: _item?.dec ?? '8',
          // sompi unit
          balance: _item ? _item.balance : '0',
          locked: _item ? _item.locked : '0'
        },
        balance: sompiToAmount(Number(_item?.balance), _item?.dec ?? 8)
      };
    } else if (uiState.type == TxType.SIGN_KRC20_TRANSFER && uiState.tokenType == 'KRC20Mint') {
      const _item = accountInscriptions?.list.find((v) => v.tick == tick);
      return {
        inputToken: {
          tokenType: uiState.tokenType,
          type: TxType.SIGN_KRC20_TRANSFER,
          tick: _item ? _item.tick : 'KAS',
          dec: _item?.dec ?? '8',
          // sompi unit
          balance: _item ? _item.balance : '0',
          locked: _item ? _item.locked : '0'
        },
        balance: sompiToAmount(Number(_item?.balance), _item?.dec ?? 8)
      };
    }
    const tempInputToken = {
      tokenType: 'KAS',
      type: TxType.SEND_KASPA,
      tick: kasTick,
      dec: '8',
      balance: amountToSompi(accountBalance.amount, 8),
      locked: '0'
    };
    return { inputToken: tempInputToken, balance: accountBalance.amount };
  }, [uiState.type, uiState.tokenType, uiState.ca, kasTick, accountBalance.amount, accountInscriptions?.list, tick]);

  const prepareSendKAS = usePrepareSendKASCallback();
  const [isPrepareSendKAS, setIsPrepareSendKAS] = useState(false);

  // const safeSompi = useMemo(() => {
  //   return amountToSompi(safeBalance);
  // }, [safeBalance]);

  const inputSompi = useMemo(() => {
    if (!debouncedInputAmount) return '0';
    return amountToSompi(debouncedInputAmount, inputToken.dec);
  }, [debouncedInputAmount, inputToken.dec]);
  const [inputAmountType, setInputAmountType] = useState<'kas' | 'usd'>('kas');
  const wallet = useWallet();
  const dustAmount = useMemo(() => sompiToAmount(COIN_DUST, 8), []);

  const [rawTxInfo, setRawTxInfo] = useState<RawTxInfo>();
  const [txFee, setTxFee] = useState(0);
  const [txMass, setTxMass] = useState<number>(0);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [feeDrawerVisible, setFeeDrawerVisible] = useState(false);

  const [inscribeJsonString, setInscribeJsonString] = useState('');
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(
      tempUiActions.updateTxCreateScreen({
        feeRate: avgFeeRate
      })
    );
  }, [avgFeeRate, rpcStatus, dispatch]);

  // for send kaspa - merged validation + preparation with race condition protection
  const prepareRequestIdRef = useRef(0);
  useEffect(() => {
    // for send kaspa
    if (uiState.type && uiState.type != TxType.SEND_KASPA) return;
    setError('');
    setDisabled(true);

    if (!wallet.isValidKaspaAddr(toInfo.address)) {
      return;
    }
    if (!debouncedInputAmount || Number(debouncedInputAmount) <= 0) {
      return;
    }
    if (new BigNumber(debouncedInputAmount).minus(sompiToAmount(COIN_DUST, 8)).isLessThan(0)) {
      setError(`Amount must be at least ${dustAmount} ${kasTick}`);
      return;
    }

    if (
      toInfo.address == kaspaTx.toAddress &&
      inputSompi == kaspaTx.toSompi.toString() &&
      priorityFee === kaspaTx.priorityFee &&
      feeRate === kaspaTx.feeRate
    ) {
      //Prevent repeated triggering caused by setAmount
      setDisabled(false);
      return;
    }

    const currentRequestId = ++prepareRequestIdRef.current;
    setIsPrepareSendKAS(true);
    prepareSendKAS({ toAddressInfo: toInfo, toAmount: Number(debouncedInputAmount), priorityFee, feeRate })
      .then((data) => {
        if (currentRequestId !== prepareRequestIdRef.current) return;
        const newTxFee = data?.fee ? data.fee : 0;
        setTxFee(newTxFee);
        setTxMass(data?.mass ? data.mass : 0);
        setRawTxInfo(data);
        // Calculate baseTxFee = txFee / feeRate (base fee at feeRate=1)
        // Only set on initialization
        setBaseTxFee((prev) => {
          if (prev === 0 && newTxFee > 0 && feeRate > 0) {
            return newTxFee / feeRate;
          }
          return prev;
        });
        setDisabled(false);
      })
      .catch((e) => {
        if (currentRequestId !== prepareRequestIdRef.current) return;
        log.debug(e);
        if (e.message && e.message?.includes('Storage mass exceeds maximum')) {
          setTxMass(-1);
          setError(
            'Transaction mass exceeds the network limit. This usually happens with many small UTXOs. Try compounding UTXOs first or sending a larger amount.'
          );
        } else if (e.message && e.message.includes('RuntimeError')) {
          log.debug(e.message);
          setError('Wallet crashed! Please close and reopen your browser to restart KasWare Wallet.');
        } else {
          setError(e.message);
        }
      })
      .finally(() => {
        if (currentRequestId === prepareRequestIdRef.current) {
          setIsPrepareSendKAS(false);
        }
      });
  }, [
    toInfo,
    debouncedInputAmount,
    priorityFee,
    feeRate,
    rpcStatus,
    uiState.type,
    wallet,
    kaspaTx.toAddress,
    kaspaTx.toSompi,
    kaspaTx.priorityFee,
    kaspaTx.feeRate,
    inputSompi,
    prepareSendKAS,
    dustAmount,
    kasTick
  ]);

  // for krc20 transfer
  useAsync(async () => {
    if (!uiState.type) return;
    if (uiState.type && uiState.type != TxType.SIGN_KRC20_TRANSFER) return;
    setError('');
    setDisabled(true);

    if (!(await wallet.isValidKaspaAddr(toInfo.address))) {
      return;
    }
    if (!debouncedInputAmount || Number(debouncedInputAmount) <= 0) {
      return;
    }

    if (new BigNumber(debouncedInputAmount).minus(balance).isGreaterThan(0)) {
      setError('Amount exceeds your available balance');
      return;
    }
    if (Number(accountBalance.amount) < Number(MINI_AMOUNT_FOR_COMMIT)) {
      setError(`You need to have at least ${MINI_AMOUNT_FOR_COMMIT} KAS in balance`);
      return;
    }
    let jsonStr = constructKRC20TransferJsonStrLowerCase(
      tick,
      debouncedInputAmount,
      toInfo.address,
      inputToken.dec ?? '8'
    );
    if (isKRC20Issue(uiState.tokenType))
      jsonStr = constructKRC20TransferIssueJsonStrLowerCase(
        uiState.ca as string,
        debouncedInputAmount,
        toInfo.address,
        inputToken.dec ?? '8'
      );
    setInscribeJsonString(jsonStr);
    const DEFAULT_KRC20_TX_FEE = 0.0002;
    setTxFee(DEFAULT_KRC20_TX_FEE);
    setDisabled(false);
  }, [
    toInfo,
    debouncedInputAmount,
    priorityFee,
    inputToken.dec,
    balance,
    uiState.type,
    uiState.tokenType,
    tick,
    uiState.ca
  ]);
  useFetchInscriptionsQuery();

  const showSafeBalance = useMemo(
    () => !new BigNumber(accountBalance.amount).eq(new BigNumber(safeBalance)),
    [accountBalance.amount, safeBalance]
  );

  const krc20Price = useKRC20Price(isKRC20Issue(uiState.tokenType) ? (uiState.ca as string) : tick);
  const tokenPrice = useMemo(() => {
    if (uiState.type && uiState.type == TxType.SIGN_KRC20_TRANSFER) return krc20Price;
    return kasPrice;
  }, [kasPrice, krc20Price, uiState.type]);
  const inputAmountUsd = useMemo(
    () => truncateToDecimals(Number(debouncedInputAmount) * tokenPrice, decimal).toLocaleString(),
    [debouncedInputAmount, tokenPrice, decimal]
  );
  useEffect(() => {
    if (dataFromForward?.rawTxInfo) {
      const rawtxFromForward = dataFromForward.rawTxInfo.rawtx;
      const result: IResultPsbtHex = JSON.parse(rawtxFromForward);
      // const toAddress = result.to;
      const inputAmount = result.amount?.toString();
      setInputAmount(inputAmount);
    }
  }, [dataFromForward, tokenPrice, decimal]);

  const handleAddrInput = (address: string) => {
    // setToInfo({ address, domain: '' });
    setUiState({ toInfo: { address, domain: '' } });
    setDrawerVisible(false);
    const input = document.getElementById('address-input');
    if (input) {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      nativeInputValueSetter?.call(input, address);
      const inputEvent = new Event('input', { bubbles: true });
      input.dispatchEvent(inputEvent);
    } else {
      log.debug('address input undefine');
    }
  };
  const [RBFChecked, setRBFChecked] = useState(false);
  const onRBFChange = (e: CheckboxChangeEvent) => {
    const val = e.target.checked;
    setRBFChecked(val);
  };
  const tabItems: NonNullable<TabsProps['items']> = [
    {
      key: 'recent',
      label: t('Recent'),
      children: <RecentTab handleAddrInput={handleAddrInput} />
    },
    {
      key: 'contacts',
      label: t('Contacts'),
      children: <ContactsTab handleAddrInput={handleAddrInput} evm={false} />
      // disabled: true,
    },
    {
      key: 'my_account',
      label: t('My account'),
      children: <MyAccountTab handleAddrInput={handleAddrInput} evm={false} />
    }
  ];
  const handleConfirm = useCallback(() => {
    if (uiState.type == TxType.SIGN_KRC20_TRANSFER) {
      navigate('KRC20TxConfirmScreen', {
        inscribeJsonString,
        type: TxType.SIGN_KRC20_TRANSFER,
        tokenType: uiState.tokenType,
        destAddr: toInfo.address,
        feeRate,
        isRBF: RBFChecked,
        protocol: KASPLEX
      });
    } else if (uiState.type == TxType.SEND_KASPA) {
      navigate('TxConfirmScreen', {
        rawTxInfo: rawTxInfo as RawTxInfo,
        type: uiState.type,
        tokenType: uiState.tokenType,
        isRBF: RBFChecked
      });
    } else {
      log.debug('type is not recongnized');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [RBFChecked, inscribeJsonString, feeRate, rawTxInfo, toInfo.address, uiState.tokenType, uiState.type]);

  const onAmountInputChange = useCallback(
    (amount) => {
      if (autoAdjust == true) {
        setAutoAdjust(false);
      }
      if (inputAmountType == 'usd' && tokenPrice > 0) {
        const truncatedAmt = truncateToDecimals(Number(amount) / tokenPrice, decimal);
        setInputAmount(truncatedAmt);
      } else {
        setInputAmount(truncateToDecimals(amount, decimal));
      }
    },
    [autoAdjust, decimal, inputAmountType, tokenPrice]
  );
  const handleAddressInputChange = useCallback(
    (val) => {
      dispatch(tempUiActions.updateTxCreateScreen({ toInfo: val }));
    },
    [dispatch]
  );

  return (
    <Layout>
      <Header
        onBack={() => {
          navigate('WalletTabScreen');
        }}
        title={`${t('Send')} ${inputToken?.tick ? inputToken.tick : kasTick}`}
      />
      <Content style={{ padding: '0px 16px 24px' }}>
        <Row fullX justifyBetween selfItemsCenter style={{ gap: 2 }} mb="lg">
          <TokenCard inputToken={inputToken} tokenType={uiState.tokenType} />
        </Row>
        <Text text={t('Recipient')} preset="regular" color="textDim" />
        <Row justifyBetween style={{ gap: 2 }}>
          <Column full>
            <Input
              id="address-input"
              preset="address"
              defaultValue={toInfo.address}
              addressInputData={toInfo}
              onAddressInputChange={handleAddressInputChange}
              showContactClick={() => {
                setDrawerVisible(true);
              }}
              autoFocus={true}
            />
          </Column>
          {/* <Button
            style={{
              height: '56px'
            }}
            onClick={() => {
              setDrawerVisible(true);
            }}>
            <Icon icon={'user'} />
          </Button> */}
        </Row>
        <Column mt="lg">
          <Row justifyBetween>
            <Row itemsCenter>
              <Text text={t('Transfer Amount')} color="textDim" my="zero" />
            </Row>
            {showSafeBalance ? (
              // <Text text={`${accountBalance.amount} ${tick}`} preset="bold" size="sm" />
              <Text text={`${balance} ${tick}`} preset="bold" size="sm" />
            ) : (
              <Row
                itemsCenter
                onClick={() => {
                  setAutoAdjust(true);
                  setInputAmount(balance);
                }}
              >
                <Card classname="card-select" preset="style2">
                  <Text
                    text="MAX"
                    preset="sub"
                    style={{ color: autoAdjust ? colors.yellow_light : colors.white_muted }}
                  />
                </Card>
                <Text text={`${formatLocaleString(balance)} ${tick}`} preset="bold" size="sm" />
              </Row>
            )}
          </Row>
          {/* {type == TxType.SEND_KASPA && (
            <Row justifyBetween>
              <Text text={`${t('Unconfirmed')}KAS`} color="textDim" />
              <Text text={`${accountBalance.pending_kas_amount} KAS`} size="sm" preset="bold" color="textDim" />
            </Row>
          )}
          {showSafeBalance && type == TxType.SEND_KASPA && (
            <Row justifyBetween>
              <Text text={`${t('Available')}(${t('safe to send')})`} color="textDim" />

              <Row
                onClick={() => {
                  setAutoAdjust(true);
                  setInputAmount(safeBalance.toString());
                }}>
                <Text text={'MAX'} color={autoAdjust ? 'yellow' : 'textDim'} size="sm" />
                <Text text={`${safeBalance} KAS`} preset="bold" size="sm" />
              </Row>
            </Row>
          )}
            */}
          <Row justifyBetween mt="sm">
            <Column full>
              <KasAmountInput
                style={{
                  height: '36.5px'
                }}
                preset="amount"
                inputAmountType={inputAmountType}
                tokenTick={tick}
                decimalPlaces={decimal}
                placeholder={t('Amount')}
                // defaultValue={inputAmount}
                value={inputAmountType == 'kas' ? inputAmount : inputAmountUsd}
                onAmountInputChange={onAmountInputChange}
              />
            </Column>
          </Row>
          <Row justifyBetween>
            <SubInputAmount
              inputAmountType={inputAmountType}
              setInputAmountType={setInputAmountType}
              inputAmountUsd={inputAmountUsd}
              tokenPrice={tokenPrice}
              tokenTick={tick}
              inputAmount={inputAmount}
            />
            {txMass !== 0 && (
              <Text
                preset="sub"
                text={`Mass: ${txMass === -1 ? '> 100,000' : formatLocaleString(txMass)} / 100,000`}
                color={txMass > 80000 ? 'warning' : txMass === -1 ? 'error' : 'textDim'}
                textCenter
                size="xs"
              />
            )}
          </Row>
        </Column>

        <Row>
          <Checkbox onChange={onRBFChange} checked={RBFChecked} style={{ fontSize: fontSizes.sm }}>
            <Text text={`${t('Replace by fee(RBF)')}`} preset="xsub" color="textDim" />
          </Checkbox>
        </Row>
        {error && <Text text={error} color="error" selectText />}
      </Content>
      <Drawer
        placement={'bottom'}
        closable={false}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        key={'bottom'}
      >
        <Tabs
          size={'small'}
          defaultActiveKey="0"
          // activeKey={assetTabKey as unknown as string}
          items={tabItems}
          onTabClick={() => {
            // log.debug(key);
          }}
        />
      </Drawer>
      <Drawer
        placement={'bottom'}
        closable={false}
        onClose={() => setFeeDrawerVisible(false)}
        open={feeDrawerVisible}
        key="fee-drawer"
        style={{
          body: {
            padding: '20px 24px 24px',
            background: colors.card,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 360
          }
        }}
      >
        <Text text={`${t('Customize TX Fee')} ( ${t('Optional')} )`} color="textDim" preset="sub" />
        <div style={{ flex: 1, overflow: 'auto' }}>
          <FeeRateBar
            txFee={txFee}
            baseTxFee={baseTxFee}
            onChange={(feeRate) => {
              // FeeRateBar returns feeRate (>= lowFeeRate)
              // Transaction Fee = feeRate * baseTxFee
              if (Math.abs(feeRate - uiState.feeRate) > 0.00000001) {
                setUiState({ feeRate });
              }
            }}
          />
        </div>
        <Row
          mt="xl"
          style={{
            padding: '14px 20px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: 12,
            justifyContent: 'space-between',
            flexShrink: 0
          }}
        >
          <Text color="textDim" text={t('Transaction fee')} preset="sub" />
          <Row style={{ alignItems: 'center', gap: 4 }}>
            <Text
              color="white"
              text={formatLocaleString(
                new BigNumber(baseTxFee > 0 ? baseTxFee : txFee).multipliedBy(feeRate).decimalPlaces(8)
              )}
              preset="sub"
            />
            <Text color="textDim" text={kasTick} preset="sub" />
          </Row>
        </Row>
        <Button
          disabled={disabled}
          preset="primary"
          text={t('Close')}
          onClick={() => setFeeDrawerVisible(false)}
          style={{ marginTop: '8px' }}
        />
      </Drawer>
      <Footer>
        <Column
          justifyCenter
          mb="md"
          onClick={() => {
            setFeeDrawerVisible(true);
          }}
        >
          {baseTxFee > 0 && (
            <Text
              preset="link"
              text={`${t('Transaction Fee:')} ${formatLocaleString(
                new BigNumber(baseTxFee).multipliedBy(feeRate).decimalPlaces(8)
              )} ${kasTick}`}
              textCenter
            />
          )}
        </Column>
        <Button
          disabled={disabled}
          preset="primary"
          text={isPrepareSendKAS ? undefined : t('Next')}
          onClick={handleConfirm}
        >
          {isPrepareSendKAS ? <LoadingSpinner size="medium" /> : undefined}
        </Button>
      </Footer>
    </Layout>
  );
}
