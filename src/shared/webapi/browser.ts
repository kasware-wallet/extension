import browser from 'webextension-polyfill';

import { MANIFEST_VERSION } from '@/shared/constant';

export async function browserWindowsGetCurrent(params?: any) {
  return await browser?.windows.getCurrent(params);
}

export async function browserWindowsCreate(params?: any) {
  return await browser?.windows.create(params);
}

export async function browserWindowsUpdate(windowId: number, updateInfo: any) {
  return await browser?.windows.update(windowId, updateInfo);
}

export async function browserWindowsRemove(windowId: number) {
  return await browser?.windows.remove(windowId);
}

export async function browserStorageLocalGet(val: any) {
  return await browser?.storage.local.get(val);
}

export async function browserStorageLocalRemove(val: any) {
  return await browser?.storage.local.remove(val);
}

export async function browserStorageLocalSet(val: any) {
  return await browser?.storage.local.set(val);
}

export async function browserTabsGetCurrent() {
  return await browser?.tabs.getCurrent();
}

export async function browserTabsQuery(params: any) {
  return await browser?.tabs.query(params);
}

export async function browserTabsCreate(params: any) {
  return await browser?.tabs.create(params);
}

export async function browserTabsUpdate(tabId: number, params: any) {
  return await browser?.tabs.update(tabId, params);
}

export function browserWindowsOnFocusChanged(listener) {
  browser?.windows.onFocusChanged.addListener(listener);
}

export function browserWindowsOnRemoved(listener) {
  browser?.windows.onRemoved.addListener(listener);
}

export function browserTabsOnUpdated(listener) {
  browser?.tabs.onUpdated.addListener(listener);
}

export function browserTabsOnRemoved(listener) {
  browser?.tabs.onRemoved.addListener(listener);
}

export function browserRuntimeOnConnect(listener) {
  browser?.runtime.onConnect.addListener(listener);
}

export function browserRuntimeOnInstalled(listener) {
  browser?.runtime.onInstalled.addListener(listener);
}

export function browserRuntimeConnect(extensionId?: string, connectInfo?: any) {
  return browser?.runtime.connect(extensionId, connectInfo);
}

export function browserRuntimeReload() {
  return browser?.runtime.reload();
}

/**
 * Updates the Web Extension's "badge" number, on the little fox in the toolbar.--Shawn 2025-01-19
 */
export function browserSetBadge(val: string) {
  const badgeText = {
    text: val
  };
  const badgeBackgroundColor = {
    color: '#037DD6'
  };
  // browser?.action.setBadgeText({ text: val });
  // browser?.action.setBadgeBackgroundColor({ color: '#037DD6' });
  if (MANIFEST_VERSION === 'mv2') {
    browser.browserAction.setBadgeText(badgeText);
    browser.browserAction.setBadgeBackgroundColor(badgeBackgroundColor);
  } else {
    browser.action.setBadgeText(badgeText);
    browser.action.setBadgeBackgroundColor(badgeBackgroundColor);
  }
}

export function browserRemoveBadge() {
  const badgeText = {
    text: ''
  };
  if (MANIFEST_VERSION === 'mv2') {
    browser.browserAction.setBadgeText(badgeText);
  } else {
    browser.action.setBadgeText(badgeText);
  }
}

export default browser;
