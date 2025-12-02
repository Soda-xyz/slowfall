import React from "react";
import { AppShell, Group, Tabs, Title } from "@mantine/core";
import { AirportProvider, AirportSelector } from "./features/airport/AirportContext";
import { DashboardPage } from "./features/dashboard";
import { DatabaseControlPage } from "./features/databaseControl";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import AuthGate from "./auth/AuthGate";
import { SignOutButton } from "./auth/MsalProvider";

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
	/**
	 * Derive the current tab from the location.pathname instead of setting state inside an effect.
	 */
	const tab = React.useMemo(() => {
		const path = location.pathname;
		if (path.startsWith("/database")) return "database";
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
								</Tabs.List>
							</Group>

							<Group>
								<AirportSelector />
								<SignOutButton />
							</Group>
						</Group>
					</AppShell.Header>

					<AppShell.Main>
						<Routes>
							<Route
								path="/"
								element={
									<AuthGate>
										<DashboardPage />
									</AuthGate>
								}
							/>
							<Route
								path="/database"
								element={
									<AuthGate>
										<DatabaseControlPage />
									</AuthGate>
								}
							/>
						</Routes>
					</AppShell.Main>
				</Tabs>
			</AppShell>
		</AirportProvider>
	);
}
