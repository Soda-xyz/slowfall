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
		if (instance && typeof instance.loginRedirect === "function") {
			instance.loginRedirect({ scopes: [`openid`, `profile`] }).catch(() => {});
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
