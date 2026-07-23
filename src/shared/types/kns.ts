export interface IKNSAsset {
  asset: string;
  assetId: string;
  creationBlockTime: string;
  id: string;
  isDomain: boolean;
  isVerifiedDomain: boolean;
  status: 'listed' | 'default';
  mimeType: string;
  owner: string;
}

export interface IKNSDomain {
  id: string; // number string
  assetId: string;
  asset: string;
  owner: string;
}

export interface IKNSAssetsResponse {
  config: Record<string, unknown>;
  data: {
    success: boolean;
    data: IKNSAssetsResponseData;
  };
  headers: Record<string, unknown>;
  request: Record<string, unknown>;
  status: number;
  statusText: string;
}

export interface IKNSAssetsResponseData {
  assets: IKNSAsset[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface IKNSDomainResponse {
  config: Record<string, unknown>;
  data: {
    success: boolean;
    data: IKNSDomain;
  };
  headers: Record<string, unknown>;
  request: Record<string, unknown>;
  status: number;
  statusText: string;
}
