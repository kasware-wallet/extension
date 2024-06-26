/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import BigNumber from 'bignumber.js';
import { useEffect, useMemo, useState } from 'react';

import { ContactBookItem } from '@/background/service/contactBook';
import { COIN_DUST } from '@/shared/constant';
import { IRecentTransactoinAddresses, IResultPsbtHex, NetworkType, RawTxInfo } from '@/shared/types';
import { Button, Card, Column, Content, Header, Icon, Input, Layout, Row, Text } from '@/ui/components';
import { useTools } from '@/ui/components/ActionComponent';
import { Empty } from '@/ui/components/Empty';
import { FeeRateBar } from '@/ui/components/FeeRateBar';
import { KasAmountInput } from '@/ui/components/Input';
import { useNavigate } from '@/ui/pages/MainRoute';
import { useAccountBalance, useCurrentAccount, useKasPrice } from '@/ui/state/accounts/hooks';
import { accountActions } from '@/ui/state/accounts/reducer';
import { useAppDispatch } from '@/ui/state/hooks';
import { useKeyrings } from '@/ui/state/keyrings/hooks';
import { useNetworkType } from '@/ui/state/settings/hooks';
import {
  useFetchUtxosCallback,
  useKaspaTx,
  usePrepareSendKASCallback,
  useSafeBalance
} from '@/ui/state/transactions/hooks';
import { colors } from '@/ui/theme/colors';
import {
  amountToSompi,
  copyToClipboard,
  handleTransactionsAddresses,
  isValidAddress,
  shortAddress,
  sompiToAmount,
  useLocationState,
  useWallet
} from '@/ui/utils';
import { Drawer, Tabs } from 'antd';
import { useTranslation } from 'react-i18next';
interface LocationState {
  rawTxInfo: RawTxInfo;
}

