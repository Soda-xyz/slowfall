import React, { useEffect, useState } from "react";
import { Button, Group, TextInput, Text } from "@mantine/core";
import { getAuthToken, setAuthToken, clearAuthToken } from "../../lib/fetchClient";

export default function LoginControl(): React.JSX.Element {
	const [token, setToken] = useState<string>(() => getAuthToken() ?? "");

	useEffect(() => {
		function onStorage(e: StorageEvent) {
			if (e.storageArea === sessionStorage && e.key === "auth_access_token") {
				setToken(sessionStorage.getItem("auth_access_token") ?? "");
			}
		}
		window.addEventListener("storage", onStorage);
		return () => window.removeEventListener("storage", onStorage);
	}, []);

	return (
		<Group align="center" style={{ gap: 8 }}>
			<Text size="sm">Access Token</Text>
			<TextInput
				aria-label="Access Token"
				value={token}
				onChange={(e) => setToken(e.currentTarget.value)}
				placeholder="paste access token"
				style={{ minWidth: 260 }}
			/>
			<Button
				size="xs"
				onClick={() => {
					if (!token) return;
					setAuthToken(token);
					// Do not log token
				}}
				disabled={!token}
			>
				Set Token
			</Button>
			<Button
				size="xs"
				variant="outline"
				onClick={() => {
					clearAuthToken();
					setToken("");
				}}
			>
				Clear
			</Button>
		</Group>
	);
}
