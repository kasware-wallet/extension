/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import VirtualList from 'rc-virtual-list';
import { forwardRef, useEffect, useMemo, useState } from 'react';

import { Account, IScannedGroup } from '@/shared/types';
import { Card, Column, Content, Header, Icon, Layout, Row, Text } from '@/ui/components';
import { useTools } from '@/ui/components/ActionComponent';
import {
  useAccountBalance,
  useCurrentAccount,
  useFetchBalancesCallback,
  useReloadAccounts
} from '@/ui/state/accounts/hooks';
import { accountActions } from '@/ui/state/accounts/reducer';
import { useAppDispatch } from '@/ui/state/hooks';
import { useCurrentKeyring } from '@/ui/state/keyrings/hooks';
import { colors } from '@/ui/theme/colors';
import { copyToClipboard, generateHdPath, shortAddress, useWallet } from '@/ui/utils';
import {
  CheckCircleFilled,
  CopyOutlined,
  EditOutlined,
  EllipsisOutlined,
  KeyOutlined,
  LoadingOutlined,
  MergeCellsOutlined,
  PlusCircleOutlined,
  SearchOutlined
} from '@ant-design/icons';

import eventBus from '@/shared/eventBus';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '../MainRoute';

export interface ItemData {
  key: string;
  account?: Account;
}

interface MyItemProps {
  account?: Account;
  autoNav?: boolean;
}

export function MyItem({ account, autoNav }: MyItemProps, ref) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const currentAccount = useCurrentAccount();
  const selected = currentAccount.pubkey == account?.pubkey;
  const wallet = useWallet();
  const dispatch = useAppDispatch();
  const keyring = useCurrentKeyring();
  const accountBalance = useAccountBalance(account?.address);
  if (!account) {
    return <div />;
  }
  const [optionsVisible, setOptionsVisible] = useState(false);
  // const path = keyring.hdPath + '/' + account.index;
  // eslint-disable-next-line quotes
  // const path = keyring.hdPath + '/' + account.deriveType + `'/` + account.index?.toString().slice(2) + `'`;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const path = generateHdPath(keyring.hdPath, account.deriveType!.toString(), account.index!.toString().slice(2));
  const tools = useTools();

  return (
    <Card classname="card-select" justifyBetween mt="md">
      <Row>
        <Column style={{ width: 20 }} selfItemsCenter>
          {selected && (
            <Icon>
              <CheckCircleFilled />
            </Icon>
          )}
        </Column>
        <Column
          onClick={async (e) => {
            if (currentAccount.pubkey !== account.pubkey) {
              await wallet.changeKeyring(keyring, account.index);
              const _currentAccount = await wallet.getCurrentAccount();
              dispatch(accountActions.setCurrent(_currentAccount));
            }
            if (autoNav) navigate('MainScreen');
          }}>
          <Row justifyBetween>
            <Text text={account.alianName} />
            <Text text={accountBalance.amount} />
          </Row>
          <Text text={`${shortAddress(account.address)} (${path})`} preset="sub" />
        </Column>
      </Row>
      <Column relative>
        {optionsVisible && (
          <div
            style={{
              position: 'fixed',
              zIndex: 10,
              left: 0,
              right: 0,
              top: 0,
              bottom: 0
            }}
            onTouchStart={(e) => {
              setOptionsVisible(false);
            }}
            onMouseDown={(e) => {
              setOptionsVisible(false);
            }}></div>
        )}

        <Icon
          onClick={async (e) => {
            setOptionsVisible(!optionsVisible);
          }}>
          <EllipsisOutlined />
        </Icon>

        {optionsVisible && (
          <Column
            style={{
              backgroundColor: colors.black,
              width: 170,
              position: 'absolute',
              right: 0,
              padding: 5,
              zIndex: 10
            }}>
            <Column classname="column-select">
              <Row
                onClick={() => {
                  navigate('EditAccountNameScreen', { account });
                }}>
                <EditOutlined />
                <Text text={t('Edit Name')} size="sm" />
              </Row>
            </Column>
            <Column classname="column-select">
              <Row
                onClick={() => {
                  copyToClipboard(account.address);
                  tools.toastSuccess(t('Copied'));
                  setOptionsVisible(false);
                }}>
                <CopyOutlined />
                <Text text={t('Copy address')} size="sm" />
              </Row>
            </Column>
            <Column classname="column-select">
              <Row
                onClick={() => {
                  navigate('ExportPrivateKeyScreen', { account });
                }}>
                <KeyOutlined />
                <Text text={t('Export Private Key')} size="sm" />
              </Row>
            </Column>
          </Column>
        )}
      </Column>
    </Card>
  );
}

