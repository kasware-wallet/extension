import type { Level, RuleConfig, UserData } from '@kasware-wallet/security-engine/dist/rules';
import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';

import type { AppState, TAppDispatch } from '..';

interface State {
  userData: UserData;
  rules: RuleConfig[];
  currentTx: {
    processedRules: string[];
    ruleDrawer: {
      selectRule: {
        ruleConfig: RuleConfig;
        value?: number | string | boolean;
        level?: Level;
        ignored: boolean;
      } | null;
      visible: boolean;
    };
  };
}

export const securityEngine = createSlice({
  name: 'securityEngine',
  initialState: {
    userData: {
      originWhitelist: [],
      originBlacklist: [],
      contractWhitelist: [],
      contractBlacklist: [],
      addressWhitelist: [],
      addressBlacklist: []
    },
    rules: [],
    currentTx: {
      processedRules: [],
      ruleDrawer: {
        selectRule: null,
        visible: false
      }
    }
  } as State,
  reducers: {
    setField(state, action: { payload: Partial<typeof state> }) {
      const { payload } = action;
      return Object.keys(payload).reduce(
        (accu, key) => {
          accu[key] = payload[key];
          return accu;
        },
        { ...state }
      );
    },
    updateCurrentTx(state, action: { payload: Partial<State['currentTx']> }) {
      const { payload } = action;
      return {
        ...state,
        currentTx: {
          ...state.currentTx,
          ...payload
        }
      };
    }
  }
});

export const { actions: securityEngineActions, reducer: securityEngineReducer } = securityEngine;
export const selectSecurityEngineState = (state: AppState) => state.securityEngine;
export const selectUserData = createSelector(selectSecurityEngineState, (state) => state.userData);
export const selectContractWhitelist = createSelector(selectUserData, (state) => state.contractWhitelist);
export const selectContractBlacklist = createSelector(selectUserData, (state) => state.contractBlacklist);

export const selectRules = createSelector(selectSecurityEngineState, (state) => state.rules);
export const selectCurrentTx = createSelector(selectSecurityEngineState, (state) => state.currentTx);
export const selectProcessedRules = createSelector(selectCurrentTx, (state) => state.processedRules);
export const securityEngineInit = createAsyncThunk('securityEngine/init', async (_, thunkApi) => {
  const store = thunkApi.getState() as AppState;
  const dispatch = thunkApi.dispatch;
  const userData = await store.app.wallet.walletEVM.getSecurityEngineUserData();
  const rules = await store.app.wallet.walletEVM.getSecurityEngineRules();
  dispatch(securityEngineActions.setField({ userData, rules }));

  return null;
});

export const resetCurrentTx = () => {
  return async (dispatch: TAppDispatch) => {
    return dispatch(
      securityEngineActions.updateCurrentTx({
        processedRules: [],
        ruleDrawer: {
          selectRule: null,
          visible: false
        }
      })
    );
  };
};

export function openRuleDrawer(rule: {
  ruleConfig: RuleConfig;
  value?: number | string | boolean;
  level?: Level;
  ignored: boolean;
}) {
  return async (dispatch: TAppDispatch) => {
    return dispatch(
      securityEngineActions.updateCurrentTx({
        ruleDrawer: {
          selectRule: rule,
          visible: true
        }
      })
    );
  };
}

export const closeRuleDrawer = () => {
  return async (dispatch: TAppDispatch) => {
    return dispatch(
      securityEngineActions.updateCurrentTx({
        ruleDrawer: {
          selectRule: null,
          visible: false
        }
      })
    );
  };
};

export function processAllRules(ids: string[]) {
  return async (dispatch: TAppDispatch) => {
    return dispatch(
      securityEngineActions.updateCurrentTx({
        processedRules: ids
      })
    );
  };
}

export function unProcessRule(id) {
  return async (dispatch: TAppDispatch, getState) => {
    const processedRules = getState().securityEngine.currentTx.processedRules.filter((i) => i !== id);
    return dispatch(
      securityEngineActions.updateCurrentTx({
        processedRules
      })
    );
  };
}

export function processRule(id: string) {
  return async (dispatch: TAppDispatch, getState) => {
    const processedRules = getState().securityEngine.currentTx.processedRules;
    return dispatch(
      securityEngineActions.updateCurrentTx({
        processedRules: [...processedRules, id]
      })
    );
  };
}
