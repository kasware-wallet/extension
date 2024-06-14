/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { IKaspaUTXOWithoutBigint, ITransactionInfo } from '@/shared/types';
import { createSlice } from '@reduxjs/toolkit';

import { updateVersion } from '../global/actions';

export interface KaspaTx {
  fromAddress: string;
  toAddress: string;
  toSompi: number;
  rawtx: string;
  txid: string;
  fee: number;
  estimateFee: number;
  changeSompi: number;
  sending: boolean;
  autoAdjust: boolean;
  psbtHex: string;
  feeRate: number;
  toDomain: string;
}

export interface TransactionsState {
  kaspaTx: KaspaTx;
  utxos: IKaspaUTXOWithoutBigint[];
  kasUtxos:string;
  txActivities: ITransactionInfo[];
  incomingTx: boolean
}

export const initialState: TransactionsState = {
  kaspaTx: {
    fromAddress: '',
    toAddress: '',
    toSompi: 0,
    rawtx: '',
    txid: '',
    fee: 0,
    estimateFee: 0,
    changeSompi: 0,
    sending: false,
    autoAdjust: false,
    psbtHex: '',
    feeRate: 5,
    toDomain: ''
  },
  utxos: [],
  kasUtxos:'',
  txActivities: [],
  incomingTx:false
};

const slice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    updateKaspaTx(
      state,
      action: {
        payload: {
          fromAddress?: string;
          toAddress?: string;
          toSompi?: number;
          changeSompi?: number;
          rawtx?: string;
          txid?: string;
          fee?: number;
          estimateFee?: number;
          sending?: boolean;
          autoAdjust?: boolean;
          psbtHex?: string;
          feeRate?: number;
          toDomain?: string;
        };
      }
    ) {
      const { payload } = action;
      state.kaspaTx = Object.assign({}, state.kaspaTx, payload);
    },
    setUtxos(state, action: { payload: any[] }) {
      state.utxos = action.payload;
    },
    setTxActivities(state, action: { payload: any[] }) {
      state.txActivities = action.payload;
    },
    setIncomingTx(state, action: { payload: boolean }) {
      state.incomingTx = action.payload;
    },
    setKasUtxos(state, action: { payload: string }) {
      state.kasUtxos = action.payload;
    },
    reset(state) {
      return initialState;
    }
  },

  extraReducers: (builder) => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    builder.addCase(updateVersion, (state) => {});
  }
});

export const transactionsActions = slice.actions;
export default slice.reducer;
