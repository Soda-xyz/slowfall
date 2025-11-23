import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchPilots, fetchPeople } from './api'
import type { Person } from './types'

const API_BASE = 'http://localhost:8080'

describe('people api', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    // reset fetch mock
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.resetAllMocks()
    global.fetch = originalFetch
  })

  it('fetchPilots should return content array from paged response', async () => {
    const pilots: Person[] = [{ id: 1, name: 'Pilot One', weight: 80, email: 'p1@example.com', pilot: true }]
    // mock search endpoint returning a page
    ;(global.fetch as unknown as vi.Mock).mockImplementationOnce((url: string) =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ content: pilots }) }) as Response
    )

    const res = await fetchPilots()
    expect(res).toHaveLength(1)
    expect(res[0].name).toBe('Pilot One')
  })

  it('fetchPilots falls back to /api/people if search returns 404 and filters pilots', async () => {
    const all: Person[] = [
      { id: 1, name: 'Pilot One', weight: 80, email: 'p1@example.com', pilot: true },
      { id: 2, name: 'Not Pilot', weight: 70, email: 'np@example.com', pilot: false },
    ]

    // first call to search returns 404
    ;(global.fetch as unknown as vi.Mock).mockImplementationOnce((url: string) =>
      Promise.resolve({ ok: false, status: 404, statusText: 'Not Found' }) as Response
    )
    // second call to /api/people returns full list
    ;(global.fetch as unknown as vi.Mock).mockImplementationOnce((url: string) =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(all) }) as Response
    )

    const res = await fetchPilots()
    expect(res).toHaveLength(1)
    expect(res[0].name).toBe('Pilot One')
  })
})
