import React from "react";
import { MsalProvider, useIsAuthenticated, useMsal } from "@azure/msal-react";
import type { PublicClientApplication } from "@azure/msal-browser";
import { createMsalInstanceIfPossible, msalInstance } from "./msalClient";
import * as tokenStore from "../lib/tokenStore";
import { Button, Modal, Text, Group } from "@mantine/core";

export const MsalAppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	// Ensure we have an MSAL instance before passing into MsalProvider. If not configured,
	// render children as-is (app can show login button that points to a non-MSAL fallback).
	const [ready, setReady] = React.useState(false);
	const instance = createMsalInstanceIfPossible();

	React.useEffect(() => {
		let mounted = true;
		async function init() {
			if (!instance) {
				if (mounted) setReady(true);
				return;
			}
			try {
				// Ensure the PublicClientApplication is initialized (some MSAL versions require calling initialize())
				const maybeInitialize = (instance as unknown as Partial<PublicClientApplication>)
					.initialize;
				if (typeof maybeInitialize === "function") {
					try {
						console.debug("msal: calling initialize() before redirect handling");
						await maybeInitialize.call(instance);
					} catch (initErr) {
						console.debug("msal initialize() failed", initErr);
					}
				}
				// Process redirect response if any (required for redirect-based flows)
				try {
					console.debug("msal: calling handleRedirectPromise()");
					await (instance as PublicClientApplication).handleRedirectPromise();
					// Ensure an active account is set so downstream token acquisition and hooks
					// (for example SyncMsalToken) see a stable active account. Some flows
					// leave getActiveAccount() null even when getAllAccounts() contains an entry.
					try {
						const maybeActive =
							(instance as PublicClientApplication).getActiveAccount &&
							(instance as PublicClientApplication).getActiveAccount();
						if (!maybeActive) {
							const all = (instance as PublicClientApplication).getAllAccounts();
							if (all && all.length > 0) {
								try {
									// setActiveAccount is available on PublicClientApplication
									(instance as PublicClientApplication).setActiveAccount(all[0]);
									console.debug("msal: active account set from existing accounts");
								} catch (saErr) {
									console.debug("msal: setActiveAccount failed", saErr);
								}
							}
						}
					} catch (activeErr) {
						// Log the error so the linter no longer flags the variable as unused.
						console.debug("msal: checking/setting active account failed", activeErr);
					}
				} catch (hrErr: unknown) {
					// If MSAL reports an uninitialized public client application, try initialize() then retry once
					const maybeObj =
						hrErr && typeof hrErr === "object" ? (hrErr as Record<string, unknown>) : undefined;
					const msg = maybeObj
						? String(maybeObj["errorCode"] ?? maybeObj["message"] ?? String(hrErr))
						: String(hrErr);
					console.debug("msal handleRedirectPromise initial attempt failed", msg, hrErr);
					if (String(msg).indexOf("uninitialized_public_client_application") !== -1) {
						if (typeof maybeInitialize === "function") {
							try {
								console.debug("msal: retry initialize() after uninitialized error");
								await maybeInitialize.call(instance);
								console.debug("msal: retrying handleRedirectPromise()");
								await (instance as PublicClientApplication).handleRedirectPromise();
							} catch (retryErr) {
								console.debug("msal handleRedirectPromise retry failed", retryErr);
							}
						}
					}
				}
			} catch (err) {
				console.debug("handleRedirectPromise failed", err);
			} finally {
				if (mounted) setReady(true);
			}
		}
		init();
		return () => {
			mounted = false;
		};
	}, [instance]);

	if (!ready) return null;
	if (instance) return <MsalProvider instance={instance}>{children}</MsalProvider>;
	return <>{children}</>;
};

/**
 * SyncMsalToken — synchronize MSAL acquired access token into the local token store.
 * This uses msal-react hooks to acquire a silent token for the first available account
 * and mirrors it into the shared `tokenStore` so other modules can access it.
 */
