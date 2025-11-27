import { Badge, Card, Group, Loader, Table, Text, Button } from "@mantine/core";
import type { Airport } from "./types";
import React from "react";

type Props = {
	airports: Airport[];
	loading?: boolean;
	onDelete?: (id: string) => void;
	deletingId?: string | null;
};

/**
 * AirportTable
 *
 * Displays a list of airports in a card and exposes a delete action per row.
 */
export default function AirportTable({
	airports,
	loading,
	onDelete,
	deletingId,
}: Props): React.JSX.Element {
	return (
		<Card withBorder shadow="sm" radius="md" p="md">
			<Group justify="space-between" mb="sm">
				<Text fw={600} size="lg">
					Airports
				</Text>
				<Badge variant="light" color="blue">
					{airports.length}
				</Badge>
			</Group>

			{loading ? (
				<Group justify="center" p="lg">
					<Loader />
				</Group>
			) : airports.length === 0 ? (
				<Text c="dimmed">No airports yet. Add the first airport using the form.</Text>
			) : (
				<Table striped highlightOnHover withTableBorder stickyHeader>
					<Table.Thead>
						<Table.Tr>
							<Table.Th>Name</Table.Th>
							<Table.Th>IcaoCode</Table.Th>
							<Table.Th>Actions</Table.Th>
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{airports.map((airportItem) => (
							<Table.Tr key={airportItem.id}>
								<Table.Td>{airportItem.name}</Table.Td>
								<Table.Td>{airportItem.icaoCode}</Table.Td>
								<Table.Td>
									<Button
										size="xs"
										color="red"
										variant="outline"
										loading={deletingId === airportItem.id}
										onClick={() => onDelete?.(airportItem.id)}
									>
										Delete
									</Button>
								</Table.Td>
							</Table.Tr>
						))}
					</Table.Tbody>
				</Table>
			)}
		</Card>
	);
}
