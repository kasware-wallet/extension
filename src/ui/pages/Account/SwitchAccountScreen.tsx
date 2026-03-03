import VirtualList from 'rc-virtual-list';
import { forwardRef, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import eventBus from '@/shared/eventBus';
import { toChecksumHexAddress } from '@/shared/modules/hexstring-utils';
import type { Account, IScannedGroup } from '@/shared/types';
import { AddressType } from '@/shared/types';
import { Card, Column, Content, Header, Icon, Layout, Row, Text } from '@/ui/components';
import { useTools } from '@/ui/components/ActionComponent';
import { HideAccountPopover } from '@/ui/components/HideAccountPopover';
import { useCurrentAccount, useFetchBalancesQuery, useReloadAccounts } from '@/ui/state/accounts/hooks';
import { accountsActions, changeAccountAsync, selectAccountBalance } from '@/ui/state/accounts/reducer';
import { useAppDispatch, useAppSelector } from '@/ui/state/hooks';
import { useCurrentKeyring } from '@/ui/state/keyrings/hooks';
import { selectKasTick } from '@/ui/state/settings/reducer';
import { colors } from '@/ui/theme/colors';
import { copyToClipboard, formatLocaleString, generateHdPath, shortAddress, useWallet } from '@/ui/utils';
import {
  CheckCircleFilled,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  EllipsisOutlined,
  KeyOutlined,
  LoadingOutlined,
  MergeCellsOutlined,
  PlusCircleOutlined,
  SearchOutlined,
  SettingOutlined
} from '@ant-design/icons';

import { useNavigate } from '../MainRoute';
import { useDisplayName } from '@/ui/hooks/useDisplayName';

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
  const tools = useTools();
  const navigate = useNavigate();
  const currentAccount = useCurrentAccount();
  const selected = currentAccount.pubkey == account?.pubkey;
  const wallet = useWallet();
  const reloadAccounts = useReloadAccounts();
  const dispatch = useAppDispatch();
  const keyring = useCurrentKeyring();
  const enableHideAccountOption = useMemo(() => {
    if (keyring.accounts?.length > 1) {
      return true;
    }
    return false;
  }, [keyring.accounts?.length]);
  const accountBalance = useAppSelector((s) => selectAccountBalance(s, account?.address));
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [hideAccountVisible, setHideAccountVisible] = useState(false);
  const displayName = useDisplayName(account?.alianName);

  if (!account) {
    return <div />;
  }
  // const path = keyring.hdPath + '/' + account.index;
  // eslint-disable-next-line quotes
  // const path = keyring.hdPath + '/' + account.deriveType + `'/` + account.index?.toString().slice(2) + `'`;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const path = generateHdPath(keyring.hdPath, account.deriveType!.toString(), account.index!.toString().slice(2));
  return (
    <Row full justifyBetween selfItemsCenter style={{ gap: 2 }}>
      <Card
        classname="card-select"
        full
        justifyBetween
        mt="md"
        style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
      >
        <Row
          full
          onClick={async () => {
            if (currentAccount.pubkey !== account.pubkey) {
              await wallet.changeKeyring(keyring, account.index);
              const _currentAccount = await wallet.getCurrentAccount();
              dispatch(accountsActions.setCurrent(_currentAccount));
              await dispatch(changeAccountAsync(account));
            }
            if (autoNav) navigate('WalletTabScreen');
          }}
        >
          <Column style={{ width: 20 }} selfItemsCenter>
            {selected && (
              <Icon>
                <CheckCircleFilled />
              </Icon>
            )}
          </Column>
          <Column full>
            <Row justifyBetween>
              <Text text={displayName} />
              <Text text={formatLocaleString(accountBalance.amount)} style={{ paddingRight: 5 }} />
            </Row>
            <Text text={`${shortAddress(account.address)} (${path})`} preset="sub" />
            {account?.evmAddress !== undefined && account?.evmAddress?.length > 0 && (
              <Text text={shortAddress(toChecksumHexAddress(account.evmAddress))} color="textDim" />
            )}
          </Column>
        </Row>
      </Card>
      <Card
        onClick={() => {
          setOptionsVisible(!optionsVisible);
        }}
        classname="card-select"
        mt="md"
        style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
      >
        <Column style={{ width: 20 }} selfItemsCenter>
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
              onTouchStart={() => {
                setOptionsVisible(false);
              }}
              onMouseDown={() => {
                setOptionsVisible(false);
              }}
            ></div>
          )}

          <Icon>
            {/* <EllipsisOutlined /> */}
            <SettingOutlined />
          </Icon>

          {optionsVisible && (
            <Column
              style={{
                backgroundColor: colors.black,
                width: 180,
                position: 'absolute',
                right: 0,
                padding: 5,
                zIndex: 10
              }}
            >
              <Column>
                <Column
                  classname="column-select"
                  onClick={() => {
                    navigate('EditAccountNameScreen', { account });
                  }}
                >
                  <Row>
                    <EditOutlined />
                    <Text text={t('Edit Name')} size="sm" />
                  </Row>
                </Column>
                <Column
                  classname="column-select"
                  onClick={() => {
                    copyToClipboard(account.address);
                    tools.toastSuccess(t('Copied'));
                    setOptionsVisible(false);
                  }}
                >
                  <Row>
                    <CopyOutlined />
                    <Text text={t('Copy address')} size="sm" />
                  </Row>
                </Column>
                <Column
                  classname="column-select"
                  onClick={() => {
                    navigate('ExportPrivateKeyScreen', { account });
                  }}
                >
                  <Row>
                    <KeyOutlined />
                    <Text text={t('Export Private Key')} size="sm" />
                  </Row>
                </Column>
                {enableHideAccountOption == true && (
                  <Column
                    classname="column-select"
                    onClick={async () => {
                      setOptionsVisible(false);
                      setHideAccountVisible(true);
                    }}
                  >
                    <Row>
                      <DeleteOutlined />
                      <Text text={t('Hide Account')} size="sm" />
                    </Row>
                  </Column>
                )}
              </Column>
            </Column>
          )}
        </Column>
      </Card>
      {hideAccountVisible && (
        <HideAccountPopover
          account={account}
          amount={accountBalance.amount}
          onClose={async () => {
            setHideAccountVisible(false);
          }}
          onConfirm={async () => {
            if (currentAccount.pubkey == account.pubkey) {
              const accounts = keyring.accounts.filter((v) => v.pubkey !== currentAccount.pubkey);
              await wallet.changeKeyring(keyring, accounts[0].index);
              const _currentAccount = await wallet.getCurrentAccount();
              dispatch(accountsActions.setCurrent(_currentAccount));
            }
            await wallet.removeAccount(account, keyring.type);
            await reloadAccounts();
            setHideAccountVisible(false);
          }}
        />
      )}
    </Row>
  );
}

