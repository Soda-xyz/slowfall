import { useEffect, useMemo, useState } from 'react'
import { AppShell, Card, Container, Grid, Group, Title } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import PersonForm from './PersonForm'
import PeopleTable from './PeopleTable'
import { fetchPeople } from './api'
import type { Person } from './types'

export default function PeoplePage() {
  const [people, setPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    fetchPeople(controller.signal)
      .then(setPeople)
      .catch((err) => notifications.show({ color: 'red', title: 'Load failed', message: String(err?.message || err) }))
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [])

  const onCreated = (p: Person) => setPeople((prev) => [...prev, p])

  const header = useMemo(
    () => (
      <Group p="md">
        <Title order={3}>People dashboard</Title>
      </Group>
    ),
    []
  )

  return (
    <AppShell header={{ height: 56 }} padding="md">
      <AppShell.Header>{header}</AppShell.Header>
      <AppShell.Main>
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
              <PeopleTable people={people} loading={loading} />
            </Grid.Col>
          </Grid>
        </Container>
      </AppShell.Main>
    </AppShell>
  )
}
