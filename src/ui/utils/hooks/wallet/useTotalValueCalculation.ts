import { useAccountBalance } from '@/ui/state/accounts/hooks';
import { KaspaToken, Token } from '@/ui/utils2/interfaces';
import { useEffect } from 'react';
import { formatNumberWithDecimal } from '../..';

type TotalValueChangeCallback = (value: number) => void;

export const useTotalValueCalculation = (
  tokens: (Token | KaspaToken)[],
  price: number,
  onTotalValueChange: TotalValueChangeCallback
) => {
  const accountBalance = useAccountBalance();

  useEffect(() => {
    const kaspaValue = (Number(accountBalance.amount) ?? 0) * price;

    const totalValue = tokens.reduce((acc, token) => {
      const tokenBalance = formatNumberWithDecimal(token.balance, token.dec);
      const tokenValue = (token.floorPrice ?? 0) * tokenBalance;
      return acc + tokenValue;
    }, kaspaValue);

    onTotalValueChange(totalValue);
  }, [tokens, price, onTotalValueChange]);
};
