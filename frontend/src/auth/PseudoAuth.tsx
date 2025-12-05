import React from "react";
import { Button } from "@mantine/core";
import { clearPseudoCredentials } from "./BasicLogin";
import * as tokenStore from "../lib/tokenStore";

export const PseudoLogoutButton: React.FC = () => {
	const handleLogout = () => {
		try {
			// Clear any stored pseudo creds used for Basic auth
			clearPseudoCredentials();
			// Also clear any stored access token / refresh token to fully clear auth state
			tokenStore.clearToken();
			tokenStore.clearRefreshToken();
		} catch {
			// swallow
		}
		// Reload so UI re-renders into login state
		window.location.reload();
	};

	return (
		<Button variant="outline" size="xs" onClick={handleLogout}>
			Sign out (pseudo)
		</Button>
	);
};

export default PseudoLogoutButton;
