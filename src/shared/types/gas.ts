export interface ChainGas {
  gasPrice?: number | null; // custom cached gas price
  gasLevel?: string | null; // cached gasLevel
  lastTimeSelect?: 'gasLevel' | 'gasPrice'; // last time selection, 'gasLevel' | 'gasPrice'
  expireAt?: number;
}

export interface GasCache {
  [chainId: string | number]: ChainGas;
}
