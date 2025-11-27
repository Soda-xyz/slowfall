import React from "react";
import { useEffect, useMemo, useState } from "react";
import { Card, Container, Grid, Group, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import PersonForm from "./PersonForm";
import PersonTable from "./PersonTable";
import { fetchPerson } from "./api";
import type { Person } from "./types";

/**
 * PersonPage
 *
 * High-level page component that coordinates fetching persons from the backend,
 * rendering the add-person form and the person table. Handles aborting fetches
 * on unmount and displays notifications on error.
 */
export default function PersonPage(): React.JSX.Element {
	const [person, setPerson] = useState<Person[]>([]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		const controller = new AbortController();
		let mounted = true;

		async function load() {
			setLoading(true);
			try {
				const data = await fetchPerson(controller.signal);
				if (!mounted) return;
				setPerson(data);
			} catch (err) {
				console.error("fetchPerson error:", err);
				const maybe = err as { name?: string };
				if (maybe.name === "AbortError") return;
				notifications.show({
					color: "red",
					title: "Load failed",
					message: String((err as Error)?.message || err),
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

	const onCreated = (person: Person) => setPerson((prev) => [...prev, person]);

	const header = useMemo(
		() => (
			<Group p="md">
				<Title order={3}>Person dashboard</Title>
			</Group>
		),
		[],
	);

	return (
		<>
			{header}
			<Container size="lg">
				<Grid gutter="md">
					<Grid.Col span={{ base: 12, md: 5 }}>
						<Card withBorder shadow="sm" radius="md" p="md">
							<Title order={4} mb="sm">
								Add person
							</Title>
							<PersonForm onCreated={onCreated} />
						</Card>
					</Grid.Col>
					<Grid.Col span={{ base: 12, md: 7 }}>
						<PersonTable person={person} loading={loading} />
					</Grid.Col>
				</Grid>
			</Container>
		</>
	);
}
