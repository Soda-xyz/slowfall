import { useEffect, useMemo, useState } from 'react'
import { Card, Container, Grid, Group, Title } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import PersonForm from './PersonForm'
import PersonTable from './PersonTable'
import { fetchPerson } from './api'
import type { Person } from './types'

export default function PersonPage() {
  const [person, setPerson] = useState<Person[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    fetchPerson(controller.signal)
      .then(setPerson)
      .catch((err) => {
        console.error('fetchPerson error:', err)
        // Ignore aborts caused by effect cleanup/unmount
        if ((err as any)?.name === 'AbortError') return
        notifications.show({ color: 'red', title: 'Load failed', message: String((err as Error)?.message || err) })
      })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [])

  const onCreated = (p: Person) => setPerson((prev) => [...prev, p])

  const header = useMemo(
    () => (
      <Group p="md">
        <Title order={3}>Person dashboard</Title>
      </Group>
    ),
    []
  )

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
  )
}
