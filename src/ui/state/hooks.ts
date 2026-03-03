import type { TypedUseSelectorHook } from 'react-redux';
import { useDispatch, useSelector } from 'react-redux';

import type { AppState, TAppDispatch } from './index';

export const useAppDispatch = () => useDispatch<TAppDispatch>();
export const useAppSelector: TypedUseSelectorHook<AppState> = useSelector;

export function useChainsState(): AppState['chains'] {
  return useAppSelector((state) => state.chains);
}
export function useWhitelistState(): AppState['whitelist'] {
  return useAppSelector((state) => state.whitelist);
}

export function useSecurityEngineState(): AppState['securityEngine'] {
  return useAppSelector((state) => state.securityEngine);
}

export function useCustomRPCState(): AppState['customRPC'] {
  return useAppSelector((state) => state.customRPC);
}
export function useAccountToDisplayState(): AppState['accountToDisplay'] {
  return useAppSelector((state) => state.accountToDisplay);
}

export function useContactBookState(): AppState['contactBook'] {
  return useAppSelector((state) => state.contactBook);
}

export function useAddressManagementState(): AppState['addressManagement'] {
  return useAppSelector((state) => state.addressManagement);
}

export function useAccountsList() {
  const accountToDisplayState = useAccountToDisplayState();
  return accountToDisplayState.accountsList;
}
export function useLoadingAccounts() {
  const accountToDisplayState = useAccountToDisplayState();
  return accountToDisplayState.loadingAccounts;
}

export function useHighlightedAddresses() {
  const addressManagementStateState = useAddressManagementState();
  return addressManagementStateState.highlightedAddresses ?? [];
}

export function useSecurityRules() {
  const securityEngineState = useSecurityEngineState();
  return securityEngineState.rules;
}

export function useCurrentTx() {
  const securityEngineState = useSecurityEngineState();
  return securityEngineState.currentTx;
}

export function useProcessedRules() {
  const currentTx = useCurrentTx();
  return currentTx.processedRules;
}

export function useCustomRPC() {
  const customRPCState = useCustomRPCState();
  return customRPCState.customRPC;
}
