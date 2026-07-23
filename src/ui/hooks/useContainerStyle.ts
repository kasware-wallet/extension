import { useMemo } from 'react';
import { useExtensionIsInTab } from '../features/browser/tabs';

export default function () {
  const isTab = useExtensionIsInTab();
  return useMemo(() => (isTab ? '.js-kasware-popup-container' : undefined), [isTab]);
}
