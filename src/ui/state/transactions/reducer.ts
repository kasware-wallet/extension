import type {
  IKNSAsset,
  IKaspaUtxoEntryReference,
  ITransactionInfo,
  ITxInfo,
  Inscription,
  TKRC20History,
  TKRC20HistoryIssue
} from '@/shared/types';
import { createSelector, createSlice } from '@reduxjs/toolkit';

import type { AppState } from '..';
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
  priorityFee: number;
  toDomain: string;
  payload?: string;
}

export interface OrdinalsTx {
  fromAddress: string;
  toAddress: string;
  inscription: Inscription;
  rawtx: string;
  txid: string;
  fee: number;
  estimateFee: number;
  changeSatoshis: number;
  sending: boolean;
  psbtHex: string;
  feeRate: number;
  priorityFee: number;
  toDomain: string;
  outputValue: number;
}

export interface TransactionsState {
  kaspaTx: KaspaTx;
  ordinalsTx: OrdinalsTx;
  utxos: IKaspaUtxoEntryReference[];
  KNSAssets: IKNSAsset[];
  txActivities: ITransactionInfo[];
  krc20Activities: (TKRC20History | TKRC20HistoryIssue)[];
  incomingTx: boolean;
  pendingList: ITxInfo[];
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
    priorityFee: 0,
    toDomain: ''
  },
  ordinalsTx: {
    fromAddress: '',
    toAddress: '',
    inscription: {
      inscriptionId: '',
      inscriptionNumber: 0
    },
    rawtx: '',
    txid: '',
    fee: 0,
    estimateFee: 0,
    changeSatoshis: 0,
    sending: false,
    psbtHex: '',
    feeRate: 5,
    priorityFee: 0,
    toDomain: '',
    outputValue: 10000
  },
  utxos: [],
  KNSAssets: [],
  txActivities: [],
  krc20Activities: [],
  incomingTx: false,
  pendingList: []
};

const slice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    updateKaspaTx(
      state,
      action: {
        payload: Partial<KaspaTx>;
      }
    ) {
      const { payload } = action;
      state.kaspaTx = Object.assign({}, state.kaspaTx, payload);
    },
    updateKasplexTx(
      state,
      action: {
        payload: Partial<OrdinalsTx>;
      }
    ) {
      const { payload } = action;
      state.ordinalsTx = Object.assign({}, state.ordinalsTx, payload);
    },
    setUtxos(state, action: { payload: IKaspaUtxoEntryReference[] }) {
      state.utxos = action.payload;
    },
    setTxActivities(state, action: { payload: ITransactionInfo[] }) {
      state.txActivities = action.payload;
    },
    setKrc20Activities(state, action: { payload: TKRC20History[] }) {
      state.krc20Activities = action.payload;
    },
    setPendingList(state, action: { payload: ITxInfo[] }) {
      state.pendingList = action.payload;
    },
    setStatusInPendingList(
      state,
      action: { payload: { id: string; status: 'submitted' | 'success'; isAccepted: boolean } }
    ) {
      const { id, status, isAccepted } = action.payload;
      const index = state.pendingList.findIndex((item) => item.transaction_id === id);
      if (index !== -1) {
        state.pendingList[index].status = status;
        state.pendingList[index].isAccepted = isAccepted;
      }
    },
    addToPendingList(state, action: { payload: ITxInfo }) {
      const id = action.payload.transaction_id;
      const res3 = state.pendingList.find((item) => item.transaction_id === id);
      if (!res3) state.pendingList = [action.payload, ...state.pendingList];
    },
    removeFromPendingList(state, action: { payload: string }) {
      state.pendingList = state.pendingList.filter((tx) => tx.transaction_id !== action.payload);
    },
    replaceOldIdFromPendingList(
      state,
      action: {
        payload: {
          item: {
            id: string;
            txFee: number;
            block_time: number;
            status?: string;
          };
          oldId: string;
        };
      }
    ) {
      const { item, oldId } = action.payload;
      const index = state.pendingList.findIndex((tx) => tx.transaction_id === oldId);
      if (index !== -1) {
        const updatedTx = {
          ...state.pendingList[index],
          transaction_id: item.id,
          block_time: item.block_time,
          txFee: item.txFee,
          status: item.status || 'submitted'
        };
        state.pendingList[index] = updatedTx;
      }
      // const oldId = action.payload.oldId;
      // const item = action.payload.item;
      // state.pendingList = state.pendingList.map((tx) => {
      //   if (tx.transaction_id === oldId) {
      //     tx.transaction_id = item.id;
      //     tx.block_time = item.block_time;
      //     tx.txFee = item.txFee;
      //     tx.status = item.status || 'submitted';
      //   }
      //   return tx;
      // });
    },
    setIncomingTx(state, action: { payload: boolean }) {
      if (state.incomingTx != action.payload) state.incomingTx = action.payload;
    },
    setKNSAssets(state, action: { payload: IKNSAsset[] }) {
      state.KNSAssets = action.payload;
    },
    reset(_state) {
      return initialState;
    }
  },

  extraReducers: (builder) => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    builder.addCase(updateVersion, (_state) => {});
  }
});

export const transactionsActions = slice.actions;
export default slice.reducer;
export const selectTransactions = (state: AppState) => state.transactions;
export const selectUtxos = createSelector([selectTransactions], (state) => state.utxos);
export const selectKaspaTx = createSelector([selectTransactions], (state) => state.kaspaTx);
export const selectTxActivities = createSelector([selectTransactions], (state) => state.txActivities);
export const selectKnsAssets = createSelector([selectTransactions], (state) => state.KNSAssets);
