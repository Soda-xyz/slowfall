import { Badge, Card, Group, Loader, Table, Text } from '@mantine/core'
import type { Person } from './types'

type Props = {
  people: Person[]
  loading?: boolean
}

export default function PeopleTable({ people, loading }: Props) {
  return (
    <Card withBorder shadow="sm" radius="md" p="md">
      <Group justify="space-between" mb="sm">
        <Text fw={600} size="lg">
          People in database
        </Text>
        <Badge variant="light" color="blue">
          {people.length}
        </Badge>
      </Group>

      {loading ? (
        <Group justify="center" p="lg">
          <Loader />
        </Group>
      ) : people.length === 0 ? (
        <Text c="dimmed">No people yet. Add the first person using the form.</Text>
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
            {people.map((p) => (
              <Table.Tr key={p.id}>
                <Table.Td>{p.name}</Table.Td>
                <Table.Td>{p.weight}</Table.Td>
                <Table.Td>{p.email}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Card>
  )
}
