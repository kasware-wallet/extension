import type { IKRC20TokenInfo, IKRC20TokenInfoIssue, Inscription } from '@/shared/types';
import { Column } from '@/ui/components';
import { TokenOnChainInfo } from './TokenOnChainInfo';
import { TokenSocialInfo } from './TokenSocialInfo';

interface TokenInfoProps {
  tokenInfo: IKRC20TokenInfo | IKRC20TokenInfoIssue | undefined | null;
  tokenPrice: number;
  krc20Token: Inscription;
}

export function TokenInfo({ tokenInfo, tokenPrice, krc20Token }: TokenInfoProps) {
  return (
    <Column gap="zero">
      <TokenSocialInfo krc20Token={krc20Token} />
      <TokenOnChainInfo tokenInfo={tokenInfo} tokenPrice={tokenPrice} />
    </Column>
  );
}
