import { useEffect, useMemo, useState } from "react";
import { Card, Container, Grid, Group, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import AirportForm from "./AirportForm";
import AirportTable from "./AirportTable";
import { fetchAirports, deleteAirport } from "./api";
import type { Airport } from "./types";

export default function AirportPage() {
	const [airports, setAirports] = useState<Airport[]>([]);
	const [loading, setLoading] = useState(false);

	const onCreated = (airport: Airport) =>
		setAirports((previousAirports) => [...previousAirports, airport]);

	const handleDeleted = async (id: string) => {
		try {
			await deleteAirport({ id });
			setAirports((previousAirports) =>
				previousAirports.filter((airportItem) => airportItem.id !== id),
			);
			notifications.show({
				color: "green",
				title: "Deleted",
				message: "Airport deleted successfully",
			});
		} catch (err) {
			const error = err as unknown;
			notifications.show({
				color: "red",
				title: "Delete failed",
				message: String(error instanceof Error ? error.message : error),
			});
		}
	};

	const header = useMemo(
		() => (
			<Group p="md">
				<Title order={3}>Airport dashboard</Title>
			</Group>
		),
		[],
	);

	useEffect(() => {
		const controller = new AbortController();
		let mounted = true;

		async function load() {
			setLoading(true);
			try {
				const data = await fetchAirports(controller.signal);
				if (!mounted) return;
				setAirports(data);
			} catch (err) {
				const error = err as unknown;
				console.error("fetchAirports error:", error);
				// Ignore aborts caused by effect cleanup/unmount
				const maybe = error as { name?: string };
				if (maybe.name === "AbortError") return;
				notifications.show({
					color: "red",
					title: "Load failed",
					message: String(error instanceof Error ? error.message : error),
				});
			} finally {
				if (mounted) setLoading(false);
			}
		}

		load();
		return () => {
			mounted = false;
			controller.abort();
		};
	}, []);

	return (
		<>
			{header}
			<Container size="lg">
				<Grid gutter="md">
					<Grid.Col span={{ base: 12, md: 5 }}>
						<Card withBorder shadow="sm" radius="md" p="md">
							<Title order={4} mb="sm">
								Add airport
							</Title>
							<AirportForm onCreated={onCreated} />
						</Card>
					</Grid.Col>
					<Grid.Col span={{ base: 12, md: 7 }}>
						<AirportTable airports={airports} loading={loading} onDelete={handleDeleted} />
					</Grid.Col>
				</Grid>
			</Container>
		</>
	);
}
