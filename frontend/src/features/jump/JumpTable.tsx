import { Table, Button, Text, Group } from '@mantine/core'
import type { Jump } from './types'

type Props = {
  jumps: Jump[]
  onAddPassenger?: (jumpId: string) => void
  onAddPilot?: (jumpId: string) => void
}

export default function JumpTable({ jumps, onAddPassenger, onAddPilot }: Props) {
  if (!jumps || jumps.length === 0) return <Text>No upcoming jumps</Text>

  const rows = jumps
    .slice()
    .sort((a, b) => new Date(a.jumpTime).getTime() - new Date(b.jumpTime).getTime())
    .map((j) => (
      <tr key={j.id}>
        <td>{new Date(j.jumpTime).toLocaleString()}</td>
        <td>{j.altitudeFeet}</td>
        <td>{j.airportId}</td>
        <td>
          <Group>
            <Button size="xs" onClick={() => onAddPassenger?.(j.id)}>
              Add passenger
            </Button>
            <Button size="xs" variant="outline" onClick={() => onAddPilot?.(j.id)}>
              Add pilot
            </Button>
          </Group>
        </td>
        <td>
          <div>
            <strong>Passengers:</strong>
            <ul>
              {j.passengers.map((p) => (
                <li key={p.id}>{p.name}</li>
              ))}
            </ul>
          </div>
          <div>
            <strong>Pilots:</strong>
            <ul>
              {j.pilots.map((p) => (
                <li key={p.id}>{p.name}</li>
              ))}
            </ul>
          </div>
        </td>
      </tr>
    ))

  return (
    <Table striped highlightOnHover>
      <thead>
        <tr>
          <th>Jump time</th>
          <th>Altitude</th>
          <th>Airport ID</th>
          <th>Actions</th>
          <th>Participants</th>
        </tr>
      </thead>
      <tbody>{rows}</tbody>
    </Table>
  )
}
