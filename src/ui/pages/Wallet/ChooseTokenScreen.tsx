import VirtualList from 'rc-virtual-list';
import { forwardRef, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { Inscription } from '@/shared/types';
import { TxType } from '@/shared/types';
import { Card, Column, Content, Header, Icon, Layout, Row, Text } from '@/ui/components';
import { ProfileImage } from '@/ui/components/CryptoImage';
import SearchBar from '@/ui/components/search/SearchBar';
import { useFetchInscriptionsQuery } from '@/ui/state/accounts/hooks';
import { selectAccountBalance, selectAccountInscriptions } from '@/ui/state/accounts/reducer';
import { useAppSelector } from '@/ui/state/hooks';
import { selectKasTick, selectNetworkId } from '@/ui/state/settings/reducer';
import { useUpdateUiTxCreateScreen } from '@/ui/state/ui/hooks';
import { formatLocaleString, getUsdValueStr, shortAddress, useLocationState } from '@/ui/utils';
import { useKrc20DecName } from '@/ui/utils/hooks/kasplex/fetchKrc20AddressTokenList';
import { useKaspaPrice } from '@/ui/utils/hooks/price/usePrice';
import { LoadingOutlined } from '@ant-design/icons';

import { useNavigate } from '../MainRoute';
import { amountToSompi, sompiToAmount } from '@/shared/utils/format';

export interface ItemData {
  key: string;
  item: Inscription;
}
interface LocationState {
  source: string;
}

interface MyItemProps {
  item: Inscription;
  autoNav?: boolean;
  source: string;
}

export function MyItem({ item, autoNav, source }: MyItemProps, ref) {
  const kasTick = useAppSelector(selectKasTick);
  const setUiState = useUpdateUiTxCreateScreen();
  const kasNetworkId = useAppSelector(selectNetworkId);
  const navigate = useNavigate();
  const kasPrice = useKaspaPrice();
  const [usdValueStr, setUsdValueStr] = useState<string>('-');
  const content = useMemo(() => {
    if (item.tokenType == 'KAS') return 'Kaspa';
    if (item.tokenType == 'KRC20Mint') return 'KRC20: ' + (item.tick as string).toLowerCase();
    if (item.tokenType == 'KRC20Issue') return 'KRC20: ' + shortAddress(item.ca);
  }, [item.ca, item.tick, item.tokenType]);

  const { name } = useKrc20DecName(kasNetworkId, (item.tick as string) || (item.ca as string));
  const handleConfirm = () => {
    if (source === 'TxCreateScreen') {
      if (autoNav)
        setUiState({
          tick: item?.tick,
          ca: item?.ca,
          decimals: item?.dec,
          type: item?.tick == kasTick ? TxType.SEND_KASPA : TxType.SIGN_KRC20_TRANSFER,
          tokenType: item.tokenType
        });
      navigate('TxCreateScreen');
    }
  };

  useEffect(() => {
    const price = kasPrice * item.priceInKas;
    const amt = sompiToAmount(BigInt(item?.balance), item.dec);
    const res = getUsdValueStr(price, amt);
    setUsdValueStr(res);
  }, [item, kasPrice]);

  if (!item) {
    return <div />;
  }
  return (
    <Row full justifyBetween selfItemsCenter style={{ gap: 2 }}>
      <Card classname="card-select" full justifyBetween mt="sm">
        <Row full onClick={handleConfirm}>
          <Column style={{ width: 40 }} selfItemsCenter>
            <ProfileImage size={40} ticker={item.tick} tokenType={item.tokenType} ca={item?.ca} />
          </Column>
          <Column full>
            <Row justifyBetween>
              <Text text={item.tokenType == 'KAS' ? kasTick : name} />
              <Text
                text={formatLocaleString(sompiToAmount(BigInt(item?.balance) ?? 0, item.dec))}
                style={{ paddingRight: 5, wordWrap: 'normal' }}
                preset="regular"
              />
            </Row>
            <Row justifyBetween>
              <Text text={content} preset="sub" />
              <Text text={usdValueStr} preset="sub" style={{ paddingRight: 5 }} />
            </Row>
          </Column>
        </Row>
      </Card>
    </Row>
  );
}

export default function ChooseTokenScreen() {
  const { source } = useLocationState<LocationState>();
  const { t } = useTranslation();
  const accountBalance = useAppSelector((s) => selectAccountBalance(s, undefined));
  const accountInscriptions = useAppSelector(selectAccountInscriptions);
  const { isLoading } = useFetchInscriptionsQuery();
  const kasTick = useAppSelector(selectKasTick);

  const [displayedItems, setDisplayedItems] = useState<ItemData[]>([]);
  const items = useMemo(() => {
    const _items: ItemData[] =
      accountInscriptions?.list.map((v) => {
        return {
          key: (v.tick as string) + v.ca,
          item: v
        };
      }) || [];

    _items.unshift({
      key: kasTick,
      item: {
        tokenType: 'KAS',
        tick: kasTick,
        dec: '8',
        balance: amountToSompi(accountBalance?.amount, 8),
        priceInKas: 1,
        locked: '0',
        opScoreMod: '0'
      }
    });
    return _items;
  }, [accountInscriptions?.list, kasTick, accountBalance?.amount]);
  const ForwardMyItem = forwardRef(MyItem);
  const [inputText, setInputText] = useState('');
  useEffect(() => {
    const tempItems = simpleFuzzySearch(items, inputText);
    setDisplayedItems(tempItems);
  }, [inputText, items]);

  // const handleOnKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
  //   if ('Enter' == e.key) {
  //     setInputText;
  //   }
  // };

  return (
    <Layout>
      <Header
        onBack={() => {
          window.history.go(-1);
        }}
        title={t('Choose Asset')}
      />
      <Content>
        <SearchBar onSearch={setInputText} autoFocus={true} />
        {isLoading && (
          <Row justifyCenter>
            <Icon>
              <LoadingOutlined />
            </Icon>
          </Row>
        )}
        <VirtualList
          data={displayedItems}
          data-id="list"
          itemHeight={30}
          itemKey={(item) => item.item.ca + (item.item.tick as unknown as string)}
          style={{
            boxSizing: 'border-box'
          }}
        >
          {(item, index) => <ForwardMyItem item={item.item} autoNav={true} key={index} source={source} />}
        </VirtualList>
      </Content>
    </Layout>
  );
}

function simpleFuzzySearch(items: ItemData[], searchTerm: string) {
  searchTerm = searchTerm?.toLowerCase();
  const regex = new RegExp(searchTerm.split('').join('.*'), 'i');

  return items.filter((item) => regex.test(item?.item?.tick?.toLowerCase() || ''));
}
