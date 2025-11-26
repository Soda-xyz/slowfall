import type { CreatePersonRequest, Person } from "./types";

const API_BASE_URL = "http://localhost:8080";

export async function fetchPerson(signal?: AbortSignal): Promise<Person[]> {
	const res = await fetch(`${API_BASE_URL}/api/person`, { signal });
	if (!res.ok) {
		throw new Error(`Failed to fetch person: ${res.status} ${res.statusText}`);
	}
	return res.json();
}
/**
 * Fetch only person who are pilots. Uses the backend search endpoint with pilot=true.
 * Backend: GET /api/person/search?pilot=true
 * See: PersonController.searchPersons in backend
 */
export async function fetchPilots(signal?: AbortSignal): Promise<Person[]> {
	const res = await fetch(`${API_BASE_URL}/api/person/search?pilot=true`, { signal });
	if (!res.ok) {
		if (res.status === 404) {
			const all = await fetchPerson(signal);
			return all.filter((p) => p.pilot === true);
		}
		throw new Error(`Failed to fetch pilots: ${res.status} ${res.statusText}`);
	}
	const page = await res.json();
	if (Array.isArray(page)) return page;
	if (page && Array.isArray(page.content)) return page.content;
	return [];
}
export async function fetchSkydivers(signal?: AbortSignal): Promise<Person[]> {
	const res = await fetch(`${API_BASE_URL}/api/person/search?skydiver=true`, { signal });
	if (!res.ok) {
		if (res.status === 404) {
			const all = await fetchPerson(signal);
			return all.filter((p) => p.skydiver === true);
		}
		throw new Error(`Failed to fetch skydivers: ${res.status} ${res.statusText}`);
	}
	const page = await res.json();
	if (Array.isArray(page)) return page;
	if (page && Array.isArray(page.content)) return page.content;
	return [];
}

export async function createPerson(payload: CreatePersonRequest): Promise<Person> {
	const res = await fetch(`${API_BASE_URL}/api/person`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload),
	});
	if (!res.ok) {
		const text = await res.text().catch(() => "");
		throw new Error(text || `Failed to create person: ${res.status} ${res.statusText}`);
	}
	return res.json();
}
