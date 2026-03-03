import { isNumber } from 'lodash-es';
import { useCallback, useEffect, useState } from 'react';

import browser, {
  browserTabsCreate,
  browserTabsGetCurrent,
  browserTabsQuery,
  browserTabsUpdate
} from '@/shared/webapi/browser';
import { openExtensionInTab } from '@/shared/browser';

export const extensionIsInTab = async () => {
  return Boolean(await browserTabsGetCurrent());
};

export const focusExtensionTab = async () => {
  const tab = await browserTabsGetCurrent();
  if (tab && tab.id && isNumber(tab.id) && tab.id !== browser.tabs.TAB_ID_NONE) {
    browserTabsUpdate(tab.id, { active: true });
  }
};

export const useExtensionIsInTab = () => {
  const [isInTab, setIsInTab] = useState(false);
  useEffect(() => {
    const init = async () => {
      const inTab = await extensionIsInTab();
      setIsInTab(inTab);
    };
    init();
  }, []);
  return isInTab;
};

export const useOpenExtensionInTab = () => {
  return useCallback(async (route?: string) => {
    await openExtensionInTab(route);
    window.close();
  }, []);
};

export const getCurrentTab = async () => {
  const tabs = await browserTabsQuery({ active: true, currentWindow: true });
  return tabs[0];
};
