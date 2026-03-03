import { useAppSelector } from '../hooks';
import { selectCurrentKeyring, selectWalletKeyrings } from './reducer';

// export function useKeyringsState(): AppState['keyrings'] {
//   return useAppSelector((state) => state.keyrings);
// }

export function useKeyrings() {
  // const keyringsState = useKeyringsState();
  // return keyringsState.keyrings;
  return useAppSelector(selectWalletKeyrings);
}

export function useCurrentKeyring() {
  return useAppSelector(selectCurrentKeyring);
}
