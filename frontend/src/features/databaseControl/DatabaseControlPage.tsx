import React, { useEffect, useState } from "react";
import { Grid, Card, Title, Stack, Group, Loader, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { PersonTable, PersonForm } from "../person";
import { AirportTable, AirportForm } from "../airport";
import { CraftTable, CraftForm } from "../craft";
import { fetchPerson } from "../person/api";
import { fetchAirports } from "../airport/api";
import { fetchCrafts } from "../craft/api";
import type { Person } from "../person";
import type { Airport } from "../airport/types";
import type { Craft } from "../craft/types";

/**
 * DatabaseControlPage
 *
 * Administrative UI that provides quick access to create and list people and airports.
 * Loads both people, airports and crafts on mount and shows a loader while fetching.
 */
export default function DatabaseControlPage(): React.JSX.Element {
	const [people, setPeople] = useState<Person[] | null>(null);
	const [airports, setAirports] = useState<Airport[] | null>(null);
	const [crafts, setCrafts] = useState<Craft[] | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let mounted = true;
		Promise.all([fetchPerson(), fetchAirports(), fetchCrafts()])
			.then(([peopleResp, airportsResp, craftsResp]) => {
				if (!mounted) return;
				setPeople(peopleResp);
				setAirports(airportsResp);
				setCrafts(craftsResp);
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
							<PersonForm
								onCreated={(createdPerson) =>
									setPeople((prev) => (prev ? [createdPerson, ...prev] : [createdPerson]))
								}
							/>
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
							<AirportForm
								onCreated={(createdAirport) =>
									setAirports((prev) => (prev ? [createdAirport, ...prev] : [createdAirport]))
								}
							/>
						</Card>
						<Card shadow="xs" padding="md">
							<Title order={4}>Airports</Title>
							{airports && <AirportTable airports={airports} />}
							{!airports && <Text c="dimmed">No airports found.</Text>}
						</Card>
					</Stack>
				</Grid.Col>
				<Grid.Col span={6}>
					<Stack gap={"xs"}>
						<Card shadow="xs" padding="md">
							<CraftForm
								onCreated={(createdCraft) =>
									setCrafts((prev) => (prev ? [createdCraft, ...prev] : [createdCraft]))
								}
							/>
						</Card>
						<Card shadow="xs" padding="md">
							<Title order={4}>Crafts</Title>
							{crafts && <CraftTable crafts={crafts} />}
							{!crafts && <Text c="dimmed">No crafts found.</Text>}
						</Card>
					</Stack>
				</Grid.Col>
			</Grid>
		</Stack>
	);
}
