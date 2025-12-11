import { Badge, Card, Group, Loader, Table, Text, Button } from "@mantine/core";
import type { Craft } from "./types";
import React from "react";

type Props = {
	crafts: Craft[];
	loading?: boolean;
	onDelete?: (id: string) => void;
	deletingId?: string | null;
};

/**
 * CraftTable
 *
 * Displays a list of crafts in a card and exposes a delete action per row.
 */
export default function CraftTable({
	crafts,
	loading,
	onDelete,
	deletingId,
}: Props): React.JSX.Element {
	return (
		<Card withBorder shadow="sm" radius="md" p="md">
			<Group justify="space-between" mb="sm">
				<Text fw={600} size="lg">
					Crafts
				</Text>
				<Badge variant="light" color="blue">
					{crafts.length}
				</Badge>
			</Group>

			{loading ? (
				<Group justify="center" p="lg">
					<Loader />
				</Group>
			) : crafts.length === 0 ? (
				<Text c="dimmed">No crafts yet. Add the first craft using the form.</Text>
			) : (
				<Table striped highlightOnHover withTableBorder stickyHeader>
					<Table.Thead>
						<Table.Tr>
							<Table.Th>Name</Table.Th>
							<Table.Th>Registration Number</Table.Th>
							<Table.Th>Capacity Weight(kg)</Table.Th>
							<Table.Th>Capacity Persons</Table.Th>
							<Table.Th>Actions</Table.Th>
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{crafts.map((craftItem) => (
							<Table.Tr key={craftItem.id}>
								<Table.Td>{craftItem.name}</Table.Td>
								<Table.Td>{craftItem.registrationNumber}</Table.Td>
								<Table.Td>{craftItem.capacityWeight}</Table.Td>
								<Table.Td>{craftItem.capacityPersons}</Table.Td>
								<Table.Td>
									<Button
										size="xs"
										color="red"
										variant="outline"
										loading={deletingId === craftItem.id}
										onClick={() => onDelete?.(craftItem.id)}
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