export const SyncMsalToken: React.FC<{ scopes?: string[] }> = ({ scopes }) => {
	const { instance, accounts } = useMsal();
	const isAuthenticated = useIsAuthenticated();

	// Compute runtime env and default scopes if not provided
	type RuntimeEnv = Record<string, string | undefined>;
	const runtimeEnv =
		typeof window !== "undefined" ? (window as unknown as { __env?: RuntimeEnv }).__env : undefined;
	const buildEnv = import.meta.env as unknown as Record<string, string | undefined>;
	const env = Object.assign({}, buildEnv, runtimeEnv || {});
	const backendClientId = env.VITE_MSAL_BACKEND_CLIENT_ID || env.VITE_MSAL_CLIENT_ID || "";
	// Allow an explicit API scope to be set at runtime (for custom App ID URI values)
	const apiScopeFromEnv = env.VITE_MSAL_API_SCOPE && env.VITE_MSAL_API_SCOPE.trim();
	const computedApiScope = apiScopeFromEnv
		? apiScopeFromEnv
		: backendClientId
			? `api://${backendClientId}/access_as_user`
			: "";
	const defaultScopes = computedApiScope ? [computedApiScope] : ["openid", "profile"];

	const effectiveScopes = scopes && scopes.length > 0 ? scopes : defaultScopes;
	const effectiveScopesKey = React.useMemo(
		() => JSON.stringify(effectiveScopes),
		[effectiveScopes],
	);

	React.useEffect(() => {
		let mounted = true;
		async function sync() {
			if (!isAuthenticated) {
				tokenStore.clearToken();
				return;
			}
			const account = accounts[0];
			if (!account) return;
			try {
				console.debug("SyncMsalToken trying acquireTokenSilent with scopes:", effectiveScopes);
				const resp = await instance.acquireTokenSilent({ account, scopes: effectiveScopes });
				if (mounted && resp && resp.accessToken) {
					tokenStore.setToken(resp.accessToken);
					console.debug("SyncMsalToken acquired token (len):", resp.accessToken.length);
				}
			} catch (error) {
				console.debug("acquireTokenSilent failed:", error);
			}
		}
		sync();
		return () => {
			mounted = false;
		};
	}, [instance, accounts, isAuthenticated, effectiveScopesKey]);

	return null;
};

/**
 * LoginButton — small helper that starts an interactive MSAL login (popup or redirect)
 */
export const LoginButton: React.FC<{ usePopup?: boolean; scopes?: string[] }> = ({
	usePopup = false,
	scopes = ["openid", "profile"],
}) => {
	const { instance } = useMsal();
	const handleLogin = async () => {
		// Compute runtime env and include API scope if available so interactive login requests consent
		type RuntimeEnv = Record<string, string | undefined>;
		const runtimeEnv =
			typeof window !== "undefined"
				? (window as unknown as { __env?: RuntimeEnv }).__env
				: undefined;
		const buildEnv = import.meta.env as unknown as Record<string, string | undefined>;
		const env = Object.assign({}, buildEnv, runtimeEnv || {});
		const backendClientId = env.VITE_MSAL_BACKEND_CLIENT_ID || env.VITE_MSAL_CLIENT_ID || "";
		const apiScopeFromEnv = env.VITE_MSAL_API_SCOPE && env.VITE_MSAL_API_SCOPE.trim();
		const computedApiScope = apiScopeFromEnv
			? apiScopeFromEnv
			: backendClientId
				? `api://${backendClientId}/access_as_user`
				: "";
		const interactiveScopes = (
			scopes && scopes.length > 0 ? scopes.slice() : ["openid", "profile"]
		).slice();
		if (computedApiScope) interactiveScopes.push(computedApiScope);

		if (usePopup) {
			try {
				await instance.loginPopup({ scopes: interactiveScopes });
			} catch (error) {
				console.debug("loginPopup failed:", error);
			}
		} else {
			instance.loginRedirect({ scopes: interactiveScopes }).catch((error) => {
				console.debug("loginRedirect failed:", error);
			});
		}
	};
	return <button onClick={handleLogin}>Sign in</button>;
};

/**
 * SignOutButton — header-friendly sign-out button with optional popup or redirect logout.
 * Presents a small confirmation modal before triggering MSAL logout.
 */
export const SignOutButton: React.FC<{ usePopup?: boolean }> = ({ usePopup = false }) => {
	const [opened, setOpened] = React.useState(false);

	type MaybeLogout = {
		logoutPopup?: (...args: unknown[]) => Promise<void> | void;
		logoutRedirect?: (...args: unknown[]) => Promise<void> | void;
	};

	const handleConfirmLogout = async () => {
		setOpened(false);
		try {
			const inst = msalInstance as unknown as MaybeLogout;
			if (usePopup && typeof inst.logoutPopup === "function") {
				await inst.logoutPopup();
			} else if (typeof inst.logoutRedirect === "function") {
				await inst.logoutRedirect();
			}
		} catch (error) {
			console.debug("logout failed:", error);
		}
	};

	return (
		<>
			<Button variant="outline" size="xs" onClick={() => setOpened(true)}>
				Sign out
			</Button>
			<Modal opened={opened} onClose={() => setOpened(false)} title="Confirm sign out" centered>
				<Text mb="md">
					Are you sure you want to sign out? You will be redirected to the identity provider to
					complete logout.
				</Text>
				<Group style={{ justifyContent: "flex-end" }}>
					<Button variant="default" onClick={() => setOpened(false)} size="xs">
						Cancel
					</Button>
					<Button color="red" onClick={handleConfirmLogout} size="xs">
						Sign out
					</Button>
				</Group>
			</Modal>
		</>
	);
};
