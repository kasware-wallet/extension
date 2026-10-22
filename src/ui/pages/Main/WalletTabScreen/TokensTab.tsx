import type { Inscription, TTokenType } from '@/shared/types';
import { NetworkType, TokensTabKey } from '@/shared/types';
import { Card, Column, LoadingSpinner, Row, Text } from '@/ui/components';
import { ProfileImage } from '@/ui/components/CryptoImage';
import { Segmented } from 'antd';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/ui/components/Button';

import SearchBar from '@/ui/components/search/SearchBar';

import { useFetchInscriptionsQuery } from '@/ui/state/accounts/hooks';
import { selectAccountBalance, selectAccountInscriptions } from '@/ui/state/accounts/reducer';

import { useAppDispatch, useAppSelector } from '@/ui/state/hooks';

import { selectKasTick, selectNetworkId, selectNetworkType } from '@/ui/state/settings/reducer';

import kaspaIcon from '@/assets/icons/kaspa.svg';
import { amountToSompi, sompiToAmount } from '@/shared/utils/format';
import { useKRC20TokenIntro } from '@/ui/state/ui/hooks';
import { selectTokensTabKey, uiActions } from '@/ui/state/ui/reducer';
import { formatLocaleString, getUsdValueStr, shortAddress } from '@/ui/utils';
import { useKrc20DecName } from '@/ui/utils/hooks/kasplex/fetchKrc20AddressTokenList';
import { useKaspaPrice } from '@/ui/utils/hooks/price/usePrice';
import { useNavigate } from '../../MainRoute';

export default function TokensTab() {
  const currentNetworkType = useAppSelector(selectNetworkType);
  const dispatch = useAppDispatch();
  const tokensTabKey = useAppSelector(selectTokensTabKey);
  // Devnet and simnet are local development networks with no Kasplex indexer.
  // Only the native KAS coin is shown and sendable.
  if (currentNetworkType === NetworkType.Devnet || currentNetworkType === NetworkType.Simnet) {
    return <KaspaOnlyTokenView />;
  }
  if (currentNetworkType !== NetworkType.Mainnet && currentNetworkType !== NetworkType.Testnet) {
    return (
      <Row justifyCenter>
        <Text text="Not Supported." mt="md" />
      </Row>
    );
  }
  return (
    <>
      <Row justifyEnd>
        <Segmented
          size="middle"
          defaultValue={tokensTabKey}
          onChange={(value) => {
            dispatch(uiActions.updateTokensTab({ tokensTabKey: value as TokensTabKey }));
          }}
          options={[TokensTabKey.KASPA]}
          style={{ fontSize: '1rem' }}
        />
      </Row>
      {tokensTabKey === TokensTabKey.KASPA && <KRC20Tab />}
    </>
  );
}
/**
 * KAS-only token view for devnet/simnet.
 *
 * These networks run a local node with no Kasplex indexer, so the only asset
 * the wallet can display and transfer is the native KAS coin. The regular
 * KRC20Tab pulls KRC20 inscriptions from an indexer that does not exist here,
 * so it renders a single KAS balance card instead.
 */
function KaspaOnlyTokenView() {
  const accountBalance = useAppSelector((s) => selectAccountBalance(s, undefined));
  const kasTick = useAppSelector(selectKasTick);

  const kaspaItem = useMemo(
    () => ({
      tokenType: 'KAS' as TTokenType,
      tick: kasTick,
      priceInKas: 1,
      balance: amountToSompi(accountBalance?.amount, 8),
      locked: '0',
      dec: '8',
      opScoreMod: '0'
    }),
    [accountBalance?.amount, kasTick]
  );

  if (!kaspaItem.tick) return null;

  return (
    <div>
      <KRC20Card inscription={kaspaItem} key="kaspa" />
    </div>
  );
}

