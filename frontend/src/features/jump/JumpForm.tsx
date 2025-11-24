import { useEffect, useState } from 'react'
import { Button, Group, Stack, TextInput, NumberInput, Select } from '@mantine/core'
import { DateTimePicker } from '@mantine/dates'
import { notifications } from '@mantine/notifications'
import dayjs from 'dayjs'
import type { CreateJumpRequest } from './types'
import { createJump } from './api'
import { fetchPerson, fetchPilots } from '../person/api'
import { fetchAirports } from '../airport/api'
import { fetchCrafts } from '../craft/api'
import type { Airport } from '../airport/types'
import { useAirport } from '../airport/AirportContext'

type Props = {
  onCreated?: (jump: any) => void
  airportId?: string
}

export default function JumpForm({ onCreated, airportId }: Props) {
  const { airports, selectedAirportId: globalAirportId } = useAirport()
  const [jumpTimeDate, setJumpTimeDate] = useState<Date | null>(null)
  const [craftRegistrationNumber, setCraftRegistrationNumber] = useState('')
  const [altitudeFeet, setAltitudeFeet] = useState<number | string>('')
  const [pilotId, setPilotId] = useState<string | null>(null)
  const [personOptions, setPersonOptions] = useState<{ value: string; label: string }[]>([])
  const [airportsOptions, setAirportsOptions] = useState<{ value: string; label: string }[]>([])
  const [craftsOptions, setCraftsOptions] = useState<{ value: string; label: string }[]>([])
  const [selectedAirportId, setSelectedAirportId] = useState<string | null>(airportId ?? globalAirportId ?? null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let mounted = true
    fetchPilots()
      .then((p) => {
        if (!mounted) return
        setPersonOptions(p.map((pp) => ({ value: String(pp.id), label: pp.name })))
      })
      .catch(() => {})

    fetchCrafts()
      .then((c) => {
        if (!mounted) return
        setCraftsOptions(c.map((cr) => ({ value: String(cr.registrationNumber), label: cr.name })))
        if (!craftRegistrationNumber && c.length > 0) setCraftRegistrationNumber(String(c[0].registrationNumber))
      })
      .catch(() => {})
    if (airports && airports.length > 0) {
      setAirportsOptions(airports.map((ap) => ({ value: String(ap.id), label: ap.name })))
      if (!selectedAirportId) setSelectedAirportId(airportId ?? globalAirportId ?? (airports.length > 0 ? String(airports[0].id) : null))
    } else {
      fetchAirports()
        .then((a) => {
          if (!mounted) return
          setAirportsOptions(a.map((ap) => ({ value: String(ap.id), label: ap.name })))
          if (!selectedAirportId && a.length > 0) setSelectedAirportId(String(a[0].id))
        })
        .catch(() => {})
    }

    return () => {
      mounted = false
    }
  }, [airports])

  useEffect(() => {
    if (airportId) return
    setSelectedAirportId(globalAirportId ?? null)
  }, [globalAirportId, airportId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const airportToUse = airportId ?? selectedAirportId ?? globalAirportId
    if (!jumpTimeDate || !airportToUse || !craftRegistrationNumber || altitudeFeet === '' || Number.isNaN(Number(altitudeFeet))) {
      notifications.show({ color: 'red', title: 'Missing fields', message: 'All fields are required' })
      return
    }

    const payload: CreateJumpRequest = {
      jumpTime: dayjs(jumpTimeDate).format('YYYY-MM-DDTHH:mm:ss'),
      airportId: airportToUse,
      craftRegistrationNumber,
      altitudeFeet: Number(altitudeFeet),
      pilotId: pilotId || undefined,
    }

    try {
      setSubmitting(true)
      const created = await createJump(payload)
      notifications.show({ color: 'green', title: 'Jump created', message: 'Jump scheduled' })
      setJumpTimeDate(null)
      setCraftRegistrationNumber('')
      setAltitudeFeet('')
      setPilotId(null)
      onCreated?.(created)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create jump'
      notifications.show({ color: 'red', title: 'Error', message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="sm">
        <Select label="Craft" placeholder="Select craft" withAsterisk data={craftsOptions} value={craftRegistrationNumber ?? undefined} onChange={(v) => setCraftRegistrationNumber(v ?? '')} searchable />
        <DateTimePicker label="Jump time" value={jumpTimeDate} onChange={setJumpTimeDate} withSeconds={false} />
        <NumberInput label="Altitude (feet)" withAsterisk min={0} value={altitudeFeet as number | string} onChange={setAltitudeFeet} />

        <Select label="Pilot (optional)" placeholder="Select pilot" data={personOptions} value={pilotId ?? undefined} onChange={setPilotId} searchable />

        <Group justify="flex-end" mt="xs">
          <Button type="submit" loading={submitting} variant="filled" disabled={!(selectedAirportId ?? airportId ?? globalAirportId) || submitting}>
            Create jump
          </Button>
        </Group>
      </Stack>
    </form>
  )
}
