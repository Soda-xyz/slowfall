import type { CreateJumpRequest, Jump } from "./types";
import { API_BASE_URL } from "../../lib/apiBase";

/**
 * Fetch all jumps. If the server endpoint is missing (404) returns an empty array
 * so the UI can continue to render in a demo/local mode.
 * @param signal optional AbortSignal
 */
export async function fetchJumps(signal?: AbortSignal): Promise<Jump[]> {
	const res = await fetch(`${API_BASE_URL}/api/jumps`, { signal, credentials: "include" });
	if (!res.ok) {
		if (res.status === 404) return [];
		throw new Error(`Failed to fetch jumps: ${res.status} ${res.statusText}`);
	}
	return res.json();
}

/**
 * Create a jump on the backend.
 * @param payload CreateJumpRequest
 */
export async function createJump(payload: CreateJumpRequest): Promise<Jump> {
	const res = await fetch(`${API_BASE_URL}/api/jumps`, {
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
 * Add a skydiver to a jump.
 */
export async function addSkydiverToJump(jumpId: string, personId: string): Promise<void> {
	const res = await fetch(`${API_BASE_URL}/api/jumps/${jumpId}/skydivers`, {
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
	const res = await fetch(`${API_BASE_URL}/api/jumps/${jumpId}/pilots`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ personId }),
		credentials: "include",
	});
	if (!res.ok) throw new Error(`Failed to add pilot: ${res.status} ${res.statusText}`);
}
