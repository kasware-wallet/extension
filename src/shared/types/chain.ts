import type { EVM_CHAINS_ENUM } from '../constant';

export interface TestnetChainBase {
  id: number;
  name: string;
  nativeTokenSymbol: string;
  nativeTokenLogo?: string;
  rpcUrl: string;
  scanLink?: string;
  logo?: string;
}

export interface TestnetChain extends TestnetChainBase {
  nativeTokenAddress: string;
  hex: string;
  network: string;
  enum: EVM_CHAINS_ENUM;
  serverId: string;
  nativeTokenLogo: string;
  eip: Record<string, unknown>;
  nativeTokenDecimals: number;
  scanLink: string;
  isTestnet?: boolean;
  whiteLogo?: string;
  needEstimateGas?: boolean;
  severity: number;
}
