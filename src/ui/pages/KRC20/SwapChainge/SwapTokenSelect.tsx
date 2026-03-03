import React, { useEffect, useMemo, useState } from 'react';

import type { IChaingeToken, IKnotMemeToken, Inscription } from '@/shared/types';
import { Column, Row } from '@/ui/components';
import SearchBar from '@/ui/components/search/SearchBar';
import { selectAccountBalance, selectAccountInscriptions } from '@/ui/state/accounts/reducer';
import { useAppSelector } from '@/ui/state/hooks';
import type { IChaingeTokenWithBalance } from '@/ui/state/transactions/chainge/useChaingeTokens';
import { useRanks } from '@/ui/utils/hooks/kas-fyi/useRanks';

import SwapTokenListItem from './SwapTokenListItem';
import { amountToSompi } from '@/shared/utils/format';

interface SwapTokenSelectProps {
  tokens?: IKnotMemeToken[];

  onSelectToken: (token: IChaingeToken) => void;
}

const SwapTokenSelect: React.FC<SwapTokenSelectProps> = ({ tokens = [], onSelectToken }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredTokens, setFilteredTokens] = useState<IChaingeTokenWithBalance[]>([]);
  const accountBalance = useAppSelector((s) => selectAccountBalance(s, undefined));
  const accountInscriptions = useAppSelector(selectAccountInscriptions);

  const symbols = tokens.map((token) => token.ticker).filter((symbol) => symbol !== 'KAS' && symbol !== 'CUSDT');

  const rankQuery = useRanks(symbols);

  const itemData = useMemo(() => {
    if (rankQuery.data) {
      const sortedTokens = [
        ...tokens.filter((token) => token.ticker === 'KAS'),
        ...tokens.filter((token) => token.ticker === 'CUSDT'),
        ...tokens
          .filter((token) => rankQuery.data[token.ticker])
          .sort((a, b) => rankQuery.data[a.ticker].rank - rankQuery.data[b.ticker].rank)
      ];

      const res = addBalance(sortedTokens, accountInscriptions?.list, amountToSompi(accountBalance?.amount, 8));
      return res;
    } else {
      const res = addBalance(tokens, accountInscriptions?.list, amountToSompi(accountBalance?.amount, 8));
      return res;
    }
  }, [rankQuery.data, tokens, accountInscriptions?.list.length, accountBalance?.amount]);

  const handleSearch = (_searchTerm: string) => {
    setSearchTerm(_searchTerm);
  };

  useEffect(() => {
    const filtered = itemData.filter((token) => token.ticker.toLowerCase().includes(searchTerm.toLowerCase()));
    setFilteredTokens(filtered);
  }, [searchTerm, itemData]);

  //TODO show a loading UI while getting ranks
  //TODO show token balances in list
  return (
    <Column>
      <SearchBar onSearch={handleSearch} />

      {filteredTokens.length > 0 ? (
        <div>
          {filteredTokens.map((token: IChaingeTokenWithBalance) => (
            <Row
              fullX
              key={token.ticker || token.id}
              onClick={() => onSelectToken(token)}
              // className="w-full text-left transition-colors hover:cursor-pointer rounded-lg"
            >
              <SwapTokenListItem token={token} />
            </Row>
          ))}
        </div>
      ) : (
        <p className="text-mutedtext text-base text-center">
          {searchTerm.toUpperCase() + ' is not supported for swapping in KasWare Wallet'}
        </p>
      )}
    </Column>
  );
};

function addBalance(tokens: IKnotMemeToken[], list: Inscription[], kasBalance: string): IChaingeTokenWithBalance[] {
  const sortedTokens1 = tokens
    .filter((token) => token.ticker === 'KAS')
    .map((token) => {
      return {
        ...token,
        balance: kasBalance,
        priceInKas: 1,
        decimals: 8
      };
    });
  const sortedTokens2 = tokens
    .filter((token) => {
      const index = list.findIndex((item) => item?.tick.toUpperCase() == token.ticker.toUpperCase());
      return index !== -1;
    })
    .map((token) => {
      const index = list.findIndex((item) => item?.tick.toUpperCase() == token.ticker.toUpperCase());
      return {
        ...token,
        balance: list[index].balance,
        priceInKas: list[index].priceInKas,
        decimals: Number(list[index].dec)
      };
    });
  const sortedTokens3 = tokens
    .filter((token) => {
      if (token.ticker === 'KAS') return false;
      const index = list.findIndex((item) => item.tick.toUpperCase() == token.ticker.toUpperCase());
      return index == -1;
    })
    .map((token) => {
      return {
        ...token,
        balance: '0',
        priceInKas: 0,
        decimals: 8
      };
    });

  return [...sortedTokens1, ...sortedTokens2, ...sortedTokens3];
}

export default SwapTokenSelect;
