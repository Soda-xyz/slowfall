import { Badge, Card, Group, Loader, Table, Text } from "@mantine/core";
import type { Person } from "./types";

type Props = {
	person: Person[];
	loading?: boolean;
};

export default function PersonTable({ person, loading }: Props) {
	return (
		<Card withBorder shadow="sm" radius="md" p="md">
			<Group justify="space-between" mb="sm">
				<Text fw={600} size="lg">
					Person in database
				</Text>
				<Badge variant="light" color="blue">
					{person.length}
				</Badge>
			</Group>

			{loading ? (
				<Group justify="center" p="lg">
					<Loader />
				</Group>
			) : person.length === 0 ? (
				<Text c="dimmed">No person yet. Add the first person using the form.</Text>
			) : (
				<Table striped highlightOnHover withTableBorder stickyHeader>
					<Table.Thead>
						<Table.Tr>
							<Table.Th>Name</Table.Th>
							<Table.Th>Weight</Table.Th>
							<Table.Th>Email</Table.Th>
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{person.map((personItem) => (
							<Table.Tr key={personItem.id}>
								<Table.Td>{personItem.name}</Table.Td>
								<Table.Td>{personItem.weight}</Table.Td>
								<Table.Td>{personItem.email}</Table.Td>
							</Table.Tr>
						))}
					</Table.Tbody>
				</Table>
			)}
		</Card>
	);
}
