import { browser } from "wxt/browser";

/**
 * Get the browser API instance
 * WXT provides a unified browser API that works in both Chrome and Firefox
 */
export const browserAPI = browser;

/**
 * Open a URL in a new tab
 */
export function openInNewTab(url: string): void {
	browserAPI.tabs.create({ url });
}

/**
 * Get data from local storage
 */
export async function getFromStorage<T>(key: string): Promise<T | undefined> {
	const result = await browserAPI.storage.local.get(key);
	return result[key] as T | undefined;
}

/**
 * Set data in local storage
 */
export async function setInStorage<T>(key: string, value: T): Promise<void> {
	await browserAPI.storage.local.set({ [key]: value });
}

/**
 * Remove data from local storage
 */
export async function removeFromStorage(key: string): Promise<void> {
	await browserAPI.storage.local.remove(key);
}
