import { useState } from "react";
import { AppShell, Group, SegmentedControl, Space } from "@mantine/core";
import { PersonPage, AirportPage, JumpPage } from "./features";
import { AirportProvider, AirportSelector } from "./features/airport/AirportContext";
import "./App.css";

export default function App() {
	const [view, setView] = useState<"person" | "airport" | "jump">("person");

	const header = (
		<Group justify="space-between" p="md" align="center">
			<Group>
				<SegmentedControl
					value={view}
					onChange={(v) => setView(v as "person" | "airport" | "jump")}
					data={[
						{ label: "Person", value: "person" },
						{ label: "Airport", value: "airport" },
						{ label: "Jump", value: "jump" },
					]}
				/>
				<Space w="md" />
				<AirportSelector />
			</Group>
		</Group>
	);

	return (
		<AirportProvider>
			<AppShell header={{ height: 64 }} padding="md">
				<AppShell.Header>{header}</AppShell.Header>
				<AppShell.Main>
					{view === "person" && <PersonPage />}
					{view === "airport" && <AirportPage />}
					{view === "jump" && <JumpPage />}
				</AppShell.Main>
			</AppShell>
		</AirportProvider>
	);
}
