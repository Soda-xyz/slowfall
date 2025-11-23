import type { CreateJumpRequest, Jump } from './types'

const API_BASE_URL = 'http://localhost:8080'

export async function fetchJumps(signal?: AbortSignal): Promise<Jump[]> {
  const res = await fetch(`${API_BASE_URL}/api/jumps`, { signal })
  if (!res.ok) {
    // If the endpoint isn't implemented server-side, return empty list to allow UI to function
    if (res.status === 404) return []
    throw new Error(`Failed to fetch jumps: ${res.status} ${res.statusText}`)
  }
  return res.json()
}

export async function createJump(payload: CreateJumpRequest): Promise<Jump> {
  const res = await fetch(`${API_BASE_URL}/api/jumps`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `Failed to create jump: ${res.status} ${res.statusText}`)
  }
  return res.json()
}

export async function addPassengerToJump(jumpId: string, personId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/jumps/${jumpId}/passengers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ personId }),
  })
  if (!res.ok) throw new Error(`Failed to add passenger: ${res.status} ${res.statusText}`)
}

export async function addPilotToJump(jumpId: string, personId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/jumps/${jumpId}/pilots`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ personId }),
  })
  if (!res.ok) throw new Error(`Failed to add pilot: ${res.status} ${res.statusText}`)
}

