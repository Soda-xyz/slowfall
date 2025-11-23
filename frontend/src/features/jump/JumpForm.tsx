import { useEffect, useState } from 'react'
import { Button, Group, Stack, TextInput, NumberInput, Select } from '@mantine/core'
import { DateTimePicker } from '@mantine/dates'
import { notifications } from '@mantine/notifications'
import dayjs from 'dayjs'
import type { CreateJumpRequest, PersonDto } from './types'
import { createJump } from './api'
import { fetchPeople } from '../people/api'

type Props = {
  onCreated?: (jump: any) => void
}

export default function JumpForm({ onCreated }: Props) {
  const [jumpTimeDate, setJumpTimeDate] = useState<Date | null>(null)
  const [airportId, setAirportId] = useState<string>('')
  const [craftRegistrationNumber, setCraftRegistrationNumber] = useState('')
  const [altitudeFeet, setAltitudeFeet] = useState<number | ''>('')
  const [pilotId, setPilotId] = useState<string | null>(null)
  const [peopleOptions, setPeopleOptions] = useState<{ value: string; label: string }[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let mounted = true
    fetchPeople()
      .then((p) => {
        if (!mounted) return
        setPeopleOptions(p.map((pp) => ({ value: String(pp.id), label: pp.name })))
      })
      .catch(() => {})
    return () => {
      mounted = false
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!jumpTimeDate || !airportId || !craftRegistrationNumber || altitudeFeet === '' || Number.isNaN(Number(altitudeFeet))) {
      notifications.show({ color: 'red', title: 'Missing fields', message: 'All fields are required' })
      return
    }

    const payload: CreateJumpRequest = {
      // format as local date-time without timezone offset so backend LocalDateTime parses it as intended
      jumpTime: dayjs(jumpTimeDate).format('YYYY-MM-DDTHH:mm:ss'),
      airportId,
      craftRegistrationNumber,
      altitudeFeet: Number(altitudeFeet),
      pilotId: pilotId || undefined,
    }

    try {
      setSubmitting(true)
      const created = await createJump(payload)
      notifications.show({ color: 'green', title: 'Jump created', message: 'Jump scheduled' })
      setJumpTimeDate(null)
      setAirportId('')
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
        <TextInput label="Airport ID" placeholder="UUID of airport" withAsterisk value={airportId} onChange={(e) => setAirportId(e.currentTarget.value)} />
        <TextInput label="Craft Reg" placeholder="N12345" withAsterisk value={craftRegistrationNumber} onChange={(e) => setCraftRegistrationNumber(e.currentTarget.value)} />
        <DateTimePicker label="Jump time" value={jumpTimeDate} onChange={setJumpTimeDate} withSeconds={false} />
        <NumberInput label="Altitude (feet)" withAsterisk min={0} value={altitudeFeet} onChange={setAltitudeFeet} />

        <Select label="Pilot (optional)" placeholder="Select pilot" data={peopleOptions} value={pilotId ?? undefined} onChange={setPilotId} searchable />

        <Group justify="flex-end" mt="xs">
          <Button type="submit" loading={submitting} variant="filled">
            Create jump
          </Button>
        </Group>
      </Stack>
    </form>
  )
}
