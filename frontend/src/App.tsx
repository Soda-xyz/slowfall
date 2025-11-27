import { AppShell, Group, Tabs } from "@mantine/core";
import { AirportProvider, AirportSelector } from "./features/airport/AirportContext";
import { DashboardPage } from "./features/dashboard";
import { DatabaseControlPage } from "./features/databaseControl";
import "@mantine/core/styles.css";

export default function App() {
	return (
		<AirportProvider>
			<AppShell header={{ height: 64 }} padding="md">
				<Tabs defaultValue="dashboard">
					<AppShell.Header>
						<Group justify="space-between" p="md" align="center">
							<Group>
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
