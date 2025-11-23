import { useEffect, useMemo, useState } from 'react'
import { Card, Container, Grid, Group, Title } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import AirportForm from './AirportForm'
import AirportTable from './AirportTable'
import { fetchAirports, deleteAirport } from './api'
import type { Airport } from './types'

export default function AirportPage() {
  const [airports, setAirports] = useState<Airport[]>([])
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    fetchAirports(controller.signal)
      .then(setAirports)
      .catch((err) => notifications.show({ color: 'red', title: 'Load failed', message: String(err?.message || err) }))
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [])

  const onCreated = (a: Airport) => setAirports((prev) => [...prev, a])

  const handleDeleted = async (id: string) => {
    setDeleting(id)
    try {
      await deleteAirport(id)
      setAirports((prev) => prev.filter((a) => a.id !== id))
      notifications.show({ color: 'green', title: 'Deleted', message: 'Airport deleted successfully' })
    } catch (err) {
      notifications.show({ color: 'red', title: 'Delete failed', message: String(err?.message || err) })
    } finally {
      setDeleting(null)
    }
  }

  const header = useMemo(
    () => (
      <Group p="md">
        <Title order={3}>Airport dashboard</Title>
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
                Add airport
              </Title>
              <AirportForm onCreated={onCreated} />
            </Card>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 7 }}>
            <AirportTable airports={airports} loading={loading} />
          </Grid.Col>
        </Grid>
      </Container>
    </>
  )
}