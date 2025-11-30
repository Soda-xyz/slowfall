import React, { useState } from "react";
import { TextInput, PasswordInput, Button, Group, Box, Title, Notification } from "@mantine/core";
import { setAuthToken } from "../../lib/fetchClient";
import { useNavigate, useLocation } from "react-router-dom";

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
			const res = await fetch(url, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ username, password }),
			});
			if (!res.ok) {
				setError(`Login failed: ${res.status}`);
				return;
			}
			const data = await res.json().catch(() => null);
			if (!data || typeof data.access_token !== "string") {
				setError("Invalid login response from server");
				return;
			}
			setAuthToken(data.access_token);
			// On success navigate to original destination or home
			const state = (location.state as unknown as LoginLocationState) ?? {};
			const dest = state.from?.pathname ?? "/";
			navigate(dest, { replace: true });
		} catch {
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
