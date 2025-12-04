import React from "react";
import { MsalProvider, useIsAuthenticated, useMsal } from "@azure/msal-react";
import { createMsalInstanceIfPossible, msalInstance } from "./msalClient";
import * as tokenStore from "../lib/tokenStore";
import { Button, Modal, Text, Group } from "@mantine/core";

export const MsalAppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	// Ensure we have an MSAL instance before passing into MsalProvider. If not configured,
	// render children as-is (app can show login button that points to a non-MSAL fallback).
	const instance = createMsalInstanceIfPossible();
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
	const runtimeEnv = (typeof window !== "undefined" ? (window as unknown as { __env?: RuntimeEnv }).__env : undefined);
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
				const resp = await instance.acquireTokenSilent({ account, scopes: effectiveScopes });
				if (mounted && resp && resp.accessToken) {
					tokenStore.setToken(resp.accessToken);
				}
			} catch (error) {
				console.debug("acquireTokenSilent failed:", error);
			}
		}
		sync();
		return () => {
			mounted = false;
		};
	}, [instance, accounts, isAuthenticated, JSON.stringify(effectiveScopes)]);

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
		if (usePopup) {
			try {
				await instance.loginPopup({ scopes });
			} catch (error) {
				console.debug("loginPopup failed:", error);
			}
		} else {
			instance.loginRedirect({ scopes }).catch((error) => {
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
