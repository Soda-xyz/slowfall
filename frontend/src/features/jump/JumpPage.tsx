import { useEffect, useState } from 'react'
import { Card, Container, Group, Title, Select, Button } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import JumpForm from './JumpForm'
import JumpTable from './JumpTable'
import { fetchJumps, addPassengerToJump, addPilotToJump } from './api'
import { fetchPeople } from '../people/api'
import type { Jump, PersonDto } from './types'

export default function JumpPage() {
  const [jumps, setJumps] = useState<Jump[]>([])
  const [loading, setLoading] = useState(false)
  const [people, setPeople] = useState<PersonDto[]>([])
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null)
  const [targetJumpId, setTargetJumpId] = useState<string | null>(null)

  const loadAll = async () => {
    const ctrl = new AbortController()
    setLoading(true)
    try {
      const [js, ps] = await Promise.all([fetchJumps(ctrl.signal), fetchPeople()])
      setJumps(js)
      setPeople(ps)
    } catch (err) {
      notifications.show({ color: 'red', title: 'Load failed', message: String(err?.message || err) })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onCreated = (j: Jump) => setJumps((prev) => [...prev, j])

  const handleAddPassenger = async (jumpId: string) => {
    setTargetJumpId(jumpId)
  }

  const submitAddPassenger = async () => {
    if (!targetJumpId || !selectedPersonId) return
    try {
      await addPassengerToJump(targetJumpId, selectedPersonId)
      notifications.show({ color: 'green', title: 'Passenger added' })
      setSelectedPersonId(null)
      setTargetJumpId(null)
      await loadAll()
    } catch (err) {
      notifications.show({ color: 'red', title: 'Error', message: String(err instanceof Error ? err.message : err) })
    }
  }

  const handleAddPilot = async (jumpId: string) => {
    setTargetJumpId(jumpId)
  }

  const submitAddPilot = async () => {
    if (!targetJumpId || !selectedPersonId) return
    try {
      await addPilotToJump(targetJumpId, selectedPersonId)
      notifications.show({ color: 'green', title: 'Pilot added' })
      setSelectedPersonId(null)
      setTargetJumpId(null)
      await loadAll()
    } catch (err) {
      notifications.show({ color: 'red', title: 'Error', message: String(err instanceof Error ? err.message : err) })
    }
  }

  return (
    <>
      <Group p="md">
        <Title order={3}>Jump schedule</Title>
      </Group>

      <Container size="lg">
        <Card withBorder shadow="sm" radius="md" p="md" mb="md">
          <Title order={4} mb="sm">
            Create jump
          </Title>
          <JumpForm onCreated={onCreated} />
        </Card>

        <Card withBorder shadow="sm" radius="md" p="md">
          <Title order={4} mb="sm">
            Upcoming jumps
          </Title>
          <JumpTable jumps={jumps} onAddPassenger={handleAddPassenger} onAddPilot={handleAddPilot} />

          {targetJumpId && (
            <Card mt="md">
              <Select
                label="Select person"
                placeholder="Search people"
                searchable
                value={selectedPersonId ?? undefined}
                onChange={(v) => setSelectedPersonId(v ?? null)}
                data={people.map((p) => ({ value: p.id, label: p.name }))}
              />
              <Group mt="xs">
                <Button onClick={submitAddPassenger} disabled={!selectedPersonId}>
                  Add passenger
                </Button>
                <Button onClick={submitAddPilot} disabled={!selectedPersonId} variant="outline">
                  Add pilot
                </Button>
                <Button variant="subtle" onClick={() => { setTargetJumpId(null); setSelectedPersonId(null) }}>
                  Cancel
                </Button>
              </Group>
            </Card>
          )}
        </Card>
      </Container>
    </>
  )
}
