import React, { createContext, useContext, useEffect, useState } from 'react'
import { Select } from '@mantine/core'
import type { Airport } from './types'
import { fetchAirports } from './api'

type AirportContextType = {
  airports: Airport[]
  selectedAirportId: string | null
  setSelectedAirportId: (id: string | null) => void
  loading: boolean
  refresh: () => Promise<void>
}

const AirportContext = createContext<AirportContextType | undefined>(undefined)

export function AirportProvider({ children }: { children: React.ReactNode }) {
  const [airports, setAirports] = useState<Airport[]>([])
  const [selectedAirportId, setSelectedAirportId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const a = await fetchAirports()
      setAirports(a)
      if (!selectedAirportId && a.length > 0) setSelectedAirportId(String(a[0].id))
    } catch (err) {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <AirportContext.Provider value={{ airports, selectedAirportId, setSelectedAirportId, loading, refresh: load }}>
      {children}
    </AirportContext.Provider>
  )
}

export function useAirport() {
  const ctx = useContext(AirportContext)
  if (!ctx) throw new Error('useAirport must be used within AirportProvider')
  return ctx
}

export function AirportSelector(props: any) {
  const { airports, selectedAirportId, setSelectedAirportId, loading } = useAirport()
  const data = airports.map((a) => ({ value: String(a.id), label: a.name }))
  return (
    <Select
      data={data}
      value={selectedAirportId ?? undefined}
      onChange={(v) => setSelectedAirportId(v ?? null)}
      placeholder={loading ? 'Loading airports...' : 'Select airport'}
      searchable
      clearable
      sx={{ minWidth: 220 }}
      {...props}
    />
  )
}

