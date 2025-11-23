import { useState } from 'react'
import { AppShell, Group, SegmentedControl } from '@mantine/core'
import { PeoplePage, AirportPage, JumpPage } from './features'
import './App.css'

export default function App() {
  const [view, setView] = useState<'people' | 'airport' | 'jump'>('people')

  const header = (
    <Group position="center" p="md">
      <SegmentedControl
        value={view}
        onChange={(v) => setView(v as 'people' | 'airport' | 'jump')}
        data={[
          { label: 'People', value: 'people' },
          { label: 'Airport', value: 'airport' },
          { label: 'Jump', value: 'jump' },
        ]}
      />
    </Group>
  )

  return (
    <AppShell header={{ height: 64 }} padding="md">
      <AppShell.Header>{header}</AppShell.Header>
      <AppShell.Main>
        {view === 'people' && <PeoplePage />}
        {view === 'airport' && <AirportPage />}
        {view === 'jump' && <JumpPage />}
      </AppShell.Main>
    </AppShell>
  )
}
