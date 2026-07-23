import { useAppSelector } from '../hooks';
import { selectUiState } from './reducer';
import { createSelector } from '@reduxjs/toolkit';

const selectAssetTabKey = createSelector(selectUiState, (ui) => ui.assetTabKey);
export function useAssetTabKey() {
  return useAppSelector(selectAssetTabKey);
}

const selectNftTabKey = createSelector(selectUiState, (ui) => ui.nftTabKey);
export function useNftTabKey() {
  return useAppSelector(selectNftTabKey);
}

const selectActivityTabKey = createSelector(selectUiState, (ui) => ui.activityTabKey);
export function useActivityTabKey() {
  return useAppSelector(selectActivityTabKey);
}

const selectKRC20TokenIntro = createSelector(selectUiState, (ui) => ui.krc20TokenIntro);
export function useKRC20TokenIntro() {
  return useAppSelector(selectKRC20TokenIntro);
}
