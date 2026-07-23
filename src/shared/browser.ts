import browser, { browserTabsCreate } from '@/shared/webapi/browser';
export const openExtensionInTab = async (route?: string) => {
  const url = route ? browser.runtime.getURL('index.html' + route) : browser.runtime.getURL('index.html');
  const tab = await browserTabsCreate({ url });
  return tab;
};
