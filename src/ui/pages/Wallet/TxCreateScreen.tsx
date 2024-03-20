/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import BigNumber from 'bignumber.js';
import { useEffect, useMemo, useState } from 'react';

import { ContactBookItem } from '@/background/service/contactBook';
import { COIN_DUST } from '@/shared/constant';
import { IRecentTransactoinAddresses, Inscription, RawTxInfo } from '@/shared/types';
import { Button, Card, Column, Content, Header, Icon, Input, Layout, Row, Text } from '@/ui/components';
import { useTools } from '@/ui/components/ActionComponent';
import { FeeRateBar } from '@/ui/components/FeeRateBar';
import { useNavigate } from '@/ui/pages/MainRoute';
import { useAccountBalance, useCurrentAccount } from '@/ui/state/accounts/hooks';
import { useKeyrings } from '@/ui/state/keyrings/hooks';
import {
  useBitcoinTx,
  useFetchUtxosCallback,
  usePrepareSendBTCCallback,
  useSafeBalance
} from '@/ui/state/transactions/hooks';
import { colors } from '@/ui/theme/colors';
import {
  amountToSatoshis,
  copyToClipboard,
  handleTransactionsAddresses,
  isValidAddress,
  satoshisToAmount,
  shortAddress,
  useWallet
} from '@/ui/utils';
import { Drawer, Tabs } from 'antd';

export default function TxCreateScreen() {
  const accountBalance = useAccountBalance();
  const safeBalance = useSafeBalance();
  const navigate = useNavigate();
  const bitcoinTx = useBitcoinTx();
  const [inputAmount, setInputAmount] = useState(
    bitcoinTx.toSatoshis > 0 ? satoshisToAmount(bitcoinTx.toSatoshis) : ''
  );
  const [disabled, setDisabled] = useState(true);
  const [toInfo, setToInfo] = useState<{
    address: string;
    domain: string;
    inscription?: Inscription;
  }>({
    address: bitcoinTx.toAddress,
    // address: 'kaspadev:qpxxpgqac0dwqplyxfpkgaekgrmyflkv0at550x8st82m73nujqe52j8plx2p',
    domain: bitcoinTx.toDomain,
    inscription: undefined
  });

  const [error, setError] = useState('');

  const [autoAdjust, setAutoAdjust] = useState(false);
  const fetchUtxos = useFetchUtxosCallback();

  const tools = useTools();
  useEffect(() => {
    tools.showLoading(true);
    fetchUtxos().finally(() => {
      tools.showLoading(false);
    });
  }, []);

  const prepareSendBTC = usePrepareSendBTCCallback();

  const safeSatoshis = useMemo(() => {
    return amountToSatoshis(safeBalance);
  }, [safeBalance]);

  const toSatoshis = useMemo(() => {
    if (!inputAmount) return 0;
    return amountToSatoshis(inputAmount);
  }, [inputAmount]);

  const dustAmount = useMemo(() => satoshisToAmount(COIN_DUST), [COIN_DUST]);

  const [feeRate, setFeeRate] = useState(5);

  const [rawTxInfo, setRawTxInfo] = useState<RawTxInfo>();
  const [drawerVisible, setDrawerVisible] = useState(false);

  const [enableRBF, setEnableRBF] = useState(false);
  useEffect(() => {
    setError('');
    setDisabled(true);

    if (!isValidAddress(toInfo.address)) {
      return;
    }
    if (!toSatoshis) {
      return;
    }
    if (toSatoshis < COIN_DUST) {
      setError(`Amount must be at least ${dustAmount} KAS`);
      return;
    }

    if (toSatoshis > safeSatoshis) {
      setError('Amount exceeds your available balance');
      return;
    }

    // if (feeRate <= 0) {
    if (feeRate < 0) {
      return;
    }

    if (toInfo.address == bitcoinTx.toAddress && toSatoshis == bitcoinTx.toSatoshis && feeRate == bitcoinTx.feeRate) {
      //Prevent repeated triggering caused by setAmount
      setDisabled(false);
      return;
    }

    prepareSendBTC({ toAddressInfo: toInfo, toAmount: toSatoshis, feeRate, enableRBF })
      .then((data) => {
        // if (data.fee < data.estimateFee) {
        //   setError(`Network fee must be at leat ${data.estimateFee}`);
        //   return;
        // }
        setRawTxInfo(data);
        setDisabled(false);
      })
      .catch((e) => {
        console.log(e);
        setError(e.message);
      });
  }, [toInfo, inputAmount, feeRate, enableRBF]);

  const showSafeBalance = useMemo(
    () => !new BigNumber(accountBalance.amount).eq(new BigNumber(safeBalance)),
    [accountBalance.amount, safeBalance]
  );

  const handleAddrInput = (address: string) => {
    setToInfo({ address, domain: '', inscription: undefined });
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
      label: 'Recent',
      children: <RecentTab handleAddrInput={handleAddrInput} />
    },
    {
      key: 'contacts',
      label: 'Contacts',
      children: <ContactsTab handleAddrInput={handleAddrInput} />
      // disabled: true,
    },
    {
      key: 'my_account',
      label: 'My account',
      children: <MyAccountTab handleAddrInput={handleAddrInput} />
    }
  ];

  return (
    <Layout>
      <Header
        onBack={() => {
          window.history.go(-1);
        }}
        title="Send KAS"
      />
      <Content style={{ padding: '0px 16px 24px' }}>
        <Row justifyCenter>
          <Icon icon="kas" size={50} />
        </Row>
        <Text text="Recipient" preset="regular" color="textDim" />
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
            <Text text="Balance" color="textDim" />
            {showSafeBalance ? (
              <Text text={`${accountBalance.amount} KAS`} preset="bold" size="sm" />
            ) : (
              <Row
                onClick={() => {
                  setAutoAdjust(true);
                  setInputAmount(accountBalance.amount);
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
            <Text text="Unconfirmed KAS" color="textDim" />
            <Text text={`${accountBalance.pending_btc_amount} KAS`} size="sm" preset="bold" color="textDim" />
          </Row>
          {showSafeBalance && (
            <Row justifyBetween>
              <Text text="Available (safe to send)" color="textDim" />

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
          <Input
            preset="amount"
            placeholder={'Amount'}
            // defaultValue={inputAmount}
            value={inputAmount}
            onAmountInputChange={(amount) => {
              if (autoAdjust == true) {
                setAutoAdjust(false);
              }
              setInputAmount(amount);
            }}
          />
        </Column>

        <Column mt="lg">
          <Text text="Priority Fee Rate(Optional)" color="textDim" />

          <FeeRateBar
            onChange={(val) => {
              setFeeRate(val);
            }}
          />
        </Column>
        {error && <Text text={error} color="error" />}

        <Button
          disabled={disabled}
          preset="primary"
          text="Next"
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
    </Layout>
  );
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
    return (
      <Row justifyCenter>
        <Text text="No data" mt="md" />
      </Row>
    );
  }
}

function ContactsTab({ handleAddrInput }) {
  const wallet = useWallet();
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
    return (
      <Row justifyCenter>
        <Text text="No contacts" mt="md" />
      </Row>
    );
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
                  name={account.alianName}
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
