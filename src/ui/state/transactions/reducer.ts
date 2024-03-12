import { Inscription } from '@/shared/types';
import { createSlice } from '@reduxjs/toolkit';

import { updateVersion } from '../global/actions';

export interface BitcoinTx {
  fromAddress: string;
  toAddress: string;
  toSatoshis: number;
  rawtx: string;
  txid: string;
  fee: number;
  estimateFee: number;
  changeSatoshis: number;
  sending: boolean;
  autoAdjust: boolean;
  psbtHex: string;
  feeRate: number;
  toDomain: string;
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
  toDomain: string;
  outputValue: number;
}

export interface AtomicalsTx {
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
  toDomain: string;
  outputValue: number;
  sendArc20Amount?: number;
}

export interface TransactionsState {
  bitcoinTx: BitcoinTx;
  ordinalsTx: OrdinalsTx;
  atomicalsTx: AtomicalsTx;
  utxos: any[];
  kasUtxos:string;
  assetUtxos_atomicals_ft: any[];
  assetUtxos_atomicals_nft: any[];
  assetUtxos_inscriptions: any[];
}

export const initialState: TransactionsState = {
  bitcoinTx: {
    fromAddress: '',
    toAddress: '',
    toSatoshis: 0,
    rawtx: '',
    txid: '',
    fee: 0,
    estimateFee: 0,
    changeSatoshis: 0,
    sending: false,
    autoAdjust: false,
    psbtHex: '',
    feeRate: 5,
    toDomain: ''
  },
  ordinalsTx: {
    fromAddress: '',
    toAddress: '',
    inscription: {
      inscriptionId: '',
      inscriptionNumber: 0
    } as Inscription,
    rawtx: '',
    txid: '',
    fee: 0,
    estimateFee: 0,
    changeSatoshis: 0,
    sending: false,
    psbtHex: '',
    feeRate: 5,
    toDomain: '',
    outputValue: 10000
  },
  atomicalsTx: {
    fromAddress: '',
    toAddress: '',
    inscription: {
      inscriptionId: '',
      inscriptionNumber: 0
    } as Inscription,
    rawtx: '',
    txid: '',
    fee: 0,
    estimateFee: 0,
    changeSatoshis: 0,
    sending: false,
    psbtHex: '',
    feeRate: 5,
    toDomain: '',
    outputValue: 10000
  },
  utxos: [],
  kasUtxos:'',
  assetUtxos_atomicals_ft: [],
  assetUtxos_atomicals_nft: [],
  assetUtxos_inscriptions: []
};

const slice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    updateBitcoinTx(
      state,
      action: {
        payload: {
          fromAddress?: string;
          toAddress?: string;
          toSatoshis?: number;
          changeSatoshis?: number;
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
      state.bitcoinTx = Object.assign({}, state.bitcoinTx, payload);
    },
    updateOrdinalsTx(
      state,
      action: {
        payload: {
          fromAddress?: string;
          toAddress?: string;
          inscription?: Inscription;
          changeSatoshis?: number;
          rawtx?: string;
          txid?: string;
          fee?: number;
          estimateFee?: number;
          sending?: boolean;
          psbtHex?: string;
          feeRate?: number;
          toDomain?: string;
          outputValue?: number;
        };
      }
    ) {
      const { payload } = action;
      state.ordinalsTx = Object.assign({}, state.ordinalsTx, payload);
    },
    updateAtomicalsTx(
      state,
      action: {
        payload: {
          fromAddress?: string;
          toAddress?: string;
          inscription?: Inscription;
          changeSatoshis?: number;
          rawtx?: string;
          txid?: string;
          fee?: number;
          estimateFee?: number;
          sending?: boolean;
          psbtHex?: string;
          feeRate?: number;
          toDomain?: string;
          outputValue?: number;
          sendArc20Amount?: number;
        };
      }
    ) {
      const { payload } = action;
      state.atomicalsTx = Object.assign({}, state.atomicalsTx, payload);
    },
    setUtxos(state, action: { payload: any[] }) {
      state.utxos = action.payload;
    },
    setKasUtxos(state, action: { payload: string }) {
      state.kasUtxos = action.payload;
    },
    setAssetUtxosAtomicalsFT(state, action: { payload: any[] }) {
      state.assetUtxos_atomicals_ft = action.payload;
    },
    setAssetUtxosAtomicalsNFT(state, action: { payload: any[] }) {
      state.assetUtxos_atomicals_nft = action.payload;
    },
    setAssetUtxosInscriptions(state, action: { payload: any[] }) {
      state.assetUtxos_inscriptions = action.payload;
    },
    reset(state) {
      return initialState;
    }
  },

  extraReducers: (builder) => {
    builder.addCase(updateVersion, (state) => {
      //  todo
      if (!state.assetUtxos_atomicals_ft) {
        state.assetUtxos_atomicals_ft = [];
      }

      if (!state.assetUtxos_atomicals_nft) {
        state.assetUtxos_atomicals_nft = [];
      }

      if (!state.assetUtxos_inscriptions) {
        state.assetUtxos_inscriptions = [];
      }
    });
  }
});

export const transactionsActions = slice.actions;
export default slice.reducer;
