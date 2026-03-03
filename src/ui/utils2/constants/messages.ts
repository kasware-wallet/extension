import { MINT_PER_TXN, MINT_SERVER_START_TIME } from './constants';

export const MESSAGES = {
  CHAINGE_UNAVAILABLE: (ticker: string) =>
    `${ticker} is not yet supported for swapping in Kasware wallet. <br/><br/>Enable swapping by adding liquidity to <a href="https://krc20.chainge.finance/" target="_blank" rel="noopener noreferrer" class="text-primary text-base hover:underline">Chainge</a>. <br/><br/>`,

  MINT_SUCCESS: (payAmount: number, scriptAddress: string) => {
    const estimatedTime = ((MINT_SERVER_START_TIME + MINT_PER_TXN * payAmount) / 60).toFixed(2);
    return `Estimated time until completion: ${estimatedTime} minutes. <br/><br/>
    Tokens will be deposited in your wallet. Track minting progress on the
    <a href="${scriptAddress}" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">
      Kaspa Explorer
    </a>`;
  }
};
