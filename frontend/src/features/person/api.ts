import type { CreatePersonRequest, Person } from "./types";
import { API_BASE_URL } from "../../lib/apiBase";
import { fetchWithAuth } from "../../lib/fetchClient";

/**
 * Fetch person list.
 * @param signal - optional AbortSignal
 * @returns Promise resolving to Person[]
 */
export async function fetchPerson(signal?: AbortSignal): Promise<Person[]> {
	const res = await fetchWithAuth(`${API_BASE_URL}/api/person`, { signal, credentials: "include" });
	if (!res.ok) {
		throw new Error(`Failed to fetch person: ${res.status} ${res.statusText}`);
	}
	return res.json();
}

/**
 * Create a new person.
 * @param payload - CreatePersonRequest
 * @returns Promise resolving to created Person
 */
export async function createPerson(payload: CreatePersonRequest): Promise<Person> {
	const res = await fetchWithAuth(`${API_BASE_URL}/api/person`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload),
		credentials: "include",
	});
	if (!res.ok) {
		const text = await res.text().catch(() => "");
		throw new Error(text || `Failed to create person: ${res.status} ${res.statusText}`);
	}
	return res.json();
}

/**
 * Fetch pilots.
 * @param signal - optional AbortSignal
 * @returns Promise resolving to Person[]
 */
export async function fetchPilots(signal?: AbortSignal): Promise<Person[]> {
	const res = await fetchWithAuth(`${API_BASE_URL}/api/person/search?pilot=true`, {
		signal,
		credentials: "include",
	});
	if (!res.ok) {
		if (res.status === 404) {
			const all = await fetchPerson(signal);
			return all.filter((person) => person.pilot);
		}
		throw new Error(`Failed to fetch pilots: ${res.status} ${res.statusText}`);
	}
	const page = await res.json();
	if (Array.isArray(page)) return page;
	if (page && Array.isArray(page.content)) return page.content;
	return [];
}

/**
 * Fetch skydivers.
 * @param signal - optional AbortSignal
 * @returns Promise resolving to Person[]
 */
export async function fetchSkydivers(signal?: AbortSignal): Promise<Person[]> {
	const res = await fetchWithAuth(`${API_BASE_URL}/api/person/search?skydiver=true`, {
		signal,
		credentials: "include",
	});
	if (!res.ok) {
		if (res.status === 404) {
			const all = await fetchPerson(signal);
			return all.filter((person) => person.skydiver);
		}
		throw new Error(`Failed to fetch skydivers: ${res.status} ${res.statusText}`);
	}
	const page = await res.json();
	if (Array.isArray(page)) return page;
	if (page && Array.isArray(page.content)) return page.content;
	return [];
}
