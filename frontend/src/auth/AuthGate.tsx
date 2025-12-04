import React from "react";
import { useIsAuthenticated } from "@azure/msal-react";
import { Center, Stack, Text, Container, Button } from "@mantine/core";
import { createMsalInstanceIfPossible } from "./msalClient";

/**
 * AuthGate: render children only when authenticated. Otherwise show a centered login UI.
 */
export const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const isAuthenticated = useIsAuthenticated();

	if (isAuthenticated) return <>{children}</>;

	const handleLogin = () => {
		const instance = createMsalInstanceIfPossible();
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
			// MSAL not configured; open a help dialog or redirect to a static login URL if desired.
			console.debug("MSAL not configured: cannot start redirect login");
		}
	};

	return (
		<Container mih="100vh">
			<Center style={{ minHeight: "60vh" }}>
				<Stack align="center">
					<Text size="lg">You must sign in to use the application.</Text>
					<Button onClick={handleLogin}>Sign in</Button>
				</Stack>
			</Center>
		</Container>
	);
};

export default AuthGate;
