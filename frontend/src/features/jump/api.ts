import type { CreateJumpRequest, Jump } from "./types";
import { API_BASE_URL } from "../../lib/apiBase";
import { fetchWithAuth } from "../../lib/fetchClient";

/**
 * Create a new jump.
 * @param payload - CreateJumpRequest
 * @returns Promise resolving to the created Jump
 */
export async function createJump(payload: CreateJumpRequest): Promise<Jump> {
	const res = await fetchWithAuth(`${API_BASE_URL}/api/jumps`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload),
		credentials: "include",
	});
	if (!res.ok) {
		const text = await res.text().catch(() => "");
		throw new Error(text || `Failed to create jump: ${res.status} ${res.statusText}`);
	}
	return res.json();
}

/**
 * Fetch jumps from the backend.
 * @param signal - optional AbortSignal
 * @returns Promise resolving to Jump[]
 */
export async function fetchJumps(signal?: AbortSignal): Promise<Jump[]> {
	const res = await fetchWithAuth(`${API_BASE_URL}/api/jumps`, { signal, credentials: "include" });
	if (!res.ok) {
		if (res.status === 404) return [];
		throw new Error(`Failed to fetch jumps: ${res.status} ${res.statusText}`);
	}
	return res.json();
}

/**
 * Add a skydiver to a jump.
 */
export async function addSkydiverToJump(jumpId: string, personId: string): Promise<void> {
	const res = await fetchWithAuth(`${API_BASE_URL}/api/jumps/${jumpId}/skydivers`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ personId }),
		credentials: "include",
	});
	if (!res.ok) throw new Error(`Failed to add skydiver: ${res.status} ${res.statusText}`);
}

/**
 * Add a pilot to a jump.
 */
export async function addPilotToJump(jumpId: string, personId: string): Promise<void> {
	const res = await fetchWithAuth(`${API_BASE_URL}/api/jumps/${jumpId}/pilots`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ personId }),
		credentials: "include",
	});
	if (!res.ok) throw new Error(`Failed to add pilot: ${res.status} ${res.statusText}`);
}
