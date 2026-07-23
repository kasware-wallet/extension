import type { IChaingeToken } from '../types';

export const getChaingeTicker = (token: IChaingeToken | null) => (token ? token.ticker : '');
