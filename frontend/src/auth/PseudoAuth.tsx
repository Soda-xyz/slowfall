import React from "react";
import { Button } from "@mantine/core";
import { clearPseudoCredentials } from "./BasicLogin";
import * as tokenStore from "../lib/tokenStore";
import { logger } from "../lib/log";

/**
 * PseudoLogoutButton
 *
 * Button used to clear locally-stored pseudo credentials and force a reload.
 */
export const PseudoLogoutButton: React.FC = () => {
	/**
	 * Clear pseudo credentials and tokens, then reload the page.
	 */
	const handleLogout = () => {
		try {
			clearPseudoCredentials();
			tokenStore.clearToken();
			tokenStore.clearRefreshToken();
		} catch (err) {
			logger.debug("PseudoLogoutButton: failed during logout cleanup:", err);
		}
		window.location.reload();
	};

	return (
		<Button variant="outline" size="xs" onClick={handleLogout}>
			Sign out (pseudo)
		</Button>
	);
};

export default PseudoLogoutButton;
