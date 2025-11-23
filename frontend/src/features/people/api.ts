import type { CreatePersonRequest, Person } from './types'

const API_BASE_URL = 'http://localhost:8080'

export async function fetchPeople(signal?: AbortSignal): Promise<Person[]> {
  const res = await fetch(`${API_BASE_URL}/api/people`, { signal })
  if (!res.ok) {
    throw new Error(`Failed to fetch people: ${res.status} ${res.statusText}`)
  }
  return res.json()
}

/**
 * Fetch only people who are pilots. Uses the backend search endpoint with pilot=true.
 * Backend: GET /api/people/search?pilot=true
 * See: PersonController.searchPersons in backend
 */
export async function fetchPilots(signal?: AbortSignal): Promise<Person[]> {
  const res = await fetch(`${API_BASE_URL}/api/people/search?pilot=true`, { signal })
  if (!res.ok) {
    // If the endpoint isn't implemented server-side, fall back to listing all and filtering
    if (res.status === 404) {
      const all = await fetchPeople(signal)
      return all.filter((p) => p.pilot === true)
    }
    throw new Error(`Failed to fetch pilots: ${res.status} ${res.statusText}`)
  }
  const page = await res.json()
  // backend returns a Page<PersonDto> with content array; handle both page and plain array
  if (Array.isArray(page)) return page
  if (page && Array.isArray(page.content)) return page.content
  return []
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
