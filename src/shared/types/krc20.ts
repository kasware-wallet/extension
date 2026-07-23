export interface TokenBalance {
  availableBalance: string;
  overallBalance: string;
  ticker: string;
  transferableBalance: string;
  availableBalanceSafe: string;
  availableBalanceUnSafe: string;
}

export interface TokenInfo {
  totalSupply: string;
  totalMinted: string;
}
export interface TokenTransfer {
  ticker: string;
  amount: string;
  timestamp: number;
}

export interface AddressTokenSummary {
  tokenInfo: TokenInfo;
  tokenBalance: TokenBalance;
  historyList: TokenTransfer[];
  transferableList: TokenTransfer[];
}

export interface IKRC20ByAddress {
  tick?: string;
  ca?: string;
  balance: string;
  locked: string;
  dec: string;
  opScoreMod: string;
}

type TKRC20State = 'unused' | 'deployed' | 'finished' | 'ignored' | 'reserved';
export interface IKRC20TokenInfo {
  tick: string;
  max: string;
  lim: string;
  pre: string;
  to: string;
  dec: string;
  mod: TKRC20Mode;
  daas: string;
  daae: string;
  minted: string;
  burned?: string;
  opScoreAdd: string;
  opScoreMod: string;
  state: TKRC20State;
  hashRev: string;
  holderTotal?: string;
  transferTotal?: string;
  mintTotal?: string;
}

export interface IKRC20TokenInfoIssue {
  ca: string;
  name: string;
  max: string;
  lim: string;
  pre: string;
  to: string;
  dec: string;
  mod: TKRC20Mode;
  minted: string;
  burned: string;
  opScoreAdd: string;
  opScoreMod: string;
  state: TKRC20State;
  hashRev: string;
  mtsAdd: string;
  holderTotal: string;
  transferTotal: string;
  mintTotal: string;
}

export type TKRC20Mode = 'issue' | 'mint';

export interface IKRC20TokenIntro {
  tick: string;
  name?: string;
  website?: string;
  logo?: string;
  desc?: string;
  twitter?: string;
  telegram?: string;
  discord?: string;
}

export type TRetrieveType = 'send' | 'list' | 'mint' | 'deploy' | 'transfer';
export interface IKRC20TokenPrice {
  ticker: string;
  price: {
    floorPrice: number;
  };
}
export interface IKRC20History {
  p: string;
  op: string;
  tick: string;
  amt: string;
  from: string;
  to: string;
  opScore: string;
  hashRev: string;
  feeRev: string;
  txAccept: string;
  opAccept: string;
  opError: string;
  checkpoint: string;
  mtsAdd: string;
  mtsMod: string;
  pre?: string;
}

export type TKRC20History =
  | IKRC20Deploy
  | IKRC20Burn
  | IKRC20Chown
  | IKRC20Transfer
  | IKRC20List
  | IKRC20Send
  | IKRC20Mint;
export type TKRC20HistoryIssue =
  | IKRC20DeployIssue
  | IKRC20BurnIssue
  | IKRC20ChownIssue
  | IKRC20TransferIssue
  | IKRC20ListIssue
  | IKRC20SendIssue
  | IKRC20Issue
  | IKRC20Blacklist;

export type TKasplexOp = 'deploy' | 'burn' | 'chown' | 'transfer' | 'list' | 'send' | 'mint' | 'issue' | 'blacklist';
// Common supported: deploy, burn, chown, transfer, list, send.

// In Deploy-Mint mode: mint.

// In Deploy-Issue mode: issue, blacklist.

export interface IKRC20Transfer {
  p: string;
  op: string;

  tick: string;
  amt: string;
  from: string;

  to: string;
  opScore: string;
  hashRev: string;
  feeRev: string;
  txAccept: string;
  opAccept: string;
  opError: string;
  checkpoint: string;
  mtsAdd: string;
  mtsMod: string;
}

export interface IKRC20TransferIssue {
  p: string;
  op: string;

  ca: string;
  amt: string;
  from: string;
  to: string;

  opScore: string;
  hashRev: string;
  feeRev: string;
  txAccept: string;
  opAccept: string;
  opError: string;
  checkpoint: string;
  mtsAdd: string;
  mtsMod: string;
}

export interface IKRC20List {
  p: string;
  op: string;

  tick: string;
  amt: string;
  from: string;
  utxo: string;

  opScore: string;
  hashRev: string;
  feeRev: string;
  txAccept: string;
  opAccept: string;
  opError: string;
  checkpoint: string;
  mtsAdd: string;
  mtsMod: string;
}
export interface IKRC20ListIssue {
  p: string;
  op: string;

  ca: string;
  amt: string;
  from: string;
  utxo: string;

  opScore: string;
  hashRev: string;
  feeRev: string;
  txAccept: string;
  opAccept: string;
  opError: string;
  checkpoint: string;
  mtsAdd: string;
  mtsMod: string;
}

export interface IKRC20Blacklist {
  p: string;
  op: string;

  ca: string;
  mod: 'add' | 'remove';
  from: string;
  to: string;
  name: string;

