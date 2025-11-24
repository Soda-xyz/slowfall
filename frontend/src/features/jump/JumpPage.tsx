import { useEffect, useState } from 'react'
import { Card, Container, Group, Title, Select, Button } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import JumpForm from './JumpForm'
import JumpTable from './JumpTable'
import { fetchJumps, addSkydiverToJump, addPilotToJump } from './api'
import { fetchPerson, fetchPilots, fetchSkydivers } from '../person/api'
import type { Jump, PersonDto } from './types'

export default function JumpPage() {
  const [jumps, setJumps] = useState<Jump[]>([])
  const [person, setPerson] = useState<PersonDto[]>([])
  const [pilots, setPilots] = useState<PersonDto[]>([])
  const [skydivers, setSkydivers] = useState<PersonDto[]>([])
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null)
  const [targetJumpId, setTargetJumpId] = useState<string | null>(null)
  const [actionMode, setActionMode] = useState<'skydiver' | 'pilot' | null>(null)

  const loadAll = async () => {
    const ctrl = new AbortController()
    try {
      const [js, ps, pls, pss] = await Promise.all([
        fetchJumps(ctrl.signal),
        fetchPerson(),
        fetchPilots(),
        fetchSkydivers(),
      ])
      setJumps(js)
      setPerson(ps.map((p) => ({ ...p, id: String(p.id) })))
      setPilots(pls.map((p) => ({ ...p, id: String(p.id) })))
      setSkydivers(pss.map((p) => ({ ...p, id: String(p.id) })))
    } catch (err) {
      notifications.show({ color: 'red', title: 'Load failed', message: String(err?.message || err) })
    } finally {
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  const onCreated = (j: Jump) => setJumps((prev) => [...prev, j])

  const handleAddSkydiver = async (jumpId: string) => {
    setTargetJumpId(jumpId)
    setActionMode('skydiver')
  }

  const submitAddSkydiver = async () => {
    if (!targetJumpId || !selectedPersonId) return
    try {
      await addSkydiverToJump(targetJumpId, selectedPersonId)
      notifications.show({ color: 'green', title: 'Skydiver added', message: 'Skydiver added successfully' })
      setSelectedPersonId(null)
      setTargetJumpId(null)
      await loadAll()
    } catch (err) {
      notifications.show({ color: 'red', title: 'Error', message: String(err instanceof Error ? err.message : err) })
    }
  }

  const handleAddPilot = async (jumpId: string) => {
    setTargetJumpId(jumpId)
    setActionMode('pilot')
  }

  const submitAddPilot = async () => {
    if (!targetJumpId || !selectedPersonId) return
    try {
      await addPilotToJump(targetJumpId, selectedPersonId)
      notifications.show({ color: 'green', title: 'Pilot added', message: 'Pilot added successfully' })
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
          <JumpTable jumps={jumps} onAddSkydiver={handleAddSkydiver} onAddPilot={handleAddPilot} />

          {targetJumpId && (
            <Card mt="md">
              <Select
                label="Select person"
                placeholder="Search person"
                searchable
                value={selectedPersonId ?? undefined}
                onChange={(v) => setSelectedPersonId(v ?? null)}
                data={(actionMode === 'pilot' ? pilots : skydivers).map((p) => ({ value: p.id, label: p.name }))}
              />
              <Group mt="xs">
                {actionMode === 'skydiver' && (
                  <Button onClick={submitAddSkydiver} disabled={!selectedPersonId}>
                    Add skydiver
                  </Button>
                )}
                {actionMode === 'pilot' && (
                  <Button onClick={submitAddPilot} disabled={!selectedPersonId} variant="outline">
                    Add pilot
                  </Button>
                )}
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
