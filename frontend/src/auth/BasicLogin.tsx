import React from "react";
import { TextInput, PasswordInput, Button, Stack, Text, Center, Container } from "@mantine/core";
import { logger } from "../lib/log";

const PSEUDO_USER_KEY = "pseudo_user";
const PSEUDO_PASS_KEY = "pseudo_pass";

/**
 * Persist pseudo/basic credentials to localStorage for this browser.
 * This is a convenience for local development and demos; not intended for production use.
 * @param user - username to save
 * @param pass - password to save
 */
export function savePseudoCredentials(user: string, pass: string): void {
	try {
		if (typeof window !== "undefined") {
			localStorage.setItem(PSEUDO_USER_KEY, user);
			localStorage.setItem(PSEUDO_PASS_KEY, pass);
		}
	} catch (err) {
		logger.debug("savePseudoCredentials: failed to write to localStorage:", err);
	}
}

/**
 * Remove stored pseudo/basic credentials from localStorage.
 */
export function clearPseudoCredentials(): void {
	try {
		if (typeof window !== "undefined") {
			localStorage.removeItem(PSEUDO_USER_KEY);
			localStorage.removeItem(PSEUDO_PASS_KEY);
		}
	} catch (err) {
		logger.debug("clearPseudoCredentials: failed to remove pseudo credentials:", err);
	}
}

/**
 * Read pseudo/basic credentials from localStorage, if present.
 * @returns object with optional `user` and `pass` properties
 */
export function getStoredPseudoCredentials(): { user?: string; pass?: string } {
	try {
		if (typeof window === "undefined") return {};
		return {
			user: localStorage.getItem(PSEUDO_USER_KEY) ?? undefined,
			pass: localStorage.getItem(PSEUDO_PASS_KEY) ?? undefined,
		};
	} catch (err) {
		logger.debug("getStoredPseudoCredentials: failed to read pseudo credentials:", err);
		return {};
	}
}

/**
 * BasicLogin
 *
 * Simple pseudo login UI used for local/demo flows. Saves credentials to
 * localStorage and calls `onDone` when finished.
 */
const BasicLogin: React.FC<{ onDone?: () => void }> = ({ onDone }) => {
	const [user, setUser] = React.useState("");
	const [pass, setPass] = React.useState("");
	const [saved, setSaved] = React.useState(false);

	/**
	 * Save the entered credentials and notify parent via onDone.
	 */
	const handleSave = () => {
		savePseudoCredentials(user, pass);
		setSaved(true);
		if (onDone) onDone();
	};

	return (
		<Container>
			<Center style={{ minHeight: "60vh" }}>
				<Stack style={{ width: 360 }}>
					<Text size="lg">Sign in (pseudo)</Text>
					<TextInput
						label="Username"
						value={user}
						onChange={(e) => setUser(e.currentTarget.value)}
					/>
					<PasswordInput
						label="Password"
						value={pass}
						onChange={(e) => setPass(e.currentTarget.value)}
					/>
					<Button onClick={handleSave}>Sign in</Button>
					{saved && <Text color="green">Credentials saved for this browser session.</Text>}
				</Stack>
			</Center>
		</Container>
	);
};

export default BasicLogin;
