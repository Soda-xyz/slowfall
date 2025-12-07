import React, { useState } from "react";
import { Tabs, Box } from "@mantine/core";
import { DashboardPage } from "./dashboard";
import { DatabaseControlPage } from "./databaseControl";

/**
 * MainTabs
 *
 * Renders the application's main tabs (Dashboard and Database).
 * Maintains local state for the active tab.
 */
export default function MainTabs(): React.JSX.Element {
	const [active, setActive] = useState<string | null>("dashboard");
	return (
		<Box>
			<Tabs value={active} onChange={setActive} variant="outline">
				<Tabs.List>
					<Tabs.Tab value="dashboard">Dashboard</Tabs.Tab>
					<Tabs.Tab value="database">Database</Tabs.Tab>
				</Tabs.List>

				<Tabs.Panel value="dashboard" pt="sm">
					<DashboardPage />
				</Tabs.Panel>

				<Tabs.Panel value="database" pt="sm">
					<DatabaseControlPage />
				</Tabs.Panel>
			</Tabs>
		</Box>
	);
}
