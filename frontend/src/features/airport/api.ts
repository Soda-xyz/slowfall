import type { Airport, CreateAirportRequest } from "./types";
import { fetchWithAuth } from "../../lib/fetchClient";

/** Local frontend-only type for delete calls (keeps the import stable even if types.ts doesn't export it) */
type DeleteAirportRequest = { id: string };

/**
 * Fetch all airports from the backend.
 * @param signal - optional AbortSignal
 * @returns Promise resolving to an array of Airport
 */
export async function fetchAirports(signal?: AbortSignal): Promise<Airport[]> {
	const res = await fetchWithAuth(`/airports`, { signal });
	if (!res.ok) {
		throw new Error(`Failed to fetch airports: ${res.status} ${res.statusText}`);
	}
	return res.json();
}

/**
 * Create a new airport.
 * @param payload - CreateAirportRequest
 * @returns Promise resolving to the created Airport
 */
export async function createAirport(payload: CreateAirportRequest): Promise<Airport> {
	const res = await fetchWithAuth(`/airports`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload),
	});
	if (!res.ok) {
		const text = await res.text().catch(() => "");
		throw new Error(text || `Failed to create airport: ${res.status} ${res.statusText}`);
	}
	return res.json();
}

/**
 * Delete an airport by id.
 * @param payload - object with id property
 */
export async function deleteAirport(payload: DeleteAirportRequest): Promise<void> {
	const res = await fetchWithAuth(`/airports/${payload.id}`, {
		method: "DELETE",
	});
	if (!res.ok) {
		const text = await res.text().catch(() => "");
		throw new Error(text || `Failed to delete airport: ${res.status} ${res.statusText}`);
	}
}
