import React from "react";
import { TextInput, PasswordInput, Button, Stack, Text, Center, Container } from "@mantine/core";

const PSEUDO_USER_KEY = "pseudo_user";
const PSEUDO_PASS_KEY = "pseudo_pass";

export function savePseudoCredentials(user: string, pass: string) {
	try {
		if (typeof window !== "undefined") {
			localStorage.setItem(PSEUDO_USER_KEY, user);
			localStorage.setItem(PSEUDO_PASS_KEY, pass);
		}
	} catch {
		// ignore
	}
}

export function clearPseudoCredentials() {
	try {
		if (typeof window !== "undefined") {
			localStorage.removeItem(PSEUDO_USER_KEY);
			localStorage.removeItem(PSEUDO_PASS_KEY);
		}
	} catch {
		// ignore
	}
}

export function getStoredPseudoCredentials(): { user?: string; pass?: string } {
	try {
		if (typeof window === "undefined") return {};
		return {
			user: localStorage.getItem(PSEUDO_USER_KEY) ?? undefined,
			pass: localStorage.getItem(PSEUDO_PASS_KEY) ?? undefined,
		};
	} catch {
		return {};
	}
}

const BasicLogin: React.FC<{ onDone?: () => void }> = ({ onDone }) => {
	const [user, setUser] = React.useState("");
	const [pass, setPass] = React.useState("");
	const [saved, setSaved] = React.useState(false);

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
