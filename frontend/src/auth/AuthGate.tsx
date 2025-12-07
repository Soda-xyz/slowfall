import React from "react";
import { Container } from "@mantine/core";
import BasicLogin, { getStoredPseudoCredentials } from "./BasicLogin";
import * as tokenStore from "../lib/tokenStore";
import { logger } from "../lib/log";

/**
 * AuthGate: render children only when authenticated. Otherwise show a centered login UI.
 */
export const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	let token: string | null = null;
	try {
		token = tokenStore.getToken();
	} catch (err) {
		logger.debug("AuthGate: failed to read token from tokenStore:", err);
	}
	if (token) return <>{children}</>;

	let hasStoredPseudo = false;
	try {
		const stored = getStoredPseudoCredentials();
		hasStoredPseudo = !!stored.user && !!stored.pass;
	} catch (err) {
		logger.debug("AuthGate: failed to read stored pseudo credentials:", err);
		hasStoredPseudo = false;
	}

	if (hasStoredPseudo) return <>{children}</>;

	return (
		<Container mih="100vh">
			<BasicLogin onDone={() => window.location.reload()} />
		</Container>
	);
};

export default AuthGate;
