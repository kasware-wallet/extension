export interface Inscription {
  tokenType: TTokenType;
  tick?: string;
  ca?: string;
  priceInKas: number;
  // sompi unit
  balance: string;
  locked: string;
  dec: string;
  opScoreMod: string;
}

export interface InscriptionMintedItem {
  title: string;
  desc: string;
  inscriptions: Inscription[];
}

export interface InscriptionSummary {
  mintedList: InscriptionMintedItem[];
}

export type TTokenType = 'KAS' | 'KRC20Mint' | 'KRC20Issue' | 'KNS' | 'KSPR';
export type TNFTType = 'ERC-721' | 'ERC-1155' | 'ERC-404';

export enum BuildScriptType {
  KRC20 = 'KRC20',
  KNS = 'KNS',
  KSPR_KRC721 = 'KSPR_KRC721'
}

export type TTabKey = 'TOKENS' | 'NFT' | 'ACTIVITIES' | 'UTXO';
export enum AssetTabKey {
  TOKENS = 'TOKENS',
  NFT = 'NFT',
  ACTIVITIES = 'ACTIVITIES',
  UTXO = 'UTXO'
}
export enum NftTabKey {
  KNS = 'KNS',
  KSPR = 'KRC721',
  EVM = 'EVM'
}
export enum ActivityTabKey {
  KAS = 'KAS',
  KRC20 = 'KRC20',
  KRC721 = 'KRC721',
  EVM = 'EVM'
}
export enum TokensTabKey {
  KASPA = 'Kaspa',
  KRC20 = 'KRC20',
  EVM = 'EVM'
}

export enum BridgeTabKey {
  EVM = 'EVM',
  KaspaL2 = 'KAS',
  KRCL2 = 'KRC-L2'
}
export enum SwapTabKey {
  EVM = 'EVM',
  // HIBIT = 'Hibit',
  CHAINGE = 'Knot.meme'
}

export interface BlockscoutNFTInstance {
  id: string;
  value: string;
  image_url: string;
  media_url: string;
  token_type: TNFTType;
  metadata: {
    description: string;
    image: string;
    name: string;
  };
}
export interface BlockscoutNFT {
  address: string;
  decimals: number;
  holders: string;
  name: string;
  symbol: string;
  total_supply: string;
  type: TNFTType;
}
