import BigNumber from 'bignumber.js';
import { useEffect, useMemo, useState } from 'react';

import type { IKRC20TokenInfo, IKRC20TokenInfoIssue } from '@/shared/types';
import { Icon, Row, Text } from '@/ui/components';
import { MiddleCard, StartCard, EndCard } from '@/ui/components/Card';
import { useAppSelector } from '@/ui/state/hooks';
import { selectBlockstreamUrl, selectNetworkId } from '@/ui/state/settings/reducer';
import { fontSizes } from '@/ui/theme/font';
import { formatLocaleString, shortAddress } from '@/ui/utils';
import { useKrc20TokenBalanceQuery } from '@/ui/hooks/kasplex';
import { sompiToAmount } from '@/shared/utils/format';
import { BURN_ADDRESS_DESHE } from '@/shared/constant/kasplex';

interface TokenOnChainInfoProps {
  tokenInfo: IKRC20TokenInfo | IKRC20TokenInfoIssue | undefined | null;
  tokenPrice: number;
}

interface TokenInfoItem {
  name: string;
  value: string | number;
}

export function TokenOnChainInfo({ tokenInfo, tokenPrice }: TokenOnChainInfoProps) {
  const [tokenTick, setTokenTick] = useState<string | undefined>(undefined);
  const [tokenName, setTokenName] = useState<string | undefined>(undefined);
  const [tokenCa, setTokenCa] = useState<string | undefined>(undefined);
  const [revealTx, setRevealTx] = useState('');
  const kasNetworkId = useAppSelector(selectNetworkId);

  const blockstreamUrl = useAppSelector(selectBlockstreamUrl);
  const [infoArray, setInfoArray] = useState<TokenInfoItem[]>([]);

  const { tokenBalance: burnedTokenBalance } = useKrc20TokenBalanceQuery(
    kasNetworkId,
    BURN_ADDRESS_DESHE,
    tokenInfo?.mod == 'issue'
      ? (tokenInfo as IKRC20TokenInfoIssue)?.ca
      : (tokenInfo as IKRC20TokenInfo)?.tick?.toLowerCase(),
    kasNetworkId == 'mainnet'
  );

  const balanceValue = useMemo(() => {
    if (burnedTokenBalance !== null) return sompiToAmount(burnedTokenBalance.balance, burnedTokenBalance.dec);
    return '0';
  }, [burnedTokenBalance]);

  useEffect(() => {
    if (tokenInfo) {
      if ((tokenInfo as IKRC20TokenInfo).tick) setTokenTick((tokenInfo as IKRC20TokenInfo).tick);
      if ((tokenInfo as IKRC20TokenInfoIssue).name) setTokenName((tokenInfo as IKRC20TokenInfoIssue).name);
      if ((tokenInfo as IKRC20TokenInfoIssue).ca) setTokenCa((tokenInfo as IKRC20TokenInfoIssue).ca);

      setRevealTx(tokenInfo.hashRev);
      const infoA: TokenInfoItem[] = [];
      let maxBN = new BigNumber(0);
      let mintedBN = new BigNumber(0);
      let preBN = new BigNumber(0);

      infoA.push({
        name: 'Price',
        value:
          tokenPrice == 0
            ? '-'
            : tokenPrice >= 0.001
            ? '$' + tokenPrice.toLocaleString('en-US')
            : '$' + tokenPrice.toString()
      });

      if (tokenInfo.dec) {
        infoA.push({
          name: 'Decimal',
          value: tokenInfo.dec
        });
      }

      if (tokenInfo?.mod) {
        infoA.push({
          name: 'Mod',
          value: tokenInfo.mod
        });
      }

      let dec = tokenInfo?.dec;
      if (dec == undefined || Number(dec) <= 0) {
        dec = '8';
      }

      if (tokenInfo.max) {
        maxBN = new BigNumber(tokenInfo.max).dividedBy(Math.pow(10, Number(dec)));
        infoA.push({
          name: 'Max Supply',
          value: formatLocaleString(maxBN)
        });
      }

      if (tokenInfo.minted) {
        mintedBN = new BigNumber(tokenInfo.minted).dividedBy(Math.pow(10, Number(dec)));
        infoA.push({
          name: 'Minted Amount',
          value: formatLocaleString(mintedBN)
        });
      }

      if (tokenInfo.burned) {
        mintedBN = new BigNumber(tokenInfo.burned).dividedBy(Math.pow(10, Number(dec))).plus(balanceValue);
        infoA.push({
          name: 'Burned Amount',
          value: formatLocaleString(mintedBN)
        });
      }

      if (tokenInfo.pre) {
        preBN = new BigNumber(tokenInfo.pre).dividedBy(Math.pow(10, Number(dec)));
        infoA.push({
          name: 'Pre-Allocation Amount',
          value: formatLocaleString(preBN)
        });
      }

      if (tokenInfo.holderTotal) {
        preBN = new BigNumber(tokenInfo.holderTotal);
        infoA.push({
          name: 'Total Holders',
          value: formatLocaleString(preBN)
        });
      }

      if (tokenInfo.transferTotal) {
        preBN = new BigNumber(tokenInfo.transferTotal);
        infoA.push({
          name: 'Total Transfer Times',
          value: formatLocaleString(preBN)
        });
      }

      if (tokenInfo.mintTotal) {
        preBN = new BigNumber(tokenInfo.mintTotal);
        infoA.push({
          name: 'Total Mint Times',
          value: formatLocaleString(preBN)
        });
      }

      if (tokenInfo.opScoreAdd) {
        infoA.push({
          name: 'opScoreAdd',
          value: tokenInfo.opScoreAdd
        });
      }

      if (tokenInfo.opScoreMod) {
        infoA.push({
          name: 'opScoreMod',
          value: tokenInfo.opScoreMod
        });
      }

      if (tokenInfo.state) {
        if (tokenInfo.state == 'finished') {
          infoA.push({
            name: 'State',
            value: '100% Minted'
          });
        } else if (tokenInfo.state == 'deployed' && maxBN.isGreaterThan(0)) {
          const percent = Number(mintedBN.dividedBy(maxBN)) * 100;
          infoA.push({
            name: 'State',
            value: `${percent.toLocaleString()}% Minted`
          });
        } else {
          infoA.push({
            name: 'State',
            value: tokenInfo.state
          });
        }
      }

      if ((tokenInfo as IKRC20TokenInfo)?.daas && (tokenInfo as IKRC20TokenInfo)?.daae) {
        const daas = Number((tokenInfo as IKRC20TokenInfo).daas).toLocaleString();
        const daae = Number((tokenInfo as IKRC20TokenInfo).daae).toLocaleString();
        infoA.push({
          name: 'DAA Scope',
          value: daas + '~' + daae
        });
      }

      setInfoArray(infoA);
    }
  }, [tokenInfo, tokenPrice, balanceValue]);

  return (
    <>
      {tokenTick !== undefined && (
        <StartCard>
          <Row justifyBetween full itemsCenter py="sm">
            <Text text="Tick" preset="sub" />
            <Text text={tokenTick} selectText />
          </Row>
        </StartCard>
      )}
      {tokenName !== undefined && (
        <StartCard>
          <Row justifyBetween full itemsCenter py="sm">
            <Text text="Name" preset="sub" />
            <Text text={tokenName} selectText />
          </Row>
        </StartCard>
      )}
      {tokenCa !== undefined && (
        <MiddleCard>
          <Row justifyBetween full itemsCenter py="sm">
            <Text text="Contract" preset="sub" />
            <Row
              gap="xxs"
              itemsCenter
              onClick={() => {
                window.open(`${blockstreamUrl}/transactions/${tokenCa}`);
              }}
            >
              <Text preset="link" text={shortAddress(tokenCa, 12)} />
              <Icon icon="link" size={fontSizes.xxs} color="blue" />
            </Row>
          </Row>
        </MiddleCard>
      )}
      {infoArray &&
        infoArray.length > 0 &&
        infoArray.map((info, index) => (
          <MiddleCard key={index}>
            <Row justifyBetween full itemsCenter py="sm">
              <Text text={info.name} preset="sub" selectText />
              <Text text={info.value} selectText />
            </Row>
          </MiddleCard>
        ))}

      <EndCard>
        <Row justifyBetween full itemsCenter>
          <Text text="Reveal TX" preset="sub" />
          <Row
            gap="xxs"
            itemsCenter
            onClick={() => {
              window.open(`${blockstreamUrl}/transactions/${revealTx}`);
            }}
          >
            <Text preset="link" text={shortAddress(revealTx, 12)} />
            <Icon icon="link" size={fontSizes.xxs} color="blue" />
          </Row>
        </Row>
      </EndCard>
    </>
  );
}
