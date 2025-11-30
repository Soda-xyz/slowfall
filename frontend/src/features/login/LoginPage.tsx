import React, { useState } from "react";
import { Box, Button, Group, Notification, PasswordInput, TextInput, Title } from "@mantine/core";
import { setAuthToken } from "../../lib/fetchClient";
import { setRefreshToken } from "../../lib/tokenStore";
import { useLocation, useNavigate } from "react-router-dom";

interface ViteEnv {
	VITE_API_BASE_URL?: string;
}

interface LoginLocationState {
	from?: { pathname?: string };
}

// Minimal login page that calls the backend /web-auth/login endpoint and stores access token
export default function LoginPage(): React.JSX.Element {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const navigate = useNavigate();
	const location = useLocation();

	async function doLogin(e?: React.FormEvent) {
		e?.preventDefault();
		setError(null);
		setLoading(true);
		try {
			const env = import.meta.env as unknown as ViteEnv;
			const base = env.VITE_API_BASE_URL;
			const url = (base ? base.replace(/\/$/, "") : "") + "/web-auth/login";

			// POST username/password to the backend and expect JSON { access_token, refresh_token? }
			const res = await fetch(url, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ username, password }),
			});

			if (!res.ok) {
				const text = await res.text().catch(() => "");
				setError(text || `Login failed: ${res.status}`);
				return;
			}

			const data = await res.json().catch(() => null);
			if (!data || typeof data.access_token !== "string") {
				setError("Invalid login response from server");
				return;
			}

			// Store tokens
			setAuthToken(data.access_token);
			if (data.refresh_token && typeof data.refresh_token === "string") {
				try {
					setRefreshToken(data.refresh_token);
				} catch (loginError) {
					// If storing the refresh token fails (storage quota, private mode), log for debug
					// without exposing token values.
					console.debug("Failed to persist refresh token in tokenStore", loginError);
				}
			}

			// Navigate to original destination (if any)
			const state = location.state as LoginLocationState | null;
			navigate(state?.from?.pathname ?? "/", { replace: true });
		} catch (loginError) {
			// Provide a bit more debug information while keeping the user-facing error generic
			console.debug("Login request failed", loginError);
			setError("Network error during login");
		} finally {
			setLoading(false);
		}
	}

	return (
		<Box style={{ maxWidth: 420 }} mx="auto">
			<Title order={2} mb="md">
				Login
			</Title>
			<form onSubmit={doLogin}>
				<TextInput
					label="Username"
					value={username}
					onChange={(e) => setUsername(e.currentTarget.value)}
					mb="sm"
				/>
				<PasswordInput
					label="Password"
					value={password}
					onChange={(e) => setPassword(e.currentTarget.value)}
					mb="sm"
				/>
				<Group style={{ justifyContent: "flex-end" }}>
					<Button type="submit" loading={loading}>
						Sign in
					</Button>
				</Group>
			</form>
			{error && (
				<Notification color="red" mt="md">
					{error}
				</Notification>
			)}
		</Box>
	);
}
