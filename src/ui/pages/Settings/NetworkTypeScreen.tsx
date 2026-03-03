import log from 'loglevel';
import VirtualList from 'rc-virtual-list';
import { forwardRef, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { NETWORK_TYPES } from '@/shared/constant';
import type { INetworkType } from '@/shared/types';
import { Card, Column, Content, Header, Icon, Layout, Row, Text } from '@/ui/components';
import { useTools } from '@/ui/components/ActionComponent';
import { useReloadAccounts } from '@/ui/state/accounts/hooks';
import { useRpcStatus } from '@/ui/state/global/hooks';
import { useAppSelector } from '@/ui/state/hooks';
import { useChangeNetworkTypeCallback, useRpcLinks } from '@/ui/state/settings/hooks';
import { selectNetworkId } from '@/ui/state/settings/reducer';
import { colors } from '@/ui/theme/colors';
import { fontSizes } from '@/ui/theme/font';
import { useWallet } from '@/ui/utils';
import { CheckCircleFilled, LoadingOutlined, SettingOutlined } from '@ant-design/icons';

import { useNavigate } from '../MainRoute';
import { AHOOK_CACHE_KEY } from '@/ui/utils2/constants/constants';
import { selectCurrentAccount } from '@/ui/state/accounts/reducer';
import { clearCache } from 'ahooks';

export default function NetworkTypeScreen() {
  const networkId = useAppSelector(selectNetworkId);
  const wallet = useWallet();
  const rpcStatus = useRpcStatus();
  const currentRpcLinks = useRpcLinks();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const itemMainnet = useMemo(() => {
    const res = currentRpcLinks['mainnet'];
    if (res) {
      return res;
    }
    return NETWORK_TYPES['mainnet'];
  }, [currentRpcLinks]);
  const itemTest12 = useMemo(() => {
    const res = currentRpcLinks['testnet-12'];
    if (res) {
      return res;
    }
    return NETWORK_TYPES['testnet-12'];
  }, [currentRpcLinks]);
  const itemTest11 = useMemo(() => {
    const res = currentRpcLinks['testnet-11'];
    if (res) {
      return res;
    }
    return NETWORK_TYPES['testnet-11'];
  }, [currentRpcLinks]);
  const itemTest10 = useMemo(() => {
    const res = currentRpcLinks['testnet-10'];
    if (res) {
      return res;
    }
    return NETWORK_TYPES['testnet-10'];
  }, [currentRpcLinks]);
  const itemDevnet = useMemo(() => {
    const res = currentRpcLinks['devnet'];
    if (res) {
      return res;
    }
    return NETWORK_TYPES['devnet'];
  }, [currentRpcLinks]);
  const ForwardMyItem = forwardRef(MyItem);
  const [rpcUrl, setRpcUrl] = useState<string | undefined>('');
  useEffect(() => {
    wallet
      .getRpcUrl()
      .then((res) => {
        setRpcUrl(res);
      })
      .catch((err) => {
        log.debug(err);
      });
  }, [rpcStatus, wallet]);
  return (
    <Layout>
      <Header
        onBack={() => {
          window.history.go(-1);
        }}
        title={t('Switch Network')}
      />
      <Content>
        <Column>
          <Row justifyCenter>
            {loading && (
              <Icon>
                <LoadingOutlined
                  style={{
                    fontSize: fontSizes.icon,
                    color: colors.grey
                  }}
                />
              </Icon>
            )}
          </Row>
        </Column>
        <VirtualList
          // data={items}
          data={[itemMainnet, itemTest10, itemTest11, itemDevnet]}
          data-id="list"
          itemHeight={30}
          itemKey={(item) => item.id}
          // disabled={animating}
          style={{
            boxSizing: 'border-box'
          }}
          // onSkipRender={onAppear}
          // onItemRemove={onAppear}
        >
          {(item) => <ForwardMyItem networkId={networkId} item={item} setLoading={setLoading} rpcUrl={rpcUrl} />}
        </VirtualList>
      </Content>
    </Layout>
  );
}
interface MyItemProps {
  item: INetworkType;
  networkId: string;
  setLoading: (loading: boolean) => void;
  rpcUrl: string | undefined;
}
function MyItem({ item, networkId, setLoading, rpcUrl }: MyItemProps, _ref) {
  const navigate = useNavigate();
  const selected = networkId === item.id;
  const currentAccount = useAppSelector(selectCurrentAccount);
  const cacheKey = AHOOK_CACHE_KEY.PREFIX_CustomTestnetTokenList + currentAccount?.evmAddress;
  const tools = useTools();
  const changeNetworkType = useChangeNetworkTypeCallback();
  const reloadAccounts = useReloadAccounts();
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
            if (networkId == item.id) {
              return;
            }
            clearCache(cacheKey);
            setLoading(true);
            await changeNetworkType(item.value, item.id);
            await reloadAccounts();
            navigate('WalletTabScreen');
            tools.toastSuccess('Network type changed');
          }}
        >
          <Column style={{ width: 20 }} selfItemsCenter>
            {selected && (
              <Icon>
                <CheckCircleFilled />
              </Icon>
            )}
          </Column>
          <Column>
            <Row justifyBetween>
              <Text text={`${item.label}`} />
            </Row>
            <Text
              text={selected ? rpcUrl : item.url}
              preset="sub"
              style={{ overflowWrap: 'break-word', wordBreak: 'break-all' }}
            />
          </Column>
        </Row>
      </Card>
      <Card
        onClick={() => {
          navigate('EditNetworkUrlScreen', { item, networkId: item.id });
        }}
        classname="card-select"
        mt="md"
        style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
      >
        <Column style={{ width: 20 }} selfItemsCenter>
          <Icon>
            <SettingOutlined />
          </Icon>
        </Column>
      </Card>
    </Row>
  );
}
