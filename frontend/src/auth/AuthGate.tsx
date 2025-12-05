import React from "react";
import { useIsAuthenticated } from "@azure/msal-react";
import { Center, Stack, Text, Container, Button } from "@mantine/core";
import BasicLogin, { getStoredPseudoCredentials } from "./BasicLogin";
import { createMsalInstanceIfPossible } from "./msalClient";

/**
 * AuthGate: render children only when authenticated. Otherwise show a centered login UI.
 */
export const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const isAuthenticated = useIsAuthenticated();
	// Create an MSAL instance (if configured) for both the login handler and UI checks
	const msalInst = createMsalInstanceIfPossible();

	// MSAL authenticated users pass through
	if (isAuthenticated) return <>{children}</>;

	// If MSAL is not configured but pseudo/basic credentials were stored by the BasicLogin UI,
	// treat the user as authenticated so the app can render. Read storage inside try/catch but
	// avoid returning JSX inside the try block to satisfy react error-boundary lint rules.
	let hasStoredPseudo = false;
	try {
		const stored = getStoredPseudoCredentials();
		hasStoredPseudo = !msalInst && !!stored.user && !!stored.pass;
	} catch {
		hasStoredPseudo = false;
	}

	if (hasStoredPseudo) return <>{children}</>;

	const handleLogin = () => {
		const instance = msalInst;
		// Compute runtime env to include API scope in interactive login
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
		const scopes = computedApiScope
			? [`openid`, `profile`, computedApiScope]
			: [`openid`, `profile`];
		if (instance && typeof instance.loginRedirect === "function") {
			instance.loginRedirect({ scopes }).catch(() => {});
		} else {
			// MSAL not configured: fall back to pseudo/basic login UI when credentials can be entered
			console.debug("MSAL not configured: showing pseudo/basic login fallback");
		}
	};

	return (
		<Container mih="100vh">
			{msalInst && typeof msalInst.loginRedirect === "function" ? (
				<Center style={{ minHeight: "60vh" }}>
					<Stack align="center">
						<Text size="lg">You must sign in to use the application.</Text>
						<Button onClick={handleLogin}>Sign in</Button>
					</Stack>
				</Center>
			) : (
				<BasicLogin onDone={() => window.location.reload()} />
			)}
		</Container>
	);
};

export default AuthGate;