function KRC20Tab() {
  const accountInscriptions = useAppSelector(selectAccountInscriptions);
  const [inputText, setInputText] = useState('');
  const accountBalance = useAppSelector((s) => selectAccountBalance(s, undefined));
  const kasTick = useAppSelector(selectKasTick);
  const { refetch, isLoading, error } = useFetchInscriptionsQuery();

  const displayedItems = useMemo(() => {
    const kasItem = {
      tokenType: 'KAS' as TTokenType,
      tick: kasTick,
      priceInKas: 1,
      balance: amountToSompi(accountBalance?.amount, 8),
      locked: '0',
      dec: '8',
      opScoreMod: '0'
    };
    const tempItems = simpleFuzzySearch([kasItem, ...accountInscriptions.list], inputText);
    return tempItems;
  }, [inputText, accountInscriptions.list, accountBalance?.amount, kasTick]);
  if (isLoading) {
    return (
      <>
        {displayedItems.map((e, index) => (
          <KRC20Card inscription={e} key={e?.tick + (e?.ca as string) || 'default-key-' + index} />
        ))}
        <div>
          <Row justifyCenter mt="lg">
            <LoadingSpinner size="medium" />
          </Row>
        </div>
      </>
    );
  } else if (accountInscriptions && accountInscriptions.list.length > 0) {
    return (
      <div>
        {accountInscriptions.list.length > 5 && <SearchBar onSearch={setInputText} autoFocus={true} />}
        {displayedItems.map((e, index) => (
          <KRC20Card inscription={e} key={e?.tick || 'default-key-' + index} />
        ))}
      </div>
    );
  } else if (error) {
    return (
      <>
        {displayedItems.map((e, index) => (
          <KRC20Card inscription={e} key={e?.tick || 'default-key-' + index} />
        ))}
        <Column justifyCenter>
          <Text text={error?.message} textCenter preset="sub" color="textDim" selectText mt="xl" />
          <Row justifyCenter>
            <Button
              text="Retry"
              preset="default"
              onClick={() => {
                refetch();
              }}
            />
          </Row>
        </Column>
      </>
    );
  } else {
    return (
      <>
        {displayedItems.map((e, index) => (
          <KRC20Card inscription={e} key={e?.tick || 'default-key-' + index} />
        ))}
      </>
    );
  }
}

function KRC20Card({ inscription }: { inscription: Inscription }) {
  if (inscription.tokenType === 'KRC20Issue') return <KRC20CardForIssueMod inscription={inscription} />;
  return <KRC20CardForMintMod inscription={inscription} />;
}

function KRC20CardForMintMod({ inscription }: { inscription: Inscription }) {
  const navigate = useNavigate();
  const krc20TokenIntro = useKRC20TokenIntro();
  const kasPrice = useKaspaPrice();
  const kasTick = useAppSelector(selectKasTick);
  const [usdValueStr, setUsdValueStr] = useState<string>('-');
  const logoUrl = useMemo(() => {
    if (inscription?.tick == kasTick) return kaspaIcon;
    const lowTick = inscription?.tick?.toLowerCase() as string;
    if (krc20TokenIntro[lowTick] && krc20TokenIntro[lowTick]?.logo) return krc20TokenIntro[lowTick]?.logo;
  }, [inscription?.tick, krc20TokenIntro, kasTick]);
  const content = useMemo(() => {
    if (inscription?.tokenType === 'KAS') return 'kaspa';
    return 'KRC20: ' + inscription.tick?.toLowerCase();
  }, [inscription?.tick, inscription?.tokenType]);
  const totalFormattedAmount = useMemo(() => {
    const sompiAmt = BigInt(inscription?.balance) + BigInt(inscription?.locked);
    return formatLocaleString(sompiToAmount(sompiAmt, inscription.dec));
  }, [inscription?.balance, inscription?.locked, inscription.dec]);
  useEffect(() => {
    const priceInKas = inscription?.priceInKas ?? 0;
    const price = priceInKas * kasPrice;
    const sompiAmt = BigInt(inscription?.balance) + BigInt(inscription?.locked);
    const amt = sompiToAmount(sompiAmt, inscription.dec);
    const res = getUsdValueStr(price, amt);
    setUsdValueStr(res);
  }, [inscription, kasPrice]);

  return (
    <Row full justifyBetween selfItemsCenter style={{ gap: 2 }}>
      <Card classname="card-select" full justifyBetween mt="sm">
        <Row
          full
          onClick={() => {
            if (inscription?.tokenType === 'KAS') {
              navigate('KaspaTokenScreen', { krc20Token: inscription, logoUrl });
            } else {
              navigate('KRC20TokenScreen', {
                krc20Token: inscription,
                logoUrl
              });
            }
          }}
        >
          <Column style={{ width: 40 }} selfItemsCenter>
            <ProfileImage size={40} ticker={inscription.tick} tokenType={inscription.tokenType} ca={inscription.ca} />
          </Column>
          <Column full>
            <BalanceRow tick={inscription.tick as string} totalFormattedAmount={totalFormattedAmount} />
            <Row justifyBetween>
              <Text text={content} preset="sub" />
              <Text text={usdValueStr} preset="sub" />
            </Row>
          </Column>
        </Row>
      </Card>
    </Row>
  );
}