export default function TxCreateScreen() {
  const { t } = useTranslation();
  const accountBalance = useAccountBalance();
  const safeBalance = useSafeBalance();
  const navigate = useNavigate();
  const kaspaTx = useKaspaTx();
  const [inputAmount, setInputAmount] = useState(kaspaTx.toSompi > 0 ? sompiToAmount(kaspaTx.toSompi) : '');
  const [inputAmountUsd, setInputAmountUsd] = useState('');
  const [disabled, setDisabled] = useState(true);
  const [toInfo, setToInfo] = useState<{
    address: string;
    domain: string;
  }>({
    address: kaspaTx.toAddress,
    domain: kaspaTx.toDomain
  });
  const networkType = useNetworkType();
  const [error, setError] = useState('');
  const kasPrice = useKasPrice();

  const [autoAdjust, setAutoAdjust] = useState(false);
  const fetchUtxos = useFetchUtxosCallback();

  const tools = useTools();
  useEffect(() => {
    tools.showLoading(true);
    fetchUtxos().finally(() => {
      tools.showLoading(false);
    });
  }, []);

  const prepareSendKAS = usePrepareSendKASCallback();

  const safeSompi = useMemo(() => {
    return amountToSompi(safeBalance);
  }, [safeBalance]);

  const toSompi = useMemo(() => {
    if (!inputAmount) return 0;
    return amountToSompi(inputAmount);
  }, [inputAmount]);
  const [inputAmountType, setInputAmountType] = useState<'kas' | 'usd'>('kas');

  const dustAmount = useMemo(() => sompiToAmount(COIN_DUST), [COIN_DUST]);

  const [feeRate, setFeeRate] = useState(0);

  const [rawTxInfo, setRawTxInfo] = useState<RawTxInfo>();
  const [txFee, setTxFee] = useState(0);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [feeDrawerVisible, setFeeDrawerVisible] = useState(false);
  const dispatch = useAppDispatch();

  const [enableRBF, setEnableRBF] = useState(false);
  useEffect(() => {
    setError('');
    setDisabled(true);

    if (!isValidAddress(toInfo.address)) {
      return;
    }
    if (!toSompi) {
      return;
    }
    if (toSompi < COIN_DUST) {
      setError(`Amount must be at least ${dustAmount} KAS`);
      return;
    }

    // if (toSatoshis > safeSatoshis) {
    //   setError('Amount exceeds your available balance');
    //   return;
    // }

    // if (feeRate <= 0) {
    // if (feeRate < 0) {
    //   return;
    // }

    if (toInfo.address == kaspaTx.toAddress && toSompi == kaspaTx.toSompi && feeRate == kaspaTx.feeRate) {
      //Prevent repeated triggering caused by setAmount
      setDisabled(false);
      return;
    }

    prepareSendKAS({ toAddressInfo: toInfo, toAmount: toSompi, feeRate, enableRBF })
      .then((data) => {
        // if (data.fee < data.estimateFee) {
        //   setError(`Network fee must be at leat ${data.estimateFee}`);
        //   return;
        // }
        setTxFee(data?.fee ? Number(sompiToAmount(data.fee)) : 0);
        setRawTxInfo(data);
        setDisabled(false);
      })
      .catch((e) => {
        console.log(e);
        if (e.message && e.message === 'Storage mass exceeds maximum') {
          setError('Amount is too small.');
        } else {
          setError(e.message);
        }
      });
  }, [toInfo, inputAmount, feeRate, enableRBF]);

  useEffect(() => {
    if (networkType !== NetworkType.Mainnet) return;
    fetch('https://api.kaspa.org/info/price')
      .then((response) => response.json())
      .then((data) => {
        const price = Number(data.price);
        // 0.178
        if (price && price > 0) dispatch(accountActions.setKasPrice(price));
      });
  }, []);

  const showSafeBalance = useMemo(
    () => !new BigNumber(accountBalance.amount).eq(new BigNumber(safeBalance)),
    [accountBalance.amount, safeBalance]
  );
  const dataFromForward = useLocationState<LocationState>();
  useEffect(() => {
    if (dataFromForward && dataFromForward.rawTxInfo) {
      const rawtxFromForward = dataFromForward.rawTxInfo.rawtx;
      const result: IResultPsbtHex = JSON.parse(rawtxFromForward);
      const toAddress = result.to;
      const inputAmount = sompiToAmount(result.amountSompi);
      setInputAmount(inputAmount);
      setInputAmountUsd((Number(inputAmount) * Number(kasPrice)).toLocaleString());
      setFeeRate(result.feeRate);
      setToInfo({ address: toAddress, domain: '' });
    }
  }, [dataFromForward]);

  const handleAddrInput = (address: string) => {
    setToInfo({ address, domain: '' });
    setDrawerVisible(false);
    const input = document.getElementById('address-input');
    if (input) {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      nativeInputValueSetter?.call(input, address);
      const inputEvent = new Event('input', { bubbles: true });
      input.dispatchEvent(inputEvent);
    } else {
      console.log('address input undefine');
    }
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
      children: <ContactsTab handleAddrInput={handleAddrInput} />
      // disabled: true,
    },
    {
      key: 'my_account',
      label: t('My account'),
      children: <MyAccountTab handleAddrInput={handleAddrInput} />
    }
  ];

  return (
    <Layout>
      <Header
        onBack={() => {
          // window.history.go(-1);
          navigate('MainScreen');
        }}
        title={`${t('Send')} KAS`}
      />
      <Content style={{ padding: '0px 16px 24px' }}>
        <Row justifyCenter>
          <Icon icon="kas" size={50} />
        </Row>
        <Text text={t('Recipient')} preset="regular" color="textDim" />
        <Row justifyBetween>
          <Column full>
            <Input
              id="address-input"
              preset="address"
              defaultValue={toInfo.address}
              addressInputData={toInfo}
              onAddressInputChange={(val) => {
                setToInfo(val);
              }}
              autoFocus={true}
            />
          </Column>
          <Button
            style={{
              height: '56px'
            }}
            onClick={() => {
              setDrawerVisible(true);
            }}>
            <Icon icon={'user'} />
          </Button>
        </Row>
        <Column mt="lg">
          <Row justifyBetween>
            <Text text={t('Balance')} color="textDim" />
            {showSafeBalance ? (
              <Text text={`${accountBalance.amount} KAS`} preset="bold" size="sm" />
            ) : (
              <Row
                onClick={() => {
                  setAutoAdjust(true);
                  setInputAmount(accountBalance.amount);
                  setInputAmountUsd((Number(accountBalance.amount) * Number(kasPrice)).toLocaleString());
                }}>
                <Text
                  text="MAX"
                  preset="sub"
                  style={{ color: autoAdjust ? colors.yellow_light : colors.white_muted }}
                />
                <Text text={`${accountBalance.amount} KAS`} preset="bold" size="sm" />
              </Row>
            )}
          </Row>
          <Row justifyBetween>
            <Text text={`${t('Unconfirmed')}KAS`} color="textDim" />
            <Text text={`${accountBalance.pending_kas_amount} KAS`} size="sm" preset="bold" color="textDim" />
          </Row>
          {showSafeBalance && (
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
          <KasAmountInput
            preset="amount"
            inputAmountType={inputAmountType}
            placeholder={t('Amount')}
            // defaultValue={inputAmount}
            value={inputAmountType == 'kas' ? inputAmount : inputAmountUsd}
            onAmountInputChange={(amount) => {
              if (autoAdjust == true) {
                setAutoAdjust(false);
              }
              if (inputAmountType == 'usd' && kasPrice > 0) {
                setInputAmountUsd(amount);
                setInputAmount((Number(amount) / kasPrice).toLocaleString());
              } else {
                setInputAmount(amount);
                setInputAmountUsd((Number(amount) * kasPrice).toLocaleString());
              }
            }}
          />
          <SubInputAmount
            inputAmountType={inputAmountType}
            setInputAmountType={setInputAmountType}
            inputAmountUsd={inputAmountUsd}
            kasPrice={kasPrice}
            inputAmount={inputAmount}
          />
        </Column>

        {/* <Column mt="lg">
          <Text text={`${t('Priority Fee Rate')} ( ${t('Optional')} )`} color="textDim" />

          <FeeRateBar
            onChange={(val) => {
              setFeeRate(val);
            }}
          />
        </Column> */}
        {error && <Text text={error} color="error" />}
        <Column
          justifyCenter
          mt="xl"
          onClick={() => {
            setFeeDrawerVisible(true);
          }}>
          {txFee > 0 && <Text preset="link" text={`${t('TX Fee:')} ${txFee} KAS`} textCenter />}
          {feeRate > 0 && (
            <Text
              preset="link"
              text={`${t('Priority Fee:')} ${sompiToAmount(feeRate * Number(amountToSompi(txFee.toString())))} KAS`}
              textCenter
            />
          )}
        </Column>
        <Button
          disabled={disabled}
          preset="primary"
          text={t('Next')}
          onClick={(e) => {
            navigate('TxConfirmScreen', { rawTxInfo });
          }}></Button>
      </Content>
      <Drawer
        placement={'bottom'}
        closable={false}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        key={'bottom'}>
        <Tabs
          size={'small'}
          defaultActiveKey="0"
          // activeKey={assetTabKey as unknown as string}
          items={tabItems as unknown as any[]}
          onTabClick={(key) => {
            // console.log(key);
          }}
        />
      </Drawer>
      <Drawer
        placement={'bottom'}
        closable={false}
        onClose={() => setFeeDrawerVisible(false)}
        open={feeDrawerVisible}
        key={'fee-drawer'}>
        <Column mt="lg">
          <Text text={`${t('Priority Fee Rate')} ( ${t('Optional')} )`} color="textDim" />
          <FeeRateBar
            feeRate={feeRate}
            onChange={(val) => {
              setFeeRate(val);
            }}
          />
          <Text
            mt="xxl"
            color="white"
            text={`${t('Priority Fee:')} ${sompiToAmount(feeRate * Number(amountToSompi(txFee.toString())))} KAS`}
            textCenter
          />
          <Row mt="xxl" full></Row>
          <Button
            disabled={disabled}
            preset="primary"
            text={t('Close')}
            onClick={() => setFeeDrawerVisible(false)}></Button>
        </Column>
      </Drawer>
    </Layout>
  );
}

function SubInputAmount({ inputAmountType, setInputAmountType, inputAmountUsd, kasPrice, inputAmount }) {
  const [hover, setHover] = useState(false);
  if (kasPrice > 0 && Number(inputAmount) > 0) {
    return (
      <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
        <Row
          itemsCenter
          onClick={() => {
            inputAmountType == 'kas' ? setInputAmountType('usd') : setInputAmountType('kas');
          }}>
          <Icon icon="send" color={hover ? 'text' : 'textDim'} size={12} />
          {inputAmountType == 'kas' && kasPrice > 0 && (
            <Text text={`$${Number(inputAmountUsd)}`} color={hover ? 'text' : 'textDim'} />
          )}
          {inputAmountType == 'usd' && kasPrice > 0 && <Text text={`${Number(inputAmount)} KAS`} color={hover ? 'text' : 'textDim'} />}
        </Row>
      </div>
    );
  } else {
    return <></>;
  }
}

function RecentTab({ handleAddrInput }) {
  const currentAccount = useCurrentAccount();
  const address = currentAccount.address;
  // const address = 'kaspa:qpzpfwcsqsxhxwup26r55fd0ghqlhyugz8cp6y3wxuddc02vcxtjg75pspnwz';
  const [transactionInfos, setTransactionInfos] = useState<IRecentTransactoinAddresses[]>([]);

  useEffect(() => {
    fetch(`https://api.kaspa.org/addresses/${address}/full-transactions?limit=10&resolve_previous_outpoints=light`)
      .then((response) => response.json())
      .then((data) => {
        const trans = handleTransactionsAddresses(data, address);
        setTransactionInfos(trans);
      })
      .catch((e) => {
        console.log(e);
      });
  }, []);
  if (transactionInfos && transactionInfos.length > 0) {
    return (
      <div>
        {transactionInfos.map((e) => (
          <Card mt="md" key={e.transaction_id}>
            <Row full>
              <Column full>
                <Text text={`${e.mode} on ${new Date(e.block_time).toLocaleString()}`} />
                {(e.relatedAddresses as string[]).length > 0 &&
                  e.relatedAddresses.map((e, index) => {
                    return (
                      <Column
                        classname="recent-account-select"
                        key={index}
                        onClick={async () => {
                          handleAddrInput(e);
                          copyToClipboard(e).then(() => {
                            // tools.toastSuccess('Copied');
                          });
                        }}>
                        <Text text={shortAddress(e, 15)} preset="sub" />
                      </Column>
                    );
                  })}
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

function ContactsTab({ handleAddrInput }) {
  const wallet = useWallet();
  const { t } = useTranslation();
  const [items, setItems] = useState<ContactBookItem[]>([]);
  const getContacts = async () => {
    // const contacts = await wallet.getContactsByMap();
    const contacts = await wallet.listContact();
    setItems(contacts);
  };
  useEffect(() => {
    getContacts();
  }, []);
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

function MyAccountTab({ handleAddrInput }) {
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
                  address={account.address}
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
      }}>
      <Column>
        <Text text={name} />
        <Text text={shortAddress(address, 15)} preset="sub" />
      </Column>
    </Card>
  );
}
