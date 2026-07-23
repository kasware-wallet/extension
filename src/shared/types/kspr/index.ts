// The following types representing BigInt are serialized as string
type SOMPI = string;
type DAA = string;
type U64 = string;
// The following type represents Kaspa Address and is serialized as string
type Address = string;

// type UserOperation = KsprDeploy | KsprMint | KsprTransfer | KsprDiscount;

export interface KsprDeploy {
  p: 'krc-721';
  op: 'deploy';
  tick: string; // ticker symbol 1..10 alphanumeric characters
  buri: string | undefined; // optional URI for metadata as ipfs cid (ipfs://...)
  metadata: Metadata | undefined; // optional inscribed metadata
  max: U64 | undefined; // optional max number of tokens available to mint
  royaltyTo: Address | undefined; // optional royalty recipient address
  royaltyFee: SOMPI | undefined; // optional royalty fee
  daaMintStart: DAA | undefined; // optional start time for DAA minting
  premint: U64 | undefined; // optional premint
}

export interface KsprDiscount {
  p: 'krc-721';
  op: 'discount';
  tick: string; // ticker symbol 1..10 alphanumeric characters
  to: Address | undefined; // recipient address
}

export interface KsprMint {
  p: 'krc-721';
  op: 'mint';
  tick: string; // ticker symbol 1..10 alphanumeric characters
  to: Address | undefined; // optional recipient address
}

export interface KsprTransfer {
  p: 'krc-721';
  op: 'transfer';
  tick: string; // ticker symbol 1..10 alphanumeric characters
  tokenId: string | undefined; // token id
  to: Address | undefined; // recipient address
}

interface Metadata {
  name: string;
  description: string;
  image: string; // ipfs cid (ipfs://...)
  attributes: Attribute[];
}

interface Attribute {
  traitType: string; // The name/type of the trait (e.g. "Background", "Eyes", "Rarity")
  value: string; // The value of the trait (e.g. "Blue", "Gold", "Rare")
  displayType: string; // The display type hint (e.g. "date", "boost_percentage")
}

export type TKsprOp = 'deploy' | 'discount' | 'mint' | 'transfer';
