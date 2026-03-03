/* eslint-disable @typescript-eslint/no-explicit-any */
import { Checkbox, Drawer, Tabs } from 'antd';
import type { CheckboxChangeEvent } from 'antd/es/checkbox';
import BigNumber from 'bignumber.js';
import log from 'loglevel';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { ContactBookItem } from '@/shared/types/contact-book';
import { COIN_DUST, KASPLEX } from '@/shared/constant';
import type { IResultPsbtHex, RawTxInfo, TTokenType } from '@/shared/types';
import { NetworkType, TxType } from '@/shared/types';
import {
  constructKRC20TransferIssueJsonStrLowerCase,
  constructKRC20TransferJsonStrLowerCase,
  truncateToDecimals
} from '@/shared/utils';
import { Button, Card, Column, Content, Footer, Header, Input, Layout, Row, Text } from '@/ui/components';
import { ProfileImage } from '@/ui/components/CryptoImage';
import { Empty } from '@/ui/components/Empty';
import { FeeRateBar } from '@/ui/components/FeeRateBar';
import { KasAmountInput } from '@/ui/components/Input';
import { SubInputAmount } from '@/ui/components/SubInputAmount';
import { useNavigate } from '@/ui/pages/MainRoute';
import {
  useAccountAddress,
  useCurrentAccount,
  useFetchInscriptionsQuery,
  useKRC20Price
} from '@/ui/state/accounts/hooks';
import { selectAccountBalance, selectAccountInscriptions } from '@/ui/state/accounts/reducer';
import { useRpcStatus } from '@/ui/state/global/hooks';
import { useAppDispatch, useAppSelector } from '@/ui/state/hooks';
import { useKeyrings } from '@/ui/state/keyrings/hooks';
import { selectKasTick, selectNetworkId } from '@/ui/state/settings/reducer';
import { usePrepareSendKASCallback, useSafeBalance } from '@/ui/state/transactions/hooks';
import { selectKaspaTx } from '@/ui/state/transactions/reducer';
import { useAvgFeeRate, useUiTxCreateScreen, useUpdateUiTxCreateScreen } from '@/ui/state/ui/hooks';
import { colors } from '@/ui/theme/colors';
import { fontSizes } from '@/ui/theme/font';
import {
  copyToClipboard,
  formatLocaleString,
  isValidKaspaAddress,
  shortAddress,
  useLocationState,
  useWallet
} from '@/ui/utils';
import { MINI_AMOUNT_FOR_COMMIT } from '@/ui/utils2/constants/constants';
import { useKaspaPrice } from '@/ui/utils/hooks/price/usePrice';
import { LoadingOutlined, RightOutlined } from '@ant-design/icons';
import { isValidAddress } from '@ethereumjs/util';
import { amountToSompi, sompiToAmount } from '@/shared/utils/format';
import { uiActions } from '@/ui/state/ui/reducer';
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
  const [inputAmountUsd, setInputAmountUsd] = useState('0');
  const [disabled, setDisabled] = useState(true);
  const setUiState = useUpdateUiTxCreateScreen();
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
  const toInfo = uiState.toInfo;
  const [autoAdjust, setAutoAdjust] = useState(false);
  const { inputToken, balance } = useMemo(() => {
    if (uiState.type == TxType.SIGN_KRC20_TRANSFER && uiState.tokenType == 'KRC20Issue') {
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

  const toSompi = useMemo(() => {
    if (!inputAmount) return '0';
    return amountToSompi(inputAmount, inputToken.dec);
  }, [inputAmount, inputToken.dec]);
  const [inputAmountType, setInputAmountType] = useState<'kas' | 'usd'>('kas');
  const wallet = useWallet();
  const dustAmount = useMemo(() => sompiToAmount(COIN_DUST, 8), []);

  const [rawTxInfo, setRawTxInfo] = useState<RawTxInfo>();
  const [txFee, setTxFee] = useState(0);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [feeDrawerVisible, setFeeDrawerVisible] = useState(false);

  const [inscribeJsonString, setInscribeJsonString] = useState('');
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(
      uiActions.updateTxCreateScreen({
        feeRate: avgFeeRate,
        priorityFee: avgFeeRate > 1 ? Number(new BigNumber(txFee).multipliedBy(avgFeeRate - 1).decimalPlaces(8)) : 0
      })
    );
  }, [avgFeeRate, txFee, rpcStatus, dispatch]);

  useAsync(async () => {
    // for send kaspa
    if (uiState.type && uiState.type != TxType.SEND_KASPA) return;
    setError('');
    setDisabled(true);

    if (!(await wallet.isValidKaspaAddr(toInfo.address))) {
      return;
    }
    if (!toSompi || Number(toSompi) <= 0) {
      return;
    }
    if (new BigNumber(toSompi).minus(COIN_DUST).isLessThan(0)) {
      setError(`Amount must be at least ${dustAmount} ${kasTick}`);
      return;
    }

    // if (toSatoshis > safeSatoshis) {
    //   setError('Amount exceeds your available balance');
    //   return;
    // }

    if (
      toInfo.address == kaspaTx.toAddress &&
      toSompi == kaspaTx.toSompi.toString() &&
      priorityFee == kaspaTx.priorityFee
    ) {
      //Prevent repeated triggering caused by setAmount
      setDisabled(false);
      return;
    }
    setIsPrepareSendKAS(true);
  }, [toInfo, debouncedInputAmount, priorityFee]);

  useEffect(() => {
    if (isPrepareSendKAS)
      prepareSendKAS({ toAddressInfo: toInfo, toAmount: Number(sompiToAmount(toSompi, 8)), priorityFee })
        .then((data) => {
          // if (data.fee < data.estimateFee) {
          //   setError(`Network fee must be at leat ${data.estimateFee}`);
          //   return;
          // }
          setTxFee(data?.fee ? data.fee : 0);
          setRawTxInfo(data);
          setDisabled(false);
        })
        .catch((e) => {
          log.debug(e);
          if (e.message && e.message === 'Storage mass exceeds maximum') {
            if (Number(balance) - Number(inputAmount) > Number(sompiToAmount(COIN_DUST, 8))) {
              setError('Input amount is too small: try to compound UTXOs first.');
            } else {
              setError('Input amount is too small');
            }
          } else if (e.message && e.message.includes('RuntimeError')) {
            log.debug(e.message);
            setError('Wallet crashed! Please close and reopen your browser to restart KasWare Wallet.');
          } else {
            setError(e.message);
          }
        })
        .finally(() => {
          setIsPrepareSendKAS(false);
        });
  }, [isPrepareSendKAS, toInfo, debouncedInputAmount, priorityFee, rpcStatus]);

  // for krc20 transfer
  useAsync(async () => {
    if (!uiState.type) return;
    if (uiState.type && uiState.type != TxType.SIGN_KRC20_TRANSFER) return;
    setError('');
    setDisabled(true);

    if (!(await wallet.isValidKaspaAddr(toInfo.address))) {
      return;
    }
    if (!toSompi || Number(toSompi) <= 0) {
      return;
    }
    // if (toSompi > safeSompi) {
    if (new BigNumber(toSompi).minus(amountToSompi(balance, inputToken.dec)).isGreaterThan(0)) {
      setError('Amount exceeds your available balance');
      return;
    }
    if (Number(accountBalance.amount) < Number(MINI_AMOUNT_FOR_COMMIT)) {
      setError(`You need to have at least ${MINI_AMOUNT_FOR_COMMIT} KAS in balance`);
      return;
    }
    let jsonStr = constructKRC20TransferJsonStrLowerCase(tick, inputAmount, toInfo.address, inputToken.dec ?? '8');
    if (uiState.tokenType == 'KRC20Issue')
      jsonStr = constructKRC20TransferIssueJsonStrLowerCase(
        uiState.ca as string,
        inputAmount,
        toInfo.address,
        inputToken.dec ?? '8'
      );
    setInscribeJsonString(jsonStr);
    setTxFee(0.0002);
    setDisabled(false);
  }, [toInfo, inputAmount, priorityFee, inputToken.dec, balance, uiState.type, uiState.tokenType, tick, uiState.ca]);
  useFetchInscriptionsQuery();

  const showSafeBalance = useMemo(
    () => !new BigNumber(accountBalance.amount).eq(new BigNumber(safeBalance)),
    [accountBalance.amount, safeBalance]
  );

  const krc20Price = useKRC20Price(uiState.tokenType == 'KRC20Issue' ? (uiState.ca as string) : tick);
  const tokenPrice = useMemo(() => {
    if (uiState.type && uiState.type == TxType.SIGN_KRC20_TRANSFER) return krc20Price;
    return kasPrice;
  }, [kasPrice, krc20Price, uiState.type]);
  useEffect(() => {
    if (dataFromForward?.rawTxInfo) {
      const rawtxFromForward = dataFromForward.rawTxInfo.rawtx;
      const result: IResultPsbtHex = JSON.parse(rawtxFromForward);
      // const toAddress = result.to;
      const inputAmount = result.amount?.toString();
      setInputAmount(inputAmount);
      setInputAmountUsd((Number(inputAmount) * Number(tokenPrice)).toLocaleString());
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
  const tabItems = [
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
  const handleConfirm = () => {
    if (uiState.type == TxType.SIGN_KRC20_TRANSFER) {
      navigate('KRC20TxConfirmScreen', {
        inscribeJsonString,
        type: TxType.SIGN_KRC20_TRANSFER,
        tokenType: uiState.tokenType,
        destAddr: toInfo.address,
        priorityFee: priorityFee,
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
  };

  const onAmountInputChange = (amount) => {
    if (autoAdjust == true) {
      setAutoAdjust(false);
    }
    if (inputAmountType == 'usd' && tokenPrice > 0) {
      const truncatedAmtUsd = truncateToDecimals(amount, decimal);
      setInputAmountUsd(truncatedAmtUsd);
      const truncatedAmt = truncateToDecimals(Number(amount) / tokenPrice, decimal);
      setInputAmount(truncatedAmt);
    } else {
      setInputAmount(truncateToDecimals(amount, decimal));
      setInputAmountUsd(truncateToDecimals(amount * tokenPrice, decimal));
    }
  };
  const handleAddressInputChange = useCallback(
    (val) => {
      dispatch(uiActions.updateTxCreateScreen({ toInfo: val }));
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
                  setInputAmountUsd(truncateToDecimals(Number(balance) * Number(tokenPrice), decimal));
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
                  setInputAmountUsd((Number(safeBalance) * Number(kasPrice)).toLocaleString());
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
          <SubInputAmount
            inputAmountType={inputAmountType}
            setInputAmountType={setInputAmountType}
            inputAmountUsd={inputAmountUsd}
            tokenPrice={tokenPrice}
            tokenTick={tick}
            inputAmount={inputAmount}
          />
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
          items={tabItems as unknown as any[]}
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
        key={'fee-drawer'}
      >
        <Column mt="lg">
          <Text text={`${t('Customize TX Fee')} ( ${t('Optional')} )`} color="textDim" preset="sub" />
          <FeeRateBar
            txFee={txFee}
            onChange={(val) => {
              let _feeRate = 0;
              if (txFee > 0) {
                _feeRate = Number(new BigNumber(val).dividedBy(txFee));
              }
              setUiState({
                feeRate: _feeRate > 1 ? _feeRate : 1,
                priorityFee: val - txFee > 0 ? Number(new BigNumber(val).minus(txFee).decimalPlaces(8)) : 0
              });
            }}
          />
          <Text
            mt="xxl"
            color="white"
            text={`${t('Transaction fee:')} ${formatLocaleString(
              new BigNumber(priorityFee).plus(txFee).decimalPlaces(8)
            )} ${kasTick}`}
            textCenter
          />
          <Row mt="xxl" full></Row>
          <Button
            disabled={disabled}
            preset="primary"
            text={t('Close')}
            onClick={() => setFeeDrawerVisible(false)}
          ></Button>
        </Column>
      </Drawer>
      <Footer>
        <Column
          justifyCenter
          mb="md"
          onClick={() => {
            setFeeDrawerVisible(true);
          }}
        >
          {txFee > 0 && (
            <Text
              preset="link"
              text={`${t('Transaction Fee:')} ${formatLocaleString(
                new BigNumber(priorityFee).plus(txFee).decimalPlaces(8)
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
          {isPrepareSendKAS ? (
            <LoadingOutlined
              style={{
                fontSize: fontSizes.icon,
                color: colors.white
              }}
            />
          ) : undefined}
        </Button>
      </Footer>
    </Layout>
  );
}

export function RecentTab({ handleAddrInput }) {
  const wallet = useWallet();
  const networkId = useAppSelector(selectNetworkId);
  const currentAddress = useAccountAddress();
  const [transactionInfos, setTransactionInfos] = useState<{ address: string; time: number }[]>([]);

  useEffect(() => {
    const fetchRecentSendToAddressKaspa = async () => {
      const data = await wallet.getRecentSendToAddressKaspa(networkId, currentAddress);
      setTransactionInfos(data);
    };
    fetchRecentSendToAddressKaspa();
  }, [networkId, currentAddress, wallet]);
  if (transactionInfos && transactionInfos.length > 0) {
    return (
      <div>
        {transactionInfos
          .filter((e) => e.address?.length > 0 && e?.time > 0)
          .map((e) => (
            <Card
              mt="md"
              key={e.address + e.time}
              classname="card-select"
              onClick={async () => {
                handleAddrInput(e.address);
                copyToClipboard(e.address);
              }}
            >
              <Row full>
                <Column full>
                  <Text text={`Sent on ${new Date(e.time).toLocaleString()}`} size="sm" />
                  <Column>
                    <Text text={shortAddress(e.address, 8)} preset="sub" />
                  </Column>
                </Column>
              </Row>
            </Card>
          ))}
      </div>
    );
  } else {
    return <Empty />;
  }
}

export function ContactsTab({ handleAddrInput, evm }) {
  const wallet = useWallet();
  const { t } = useTranslation();
  const [items, setItems] = useState<ContactBookItem[]>([]);

  useEffect(() => {
    const getContacts = async () => {
      // const contacts = await wallet.getContactsByMap();
      let contacts = await wallet.listContact();
      if (evm) {
        contacts = contacts.filter((e) => isValidAddress(e.address));
      } else {
        contacts = contacts.filter((e) => isValidKaspaAddress(e.address));
      }
      setItems(contacts);
    };
    getContacts();
  }, [evm, wallet]);
  if (items.length == 0) {
    return <Empty text={t('No contacts')} />;
  } else {
    return (
      <div>
        {items.map((account) => {
          return (
            <AddressTypeCard
              key={account.address}
              name={account.name}
              address={account.address}
              handleAddrInput={handleAddrInput}
            />
          );
        })}
      </div>
    );
  }
}

export function MyAccountTab({ handleAddrInput, evm }) {
  const currentAccount = useCurrentAccount();
  const keyrings = useKeyrings();
  return (
    <div>
      {keyrings.map((keyring) => {
        return (
          <div key={keyring.key}>
            <Text text={keyring.alianName} mt="md" />
            {keyring.accounts.map((account) => {
              return (
                <AddressTypeCard
                  key={account.pubkey}
                  name={currentAccount.address == account.address ? account.alianName + ' (Self)' : account.alianName}
                  address={evm ? account.evmAddress : account.address}
                  handleAddrInput={handleAddrInput}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function AddressTypeCard({
  address,
  name,
  handleAddrInput
}: {
  address: string;
  name?: string;
  handleAddrInput: (addr: string) => void;
}) {
  return (
    <Card
      classname="card-select"
      justifyBetween
      mt="md"
      onClick={async () => {
        handleAddrInput(address);
        copyToClipboard(address).then(() => {
          // tools.toastSuccess('Copied');
        });
      }}
    >
      <Column>
        <Text text={name} />
        <Text text={shortAddress(address, 8)} preset="sub" />
      </Column>
    </Card>
  );
}
function TokenCard({ inputToken, tokenType }: { inputToken: any; tokenType: TTokenType }) {
  const navigate = useNavigate();
  const [tick, setTick] = useState<string>('');
  const kasTick = useAppSelector(selectKasTick);
  const accountBalance = useAppSelector((s) => selectAccountBalance(s, undefined));
  // sompi unit
  const [balance, setBalance] = useState<string>('');
  const kasPrice = useKaspaPrice();
  const krc20Price = useKRC20Price(inputToken?.ca ? inputToken?.ca : inputToken?.tick ? inputToken?.tick : 'KAS');
  const tokenPrice = useMemo(() => {
    if (inputToken?.type && inputToken.type == TxType.SIGN_KRC20_TRANSFER) return krc20Price;
    return kasPrice;
  }, [inputToken.type, kasPrice, krc20Price]);
  const content = useMemo(() => {
    if (tokenType == 'KAS') return 'kaspa';
    if (tokenType == 'KRC20Mint') return 'KRC20: ' + (inputToken?.tick as string).toLowerCase();
    if (tokenType == 'KRC20Issue') return 'KRC20: ' + shortAddress(inputToken?.ca);
  }, [tokenType, inputToken]);
  useEffect(() => {
    if (inputToken) {
      setTick(inputToken.tick);
      setBalance(sompiToAmount(inputToken.balance, inputToken.dec));
    } else {
      setTick(kasTick);
      setBalance(accountBalance?.amount);
    }
  }, [accountBalance?.amount, inputToken, kasTick]);
  return (
    <Card
      classname="card-select"
      fullX
      justifyBetween
      mt="md"
      onClick={() => {
        navigate('ChooseTokenScreen', { source: 'TxCreateScreen' });
      }}
    >
      <Row full>
        <Column style={{ width: 40 }} selfItemsCenter>
          <ProfileImage size={40} ticker={inputToken?.tick} tokenType={tokenType} ca={inputToken?.ca} />
        </Column>
        <Column full>
          <Row justifyBetween>
            <Text text={tick} />
            <Text text={formatLocaleString(balance)} />
          </Row>
          {tokenPrice <= 0 && <Text text={content} preset="sub" />}
          {tokenPrice > 0 && (
            <Row justifyBetween>
              <Text text={content} preset="sub" />
              <Text text={`$${(Number(balance) * tokenPrice).toLocaleString()}`} preset="sub" />
            </Row>
          )}
        </Column>
        <Row style={{ width: 30 }} selfItemsCenter justifyEnd>
          <RightOutlined />
        </Row>
      </Row>
    </Card>
  );
}
