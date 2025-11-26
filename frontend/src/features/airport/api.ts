import type { Airport, CreateAirportRequest } from "./types";

// Local frontend-only type for delete calls (keeps the import stable even if types.ts doesn't export it)
type DeleteAirportRequest = { id: string };

const API_BASE_URL = "http://localhost:8080";

export async function fetchAirports(signal?: AbortSignal): Promise<Airport[]> {
	const res = await fetch(`${API_BASE_URL}/api/airports`, { signal });
	if (!res.ok) {
		throw new Error(`Failed to fetch airports: ${res.status} ${res.statusText}`);
	}
	return res.json();
}

export async function createAirport(payload: CreateAirportRequest): Promise<Airport> {
	const res = await fetch(`${API_BASE_URL}/api/airports`, {
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

export async function deleteAirport(payload: DeleteAirportRequest): Promise<void> {
	const res = await fetch(`${API_BASE_URL}/api/airports/${payload.id}`, {
		method: "DELETE",
	});
	if (!res.ok) {
		const text = await res.text().catch(() => "");
		throw new Error(text || `Failed to delete airport: ${res.status} ${res.statusText}`);
	}
}
