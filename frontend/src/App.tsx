import React from "react";
import { AppShell, Group, Tabs, Title } from "@mantine/core";
import { AirportProvider, AirportSelector } from "./features/airport/AirportContext";
import { DashboardPage } from "./features/dashboard";
import { DatabaseControlPage } from "./features/databaseControl";
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
	return (
		<AirportProvider>
			<AppShell header={{ height: 64 }} padding="md">
				<Tabs defaultValue="dashboard">
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
							</Group>
						</Group>
					</AppShell.Header>

					<AppShell.Main>
						<Tabs.Panel value="dashboard" pt="sm">
							<DashboardPage />
						</Tabs.Panel>
						<Tabs.Panel value="database" pt="sm">
							<DatabaseControlPage />
						</Tabs.Panel>
					</AppShell.Main>
				</Tabs>
			</AppShell>
		</AirportProvider>
	);
}
