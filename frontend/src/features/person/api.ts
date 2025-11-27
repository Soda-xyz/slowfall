import type { CreatePersonRequest, Person } from "./types";
import { API_BASE_URL } from "../../lib/apiBase";

/**
 * Fetch all persons from the backend.
 * @param signal optional AbortSignal to cancel the request
 * @returns Promise resolving to an array of Person
 */
export async function fetchPerson(signal?: AbortSignal): Promise<Person[]> {
	const res = await fetch(`${API_BASE_URL}/api/person`, { signal, credentials: "include" });
	if (!res.ok) {
		throw new Error(`Failed to fetch person: ${res.status} ${res.statusText}`);
	}
	return res.json();
}
/**
 * Fetch only persons who are pilots. Uses the backend search endpoint with pilot=true.
 * If the endpoint is not available (404), falls back to fetching all persons and filtering.
 * @param signal optional AbortSignal
 * @returns Promise resolving to an array of Person who have pilot===true
 */
export async function fetchPilots(signal?: AbortSignal): Promise<Person[]> {
	const res = await fetch(`${API_BASE_URL}/api/person/search?pilot=true`, {
		signal,
		credentials: "include",
	});
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
/**
 * Fetch only persons who are skydivers. Uses the backend search endpoint with skydiver=true.
 * If the endpoint is not available (404), falls back to fetching all persons and filtering.
 * @param signal optional AbortSignal
 * @returns Promise resolving to an array of Person who have skydiver===true
 */
export async function fetchSkydivers(signal?: AbortSignal): Promise<Person[]> {
	const res = await fetch(`${API_BASE_URL}/api/person/search?skydiver=true`, {
		signal,
		credentials: "include",
	});
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

/**
 * Create a new person in the backend.
 * @param payload CreatePersonRequest payload
 * @returns Promise resolving to the created Person
 */
export async function createPerson(payload: CreatePersonRequest): Promise<Person> {
	const res = await fetch(`${API_BASE_URL}/api/person`, {
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
