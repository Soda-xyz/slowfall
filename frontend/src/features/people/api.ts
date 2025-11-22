import type { CreatePersonRequest, Person } from './types'

const API_BASE_URL = 'http://localhost:8080'

export async function fetchPeople(signal?: AbortSignal): Promise<Person[]> {
  const res = await fetch(`${API_BASE_URL}/api/people`, { signal })
  if (!res.ok) {
    throw new Error(`Failed to fetch people: ${res.status} ${res.statusText}`)
  }
  return res.json()
}

export async function createPerson(payload: CreatePersonRequest): Promise<Person> {
  const res = await fetch(`${API_BASE_URL}/api/people`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `Failed to create person: ${res.status} ${res.statusText}`)
  }
  return res.json()
}
