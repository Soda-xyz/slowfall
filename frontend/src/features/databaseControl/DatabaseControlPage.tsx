import { useEffect, useState } from "react";
import { Grid, Card, Title, Stack, Group, Loader, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { PersonTable, PersonForm } from "../person";
import { AirportTable, AirportForm } from "../airport";
import { fetchPerson } from "../person/api";
import { fetchAirports } from "../airport/api";
import type { Person } from "../person";
import type { Airport } from "../airport/types";

export default function DatabaseControlPage() {
	const [people, setPeople] = useState<Person[] | null>(null);
	const [airports, setAirports] = useState<Airport[] | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let mounted = true;
		Promise.all([fetchPerson(), fetchAirports()])
			.then(([peopleResp, airportsResp]) => {
				if (!mounted) return;
				setPeople(peopleResp);
				setAirports(airportsResp);
			})
			.catch((err) => {
				notifications.show({ color: "red", title: "Failed to load", message: String(err) });
			})
			.finally(() => mounted && setLoading(false));
		return () => {
			mounted = false;
		};
	}, []);

	if (loading) {
		return (
			<Group justify="center" p="lg">
				<Loader />
			</Group>
		);
	}

	return (
		<Stack gap="md">
			<Title order={3}>Database Control</Title>
			<Grid>
				<Grid.Col span={6}>
					<Stack gap={"xs"}>
						<Card shadow="xs" padding="md">
							<PersonForm />
						</Card>
						<Card shadow="xs" padding="md">
							<Title order={4}>People</Title>
							{people && <PersonTable person={people} />}
							{!people && <Text c="dimmed">No people found.</Text>}
						</Card>
					</Stack>
				</Grid.Col>
				<Grid.Col span={6}>
					<Stack gap={"xs"}>
						<Card shadow="xs" padding="md">
							<AirportForm />
						</Card>
						<Card shadow="xs" padding="md">
							<Title order={4}>Airports</Title>
							{airports && <AirportTable airports={airports} />}
							{!airports && <Text c="dimmed">No airports found.</Text>}
						</Card>
					</Stack>
				</Grid.Col>
			</Grid>
		</Stack>
	);
}
