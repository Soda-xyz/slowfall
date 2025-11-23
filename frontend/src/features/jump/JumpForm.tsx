import { useEffect, useState } from 'react'
import { Button, Group, Stack, TextInput, NumberInput, Select } from '@mantine/core'
import { DateTimePicker } from '@mantine/dates'
import { notifications } from '@mantine/notifications'
import dayjs from 'dayjs'
import type { CreateJumpRequest } from './types'
import { createJump } from './api'
import { fetchPeople, fetchPilots } from '../people/api'
import { fetchAirports } from '../airport/api'
import { fetchCrafts } from '../craft/api'
import type { Airport } from '../airport/types'

type Props = {
  onCreated?: (jump: any) => void
  airportId?: string
}

export default function JumpForm({ onCreated, airportId }: Props) {
  const [jumpTimeDate, setJumpTimeDate] = useState<Date | null>(null)
  const [craftRegistrationNumber, setCraftRegistrationNumber] = useState('')
  const [altitudeFeet, setAltitudeFeet] = useState<number | string>('')
  const [pilotId, setPilotId] = useState<string | null>(null)
  const [peopleOptions, setPeopleOptions] = useState<{ value: string; label: string }[]>([])
  const [airportsOptions, setAirportsOptions] = useState<{ value: string; label: string }[]>([])
  const [craftsOptions, setCraftsOptions] = useState<{ value: string; label: string }[]>([])
  const [selectedAirportId, setSelectedAirportId] = useState<string | null>(airportId ?? null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let mounted = true
    // load pilots for pilot select
    fetchPilots()
      .then((p) => {
        if (!mounted) return
        setPeopleOptions(p.map((pp) => ({ value: String(pp.id), label: pp.name })))
      })
      .catch(() => {})

    // load crafts for craft select
    fetchCrafts()
      .then((c) => {
        if (!mounted) return
        // use registrationNumber as Select value, show name as label
        setCraftsOptions(c.map((cr) => ({ value: String(cr.registrationNumber), label: cr.name })))
        // if there's no craft registration yet, default to first craft's registration
        if (!craftRegistrationNumber && c.length > 0) setCraftRegistrationNumber(String(c[0].registrationNumber))
      })
      .catch(() => {})

    // load airports for airport select
    fetchAirports()
      .then((a) => {
        if (!mounted) return
        setAirportsOptions(a.map((ap) => ({ value: String(ap.id), label: ap.name })))
        // if an airportId prop was provided, keep selectedAirportId; otherwise default to first
        if (!selectedAirportId && a.length > 0) setSelectedAirportId(String(a[0].id))
      })
      .catch(() => {})

    return () => {
      mounted = false
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const airportToUse = selectedAirportId ?? airportId
    if (!jumpTimeDate || !airportToUse || !craftRegistrationNumber || altitudeFeet === '' || Number.isNaN(Number(altitudeFeet))) {
      notifications.show({ color: 'red', title: 'Missing fields', message: 'All fields are required' })
      return
    }

    const payload: CreateJumpRequest = {
      // format as local date-time without timezone offset so backend LocalDateTime parses it as intended
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
        <Select label="Airport" placeholder="Select airport" data={airportsOptions} value={selectedAirportId ?? undefined} onChange={(v) => setSelectedAirportId(v ?? null)} searchable />
        <Select label="Craft" placeholder="Select craft" withAsterisk data={craftsOptions} value={craftRegistrationNumber ?? undefined} onChange={(v) => setCraftRegistrationNumber(v ?? '')} searchable />
        <DateTimePicker label="Jump time" value={jumpTimeDate} onChange={setJumpTimeDate} withSeconds={false} />
        <NumberInput label="Altitude (feet)" withAsterisk min={0} value={altitudeFeet as number | string} onChange={setAltitudeFeet} />

        <Select label="Pilot (optional)" placeholder="Select pilot" data={peopleOptions} value={pilotId ?? undefined} onChange={setPilotId} searchable />

        <Group justify="flex-end" mt="xs">
          <Button type="submit" loading={submitting} variant="filled" disabled={!(selectedAirportId ?? airportId) || submitting}>
            Create jump
          </Button>
        </Group>
      </Stack>
    </form>
  )
}