export default function SwitchAccountScreen() {
  const { t } = useTranslation();
  const kasTick = useAppSelector(selectKasTick);

  const navigate = useNavigate();
  const keyring = useCurrentKeyring();
  const reloadAccounts = useReloadAccounts();
  const wallet = useWallet();
  const tools = useTools();
  const { isLoading: isLoadingBalances, refetch } = useFetchBalancesQuery();
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
      tools.toastError('failed, please try again');
    } else {
      await reloadAccounts();
      tools.toastSuccess('success');
    }
  };
  const [optionsVisible, setOptionsVisible] = useState(false);
  useEffect(() => {
    const handler = () => {
      refetch();
    };
    eventBus.addEventListener('utxosChangedNotification', handler);
    return () => {
      eventBus.removeEventListener('utxosChangedNotification', handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const keyringDisplayName = useDisplayName(keyring.alianName);

  return (
    <Layout>
      <Header
        onBack={() => {
          window.history.go(-1);
        }}
        title={keyringDisplayName || t('Account List')}
        RightComponent={
          <Column relative classname="column-select">
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
                onTouchStart={() => {
                  setOptionsVisible(false);
                }}
                onMouseDown={() => {
                  setOptionsVisible(false);
                }}
              ></div>
            )}
            {keyring.addressType !== undefined && keyring.addressType !== AddressType.KASPA_CHAINGE_44_111111_0_0 && (
              <Icon
                onClick={() => {
                  setOptionsVisible(!optionsVisible);
                }}
              >
                <EllipsisOutlined />
              </Icon>
            )}
            {optionsVisible && (
              <Column
                style={{
                  backgroundColor: colors.black,
                  width: 180,
                  position: 'absolute',
                  right: 0,
                  padding: 5,
                  zIndex: 10
                }}
              >
                <Column>
                  <Column classname="column-select">
                    <Row
                      onClick={() => {
                        navigate('CreateAccountScreen');
                      }}
                    >
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
                      }}
                    >
                      <SearchOutlined />
                      <Text text={t('Discover address')} size="sm" />
                    </Row>
                  </Column>
                  {keyring.addressType != undefined && keyring.addressType !== AddressType.KASPA_TANGEM_44_111111 && (
                    <Column classname="column-select">
                      <Row
                        onClick={() => {
                          setOptionsVisible(false);
                          compound();
                          // copyToClipboard(account.address);
                        }}
                      >
                        <MergeCellsOutlined />
                        <Text text="Compound" size="sm" />
                      </Row>
                    </Column>
                  )}
                </Column>
              </Column>
            )}
          </Column>
        }
      />
      {(loading || isLoadingBalances) && (
        <Row justifyCenter>
          <Icon>
            <LoadingOutlined />
          </Icon>
        </Row>
      )}
      <Content style={{ gap: '2px' }}>
        {keyring.balanceKas > 0 && keyring.accounts.length > 1 && (
          <Row justifyBetween itemsCenter>
            <Text text={`${formatLocaleString(keyring.balanceKas)} ${kasTick}`} preset="sub" />
          </Row>
        )}
        <VirtualList
          data={items}
          data-id="list"
          itemHeight={30}
          itemKey={(item) => item.key}
          style={{
            boxSizing: 'border-box'
          }}
        >
          {(item, index) => <ForwardMyItem account={item.account} autoNav={true} key={index} />}
        </VirtualList>
      </Content>
    </Layout>
  );
}
