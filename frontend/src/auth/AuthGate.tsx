import React from "react";
import { Container } from "@mantine/core";
import BasicLogin, { getStoredPseudoCredentials } from "./BasicLogin";
import * as tokenStore from "../lib/tokenStore";

/**
 * AuthGate: render children only when authenticated. Otherwise show a centered login UI.
 */
export const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	// Determine auth using tokenStore or stored pseudo credentials
	let token: string | null = null;
	try {
		// read token inside try/catch but do not construct JSX here
		token = tokenStore.getToken();
	} catch {
		// ignore
	}
	if (token) return <>{children}</>;

	let hasStoredPseudo = false;
	try {
		const stored = getStoredPseudoCredentials();
		hasStoredPseudo = !!stored.user && !!stored.pass;
	} catch {
		hasStoredPseudo = false;
	}

	if (hasStoredPseudo) return <>{children}</>;

	// Fallback: show pseudo/basic login UI
	return (
		<Container mih="100vh">
			<BasicLogin onDone={() => window.location.reload()} />
		</Container>
	);
};

export default AuthGate;
