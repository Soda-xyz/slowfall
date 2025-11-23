import { Badge, Card, Group, Loader, Table, Text, Button } from '@mantine/core'
import type { Airport } from './types'

type Props = {
  airports: Airport[]
  loading?: boolean
  onDelete?: (id: string) => void
}

export default function AirportTable({ airports, loading, onDelete }: Props) {
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
            {airports.map((a) => (
              <Table.Tr key={a.id}>
                <Table.Td>{a.name}</Table.Td>
                <Table.Td>{a.icaoCode}</Table.Td>
                <Table.Td>
                  <Button size="xs" color="red" variant="outline" onClick={() => onDelete?.(a.id)}>
                    Delete
                  </Button>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Card>
  )
}