function KRC20CardForIssueMod({ inscription }: { inscription: Inscription }) {
  const navigate = useNavigate();
  const krc20TokenIntro = useKRC20TokenIntro();
  const kasPrice = useKaspaPrice();
  const kasNetworkId = useAppSelector(selectNetworkId);
  const [usdValueStr, setUsdValueStr] = useState<string>('-');

  const { name } = useKrc20DecName(kasNetworkId, (inscription.tick as string) || (inscription.ca as string));
  const content = useMemo(() => 'KRC20: ' + shortAddress(inscription.ca), [inscription.ca]);
  const totalFormattedAmount = useMemo(() => {
    const sompiAmt = BigInt(inscription?.balance) + BigInt(inscription?.locked);
    return formatLocaleString(sompiToAmount(sompiAmt, inscription.dec));
  }, [inscription?.balance, inscription?.locked, inscription.dec]);

  const [tick, setTick] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (name) {
      setTick(name);
    } else {
      setTick(shortAddress(inscription.ca, 3));
    }
  }, [name, inscription.ca]);
  useEffect(() => {
    const priceInKas = inscription?.priceInKas ?? 0;
    const price = priceInKas * kasPrice;
    const sompiAmt = BigInt(inscription?.balance) + BigInt(inscription?.locked);
    const amt = sompiToAmount(sompiAmt, inscription.dec);
    const res = getUsdValueStr(price, amt);
    setUsdValueStr(res);
  }, [inscription, kasPrice]);

  return (
    <Row full justifyBetween selfItemsCenter style={{ gap: 2 }}>
      <Card classname="card-select" full justifyBetween mt="sm">
        <Row
          full
          onClick={() => {
            navigate('KRC20TokenScreen', {
              krc20Token: inscription,
            });
          }}
        >
          <Column style={{ width: 40 }} selfItemsCenter>
            <ProfileImage size={40} ticker={inscription.tick} tokenType={inscription.tokenType} ca={inscription.ca} />
          </Column>
          <Column full>
            <Row justifyBetween>
              <Text text={tick} />
              <Text text={totalFormattedAmount} style={{ paddingRight: 5, wordWrap: 'normal' }} preset="regular" />
            </Row>
            <Row justifyBetween>
              <Text text={content} preset="sub" />
              <Text text={usdValueStr} preset="sub" />
            </Row>
          </Column>
        </Row>
      </Card>
    </Row>
  );
}

function simpleFuzzySearch(items: Inscription[], searchTerm: string) {
  const searchTermLowerCase = searchTerm?.toLowerCase();
  const regex = new RegExp(searchTermLowerCase.split('').join('.*'), 'i');
  return items.filter((item) => item.tick && regex.test(item?.tick?.toLowerCase()));
}

function BalanceRow({ tick, totalFormattedAmount }: { tick: string; totalFormattedAmount: string }) {
  return (
    <Row justifyBetween>
      <Text text={tick} />
      <Text text={totalFormattedAmount} style={{ paddingRight: 5, wordWrap: 'normal' }} preset="regular" />
    </Row>
  );
}
