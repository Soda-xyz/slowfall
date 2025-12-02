import React from "react";
import { useIsAuthenticated } from "@azure/msal-react";
import { Center, Stack, Text, Container, Button } from "@mantine/core";
import { msalInstance } from "./msalClient";

/**
 * AuthGate: render children only when authenticated. Otherwise show a centered login UI.
 */
export const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const isAuthenticated = useIsAuthenticated();

	if (isAuthenticated) return <>{children}</>;

	const handleLogin = () => {
		msalInstance.loginRedirect?.({ scopes: [`openid`, `profile`] });
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
