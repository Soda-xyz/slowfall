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
	} catch {
		return null;
	}
}

/** Set access token */
export function setToken(token: string): void {
	if (!isWindowAvailable()) return;
	try {
		localStorage.setItem(KEY, token);
		// Notify same-tab subscribers immediately
		try {
			subscribers.forEach((subscriber) => {
				try {
					subscriber(token);
				} catch {
					// no-op
				}
			});
		} catch {
			// no-op
		}
		// Broadcast to other tabs
		try {
			if (typeof BroadcastChannel !== "undefined") {
				const bc = new BroadcastChannel(CHANNEL);
				try {
					bc.postMessage({ type: "token", token });
				} catch {
					// no-op
				} finally {
					try {
						bc.close();
					} catch {
						// no-op
					}
				}
			}
		} catch {
			// no-op
		}
	} catch {
		// no-op
	}
}

/** Clear access token */
export function clearToken(): void {
	if (!isWindowAvailable()) return;
	try {
		localStorage.removeItem(KEY);
		// Notify same-tab subscribers immediately
		try {
			subscribers.forEach((subscriber) => {
				try {
					subscriber(null);
				} catch {
					// no-op
				}
			});
		} catch {
			// no-op
		}
		// Broadcast to other tabs
		try {
			if (typeof BroadcastChannel !== "undefined") {
				const bc = new BroadcastChannel(CHANNEL);
				try {
					bc.postMessage({ type: "token_cleared" });
				} catch {
					// no-op
				} finally {
					try {
						bc.close();
					} catch {
						// no-op
					}
				}
			}
		} catch {
			// no-op
		}
	} catch {
		// no-op
	}
}

// Refresh-token helpers
/** Get refresh token */
export function getRefreshToken(): string | null {
	if (!isWindowAvailable()) return null;
	try {
		return localStorage.getItem(REFRESH_KEY);
	} catch {
		return null;
	}
}

/** Set refresh token */
export function setRefreshToken(token: string): void {
	if (!isWindowAvailable()) return;
	try {
		localStorage.setItem(REFRESH_KEY, token);
	} catch {
		// no-op
	}
}

/** Clear refresh token */
export function clearRefreshToken(): void {
	if (!isWindowAvailable()) return;
	try {
		localStorage.removeItem(REFRESH_KEY);
	} catch {
		// no-op
	}
}

// Subscribe to token changes. Returns unsubscribe function.
export function subscribe(cb: TokenSubscriber): () => void {
	if (!isWindowAvailable()) {
		// No-op unsubscribe
		return () => {};
	}

	let unsubbed = false;

	// Add to in-memory subscribers for same-tab notification
	subscribers.add(cb);

	// Handler for BroadcastChannel messages
	let bc: BroadcastChannel | null = null;
	try {
		if (typeof BroadcastChannel !== "undefined") {
			bc = new BroadcastChannel(CHANNEL);
			bc.onmessage = (ev: MessageEvent) => {
				if (unsubbed) return;
				const raw = ev.data as unknown;
				if (!raw || typeof raw !== "object") return;
				const data = raw as { type?: string; token?: string | null };
				if (data.type === "token") cb(data.token ?? null);
				if (data.type === "token_cleared") cb(null);
			};
		}
	} catch {
		bc = null;
	}

	// Handler for storage events as a fallback
	function onStorage(e: StorageEvent) {
		if (unsubbed) return;
		if (e.key === KEY) {
			cb(e.newValue);
		}
	}

	window.addEventListener("storage", onStorage);

	// Immediately call subscriber with current value
	try {
		cb(getToken());
	} catch {
		// no-op
	}

	// Return unsubscribe
	return () => {
		unsubbed = true;
		window.removeEventListener("storage", onStorage);
		subscribers.delete(cb);
		if (bc) {
			try {
				bc.close();
			} catch {
				// no-op
			}
		}
	};
}