  opScore: string;
  hashRev: string;
  feeRev: string;
  txAccept: string;
  opAccept: string;
  opError: string;
  checkpoint: string;
  mtsAdd: string;
  mtsMod: string;
}
export interface IKRC20Issue {
  p: string;
  op: string;

  ca: string;
  amt: string;
  from: string;
  to: string;
  name: string;

  opScore: string;
  hashRev: string;
  feeRev: string;
  txAccept: string;
  opAccept: string;
  opError: string;
  checkpoint: string;
  mtsAdd: string;
  mtsMod: string;
}
export interface IKRC20SendIssue {
  p: string;
  op: string;

  ca: string;
  amt: string;
  from: string;
  to: string;
  price: string;

  opScore: string;
  hashRev: string;
  feeRev: string;
  txAccept: string;
  opAccept: string;
  opError: string;
  checkpoint: string;
  mtsAdd: string;
  mtsMod: string;
}

export interface IKRC20Send {
  p: string;
  op: string;

  tick: string;
  amt: string;
  from: string;
  to: string;
  price: string;

  opScore: string;
  hashRev: string;
  feeRev: string;
  txAccept: string;
  opAccept: string;
  opError: string;
  checkpoint: string;
  mtsAdd: string;
  mtsMod: string;
}
export interface IKRC20Mint {
  p: string;
  op: string;

  tick: string;
  amt: string;
  from: string;
  to: string;

  opScore: string;
  hashRev: string;
  feeRev: string;
  txAccept: string;
  opAccept: string;
  opError: string;
  checkpoint: string;
  mtsAdd: string;
  mtsMod: string;
}
export interface IKRC20Chown {
  p: string;
  op: string;

  tick: string;
  from: string;
  to: string;

  opScore: string;
  hashRev: string;
  feeRev: string;
  txAccept: string;
  opAccept: string;
  opError: string;
  checkpoint: string;
  mtsAdd: string;
  mtsMod: string;
}

export interface IKRC20DeployIssue {
  p: string;
  op: string;

  ca: string;
  max: string;
  pre: string;
  dec: string;
  from: string;
  to: string;

  opScore: string;
  hashRev: string;
  feeRev: string;
  txAccept: string;
  opAccept: string;
  opError: string;
  checkpoint: string;
  mtsAdd: string;
  mtsMod: string;
}

export interface IKRC20Deploy {
  p: string;
  op: string;

  tick: string;
  max: string;
  lim: string;
  pre: string;
  dec: string;
  from: string;
  to: string;

  opScore: string;
  hashRev: string;
  feeRev: string;
  txAccept: string;
  opAccept: string;
  opError: string;
  checkpoint: string;
  mtsAdd: string;
  mtsMod: string;
}

export interface IKRC20BurnIssue {
  p: string;
  op: string;

  ca: string;
  amt: string;
  from: string;
  name: string;

  opScore: string;
  hashRev: string;
  feeRev: string;
  txAccept: string;
  opAccept: string;
  opError: string;
  checkpoint: string;
  mtsAdd: string;
  mtsMod: string;
}
export interface IKRC20Burn {
  p: string;
  op: string;

  tick: string;
  amt: string;
  from: string;

  opScore: string;
  hashRev: string;
  feeRev: string;
  txAccept: string;
  opAccept: string;
  opError: string;
  checkpoint: string;
  mtsAdd: string;
  mtsMod: string;
}
export interface IKRC20ChownIssue {
  p: string;
  op: string;

  ca: string;
  from: string;
  to: string;

  opScore: string;
  hashRev: string;
  feeRev: string;
  txAccept: string;
  opAccept: string;
  opError: string;
  checkpoint: string;
  mtsAdd: string;
  mtsMod: string;
}

export interface IBatchTransfer {
  tick: string;
  dec?: string;
  to: string;
  amount: number | string;
}

export type TBatchTransferStatus = 'failed' | 'success';
export interface IBatchTransferResult {
  index: number;
  tick: string;
  to: string;
  amount: number | string;
  status: TBatchTransferStatus;
  errorMsg: string | undefined;
  txId: { commitId: string; revealId: string } | undefined;
}

export interface IToken {
  tick: string;
  decimals: string;
}

export type TProtocol = 'kasplex' | 'kns' | 'kspr';
interface OperationMappings {
  deploy: {
    tick: string;
    max: string;
    lim: string;
    to?: string;
    dec?: string;
    pre?: string;
  };
  mint: {
    tick: string;
    to?: string;
  };
  transfer: {
    ca?: string;
    tick?: string;
    amt: string;
    to?: string;
  };
  list: {
    tick: string;
    amt: string;
  };
  send: {
    tick: string;
  };
}

export type KasplexData<O extends keyof OperationMappings> = {
  p: string;
  op: O;
} & OperationMappings[O];

export interface IKRC20OTCOrder {
  id: bigint;
  kas_addr: string;
  krc_addr: string;
  vault_addr1: string;
  multi_sig_addr: string;
  status: number;
  krc_type: number;
  krc_name: string;
  krc_amt: number;
  kas_amt: number;
  start_time?: number;
  modify_time?: number;
  krc_tx_id?: string;
  kas_tx_id?: string;
  commit_tx_id?: string;
  reveal_tx_id?: string;
}
