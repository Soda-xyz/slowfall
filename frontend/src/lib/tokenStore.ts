import { logger } from "./log";

/**
 * Token store wrapper: provides get/set/clear and subscribe with BroadcastChannel fallback.
 * Compatible with React 19 and TypeScript ~5.9.
 * Uses localStorage key `auth_access_token` so tokens can sync across tabs; keeps SSR-safety.
 */

export const KEY = "auth_access_token";
export const CHANNEL = "slowfall-auth";
export const REFRESH_KEY = "auth_refresh_token";

type TokenSubscriber = (token: string | null) => void;

/** In-memory subscribers for same-tab notifications (important for test envs without BroadcastChannel) */
const subscribers = new Set<TokenSubscriber>();

/**
 * Check if `window` is available (SSR-safe detection).
 */
function isWindowAvailable(): boolean {
	try {
		return typeof window !== "undefined" && !!window;
	} catch {
		return false;
	}
}

/** Get access token */
export function getToken(): string | null {
	if (!isWindowAvailable()) return null;
	try {
		return localStorage.getItem(KEY);
	} catch (err) {
		logger.debug("tokenStore: failed to read access token from localStorage:", err);
		return null;
	}
}

/** Set access token */
export function setToken(token: string): void {
	if (!isWindowAvailable()) return;
	try {
		localStorage.setItem(KEY, token);
		try {
			subscribers.forEach((subscriber) => {
				try {
					subscriber(token);
				} catch (innerErr) {
					logger.debug("tokenStore subscriber threw an error:", innerErr);
				}
			});
		} catch (notifyErr) {
			logger.debug("tokenStore: failed notifying subscribers:", notifyErr);
		}

		try {
			if (typeof BroadcastChannel !== "undefined") {
				const bc = new BroadcastChannel(CHANNEL);
				try {
					bc.postMessage({ type: "token", token });
				} catch (postErr) {
					logger.debug("tokenStore: BroadcastChannel.postMessage failed:", postErr);
				} finally {
					try {
						bc.close();
					} catch (closeErr) {
						logger.debug("tokenStore: BroadcastChannel.close failed:", closeErr);
					}
				}
			}
		} catch (bcErr) {
			logger.debug("tokenStore: BroadcastChannel unavailable or errored:", bcErr);
		}
	} catch (err) {
		logger.debug("tokenStore: failed to set token in localStorage:", err);
	}
}

/** Clear access token */
export function clearToken(): void {
	if (!isWindowAvailable()) return;
	try {
		localStorage.removeItem(KEY);
		try {
			subscribers.forEach((subscriber) => {
				try {
					subscriber(null);
				} catch (innerErr) {
					logger.debug("tokenStore subscriber threw on clear:", innerErr);
				}
			});
		} catch (notifyErr) {
			logger.debug("tokenStore: failed notifying subscribers on clear:", notifyErr);
		}

		try {
			if (typeof BroadcastChannel !== "undefined") {
				const bc = new BroadcastChannel(CHANNEL);
				try {
					bc.postMessage({ type: "token_cleared" });
				} catch (postErr) {
					logger.debug("tokenStore: BroadcastChannel.postMessage failed on clear:", postErr);
				} finally {
					try {
						bc.close();
					} catch (closeErr) {
						logger.debug("tokenStore: BroadcastChannel.close failed on clear:", closeErr);
					}
				}
			}
		} catch (bcErr) {
			logger.debug("tokenStore: BroadcastChannel unavailable or errored on clear:", bcErr);
		}
	} catch (err) {
		logger.debug("tokenStore: failed to clear token in localStorage:", err);
	}
}

/** Get refresh token */
export function getRefreshToken(): string | null {
	if (!isWindowAvailable()) return null;
	try {
		return localStorage.getItem(REFRESH_KEY);
	} catch (err) {
		logger.debug("tokenStore: failed to read refresh token from localStorage:", err);
		return null;
	}
}

/** Set refresh token */
export function setRefreshToken(token: string): void {
	if (!isWindowAvailable()) return;
	try {
		localStorage.setItem(REFRESH_KEY, token);
	} catch (err) {
		logger.debug("tokenStore: failed to set refresh token:", err);
	}
}

/** Clear refresh token */
export function clearRefreshToken(): void {
	if (!isWindowAvailable()) return;
	try {
		localStorage.removeItem(REFRESH_KEY);
	} catch (err) {
		logger.debug("tokenStore: failed to remove refresh token:", err);
	}
}

/**
 * Subscribe to token changes. Returns an unsubscribe function.
 * Supports same-tab subscribers and BroadcastChannel cross-tab notifications.
 */
export function subscribe(cb: TokenSubscriber): () => void {
	if (!isWindowAvailable()) {
		return () => {};
	}

	let unsubbed = false;

	subscribers.add(cb);

	let bc: BroadcastChannel | null = null;
	try {
		if (typeof BroadcastChannel !== "undefined") {
			bc = new BroadcastChannel(CHANNEL);
			/**
			 * Listen for cross-tab token messages and forward to subscriber callback.
			 */
			bc.onmessage = (ev: MessageEvent) => {
				if (unsubbed) return;
				const raw = ev.data as unknown;
				if (!raw || typeof raw !== "object") return;
				const data = raw as { type?: string; token?: string | null };
				if (data.type === "token") cb(data.token ?? null);
				if (data.type === "token_cleared") cb(null);
			};
		}
	} catch (err) {
		logger.debug("tokenStore: BroadcastChannel unavailable or failed:", err);
		bc = null;
	}

	/**
	 * Storage event handler to observe localStorage changes from other tabs.
	 */
	function onStorage(e: StorageEvent) {
		if (unsubbed) return;
		if (e.key === KEY) {
			cb(e.newValue);
		}
	}

	window.addEventListener("storage", onStorage);

	try {
		cb(getToken());
	} catch (err) {
		logger.debug("tokenStore: subscriber callback threw during initial delivery:", err);
	}

	return () => {
		unsubbed = true;
		try {
			window.removeEventListener("storage", onStorage);
		} catch (err) {
			logger.debug("tokenStore: failed to remove storage listener on unsubscribe:", err);
		}
		subscribers.delete(cb);
		if (bc) {
			try {
				bc.close();
			} catch (err) {
				logger.debug("tokenStore: failed to close BroadcastChannel on unsubscribe:", err);
			}
		}
	};
}
