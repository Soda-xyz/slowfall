import React from "react";
import { AppShell, Group, Tabs, Title } from "@mantine/core";
import { AirportProvider, AirportSelector } from "./features/airport/AirportContext";
import { DashboardPage } from "./features/dashboard";
import { DatabaseControlPage } from "./features/databaseControl";
import LoginPage from "./features/login/LoginPage";
import ProtectedRoute from "./features/login/ProtectedRoute";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import "@mantine/core/styles.css";

/**
 * App
 *
 * Application root component. Wraps the app in feature-level providers (for example
 * `AirportProvider`) and composes the main shell and navigation tabs.
 *
 * Keep this component thin — place page-specific logic in the page components
 * under `src/features/*`.
 */
export default function App(): React.JSX.Element {
	const navigate = useNavigate();
	const location = useLocation();
	// Derive the current tab from the location.pathname instead of setting state inside an effect
	const tab = React.useMemo(() => {
		const path = location.pathname;
		if (path.startsWith("/database")) return "database";
		if (path.startsWith("/login")) return "login";
		return "dashboard";
	}, [location.pathname]);

	return (
		<AirportProvider>
			<AppShell header={{ height: 64 }} padding="md">
				<Tabs
					value={tab}
					onChange={(value: string | null) => {
						if (!value) return;
						if (value === "dashboard") navigate("/");
						else if (value === "database") navigate("/database");
						else if (value === "login") navigate("/login");
					}}
				>
					<AppShell.Header>
						<Group justify="space-between" p="md" align="center">
							<Group>
								{/* Add brand/title here so e2e tests can verify it exists */}
								<Title order={3}>Slowfall</Title>
								<Tabs.List>
									<Tabs.Tab value="dashboard">Dashboard</Tabs.Tab>
									<Tabs.Tab value="database">Database</Tabs.Tab>
									<Tabs.Tab value="login">Login</Tabs.Tab>
								</Tabs.List>
							</Group>

							<Group>
								<AirportSelector />
							</Group>
						</Group>
					</AppShell.Header>

					<AppShell.Main>
						<Routes>
							<Route path="/" element={<DashboardPage />} />
							<Route
								path="/database"
								element={
									<ProtectedRoute>
										<DatabaseControlPage />
									</ProtectedRoute>
								}
							/>
							<Route path="/login" element={<LoginPage />} />
						</Routes>
					</AppShell.Main>
				</Tabs>
			</AppShell>
		</AirportProvider>
	);
}
