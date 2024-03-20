import { useCallback } from 'react';

import { useApproval, useWallet } from '@/ui/utils';

import { AddressType, IScannedGroup } from '@/shared/types';
import { AppState } from '..';
import { useAppDispatch, useAppSelector } from '../hooks';
import { TabOption, globalActions } from './reducer';

export function useGlobalState(): AppState['global'] {
  return useAppSelector((state) => state.global);
}

export function useTab() {
  const globalState = useGlobalState();
  return globalState.tab;
}

export function useSetTabCallback() {
  const dispatch = useAppDispatch();
  return useCallback(
    (tab: TabOption) => {
      dispatch(
        globalActions.update({
          tab
        })
      );
    },
    [dispatch]
  );
}

export function useIsUnlocked() {
  const globalState = useGlobalState();
  return globalState.isUnlocked;
}

export function useIsReady() {
  const globalState = useGlobalState();
  return globalState.isReady;
}

export function useUnlockCallback() {
  const dispatch = useAppDispatch();
  const wallet = useWallet();
  const [, resolveApproval] = useApproval();
  return useCallback(
    async (password: string) => {
      await wallet.unlock(password);
      dispatch(globalActions.update({ isUnlocked: true }));
      resolveApproval();
    },
    [dispatch, wallet]
  );
}

export function useCreateAccountCallback() {
  const dispatch = useAppDispatch();
  const wallet = useWallet();
  return useCallback(
    async (mnemonics: string, hdPath: string, passphrase: string, addressType: AddressType, accountCount: number, startIndex = 0, scannedGroup?: IScannedGroup) => {
      const activeIndexes: number[] = [];
      if (accountCount < 1) {
        // throw new Error(i18n.t('account count must be greater than 0'));
        throw new Error('account count must be greater than 0');
      } else if (accountCount == 1 && scannedGroup == undefined) {
        const activeIndexes = [startIndex]
        // await wallet.createKeyringWithMnemonics(mnemonics, hdPath, passphrase, addressType, accountCount, startIndex);
        await wallet.createKeyringWithMnemonics(mnemonics, hdPath, passphrase, addressType, activeIndexes);
      } else if (accountCount >= 1 && scannedGroup !== undefined) {
        const activeIndexes: number[] = []
        const activeChangeIndexes: number[] = []
        scannedGroup.dtype_arr.forEach(async (dType, i) => {
          // index_arr[i] = 1 + dtype + index
          if (dType == 0) {
            const str = scannedGroup.index_arr[i].toString()
            const index = str.substring(2)
            activeIndexes.push(Number(index))
          } else {
            const str = scannedGroup.index_arr[i].toString()
            const index = str.substring(2)
            activeChangeIndexes.push(Number(index))
          }
        })
        // activeIndexes = [0, 1, 3, 5, 7, 9]
        // activeChangeIndexes = [2, 4, 6, 8, 10]
        await wallet.createKeyringWithMnemonics(mnemonics, hdPath, passphrase, addressType, activeIndexes, activeChangeIndexes);
      } else {
        const activeIndexes: number[] = [];
        for (let i = startIndex; i < accountCount + startIndex; i++) {
          activeIndexes.push(i);
        }
        await wallet.createKeyringWithMnemonics(mnemonics, hdPath, passphrase, addressType, activeIndexes);
      }
      for (let i = startIndex; i < accountCount + startIndex; i++) {
        activeIndexes.push(i);
      }
      // await wallet.createKeyringWithMnemonics(mnemonics, hdPath, passphrase, addressType, accountCount, startIndex);
      dispatch(globalActions.update({ isUnlocked: true }));
    },
    [dispatch, wallet]
  );
}