export default function SwitchAccountScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const keyring = useCurrentKeyring();
  const reloadAccounts = useReloadAccounts();
  const wallet = useWallet();
  const tools = useTools();
  const fetchBalances = useFetchBalancesCallback();
  const items = useMemo(() => {
    const _items: ItemData[] = keyring.accounts.map((v) => {
      return {
        key: v.address,
        account: v
      };
    });
    return _items;
  }, [keyring.accounts]);
  const ForwardMyItem = forwardRef(MyItem);
  const [loading, setLoading] = useState(false);
  const discoverAddress = async () => {
    setLoading(true);
    const result: IScannedGroup = await wallet.discoverAddressesWithBalance(keyring);
    setLoading(false);
    if (result == null || result == undefined) {
      tools.showTip('no more address with balance');
    } else {
      reloadAccounts();
      const count = result.address_arr.length;
      tools.toastSuccess(`found ${count} addresses`);
    }
  };
  const compound = async () => {
    setLoading(true);
    const result = await wallet.compoundUtxos(keyring.accounts);
    setLoading(false);
    if (result == null || result == undefined) {
      tools.toastError('failed, please try again')
    } else {
      await reloadAccounts();
      tools.toastSuccess('success');
    }
  };
  const [optionsVisible, setOptionsVisible] = useState(false);
  const loadBalance = () => {
    setLoading(true);
    fetchBalances().finally(() => {
      setLoading(false);
    });
  };
  useEffect(() => {
    loadBalance();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
    eventBus.addEventListener('utxosChangedNotification', (a) => {
      console.log('utxosChangedNotification11111111',a)
      loadBalance();
    });
    return () => {
      eventBus.removeEventListener('utxosChangedNotification', () => { });
    };
  }, [fetchBalances, wallet]);

  return (
    <Layout>
      <Header
        onBack={() => {
          window.history.go(-1);
        }}
        title={t('Switch Account')}
        RightComponent={
          <Column relative classname='column-select'>
            {optionsVisible && (
              <div
                style={{
                  position: 'fixed',
                  zIndex: 10,
                  left: 0,
                  right: 0,
                  top: 0,
                  bottom: 0
                }}
                onTouchStart={(e) => {
                  setOptionsVisible(false);
                }}
                onMouseDown={(e) => {
                  setOptionsVisible(false);
                }}></div>
            )}
            <Icon
              onClick={() => {
                setOptionsVisible(true);
              }}>
              <EllipsisOutlined />
            </Icon>
            {optionsVisible && (
              <Column
                style={{
                  backgroundColor: colors.black,
                  width: 170,
                  position: 'absolute',
                  right: 0,
                  padding: 5,
                  zIndex: 10
                }}>
                <Column classname="column-select">
                  <Row
                    onClick={() => {
                      navigate('CreateAccountScreen');
                    }}>
                    <PlusCircleOutlined />
                    <Text text={t('New account')} size="sm" />
                  </Row>
                </Column>
                <Column classname="column-select">
                  <Row
                    onClick={() => {
                      setOptionsVisible(false);
                      discoverAddress();
                      // copyToClipboard(account.address);
                    }}>
                    <SearchOutlined />
                    <Text text={t('Discover address')} size="sm" />
                  </Row>
                </Column>
                <Column classname="column-select">
                  <Row
                    onClick={() => {
                      setOptionsVisible(false);
                      compound();
                      // copyToClipboard(account.address);
                    }}>
                    <MergeCellsOutlined />
                    <Text text="Compound" size="sm" />
                  </Row>
                </Column>
              </Column>
            )}
          </Column>
        }
      />
      {loading && (
        <Row justifyCenter>
          <Icon>
            <LoadingOutlined />
          </Icon>
        </Row>
      )}
      <Content>
        <VirtualList data={items} data-id="list" itemHeight={20} itemKey={(item) => item.key}>
          {(item, index) => <ForwardMyItem account={item.account} autoNav={true} />}
        </VirtualList>
      </Content>
    </Layout>
  );
}
