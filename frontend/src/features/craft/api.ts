import type { Craft, CreateCraftRequest } from "./types";
import { API_BASE_URL } from "../../lib/apiBase";
import { fetchWithAuth } from "../../lib/fetchClient";

/**
 * Craft API functions
 *
 * Small wrappers over the backend craft endpoints used by the UI.
 */
export async function fetchCrafts(signal?: AbortSignal): Promise<Craft[]> {
	const res = await fetchWithAuth(`${API_BASE_URL}/api/crafts`, { signal });
	if (!res.ok) {
		throw new Error(`Failed to fetch crafts: ${res.status} ${res.statusText}`);
	}
	return res.json();
}

/**
 * Create a new craft.
 * @param payload - CreateCraftRequest
 * @returns Craft
 */
export async function createCraft(payload: CreateCraftRequest): Promise<Craft> {
	const res = await fetchWithAuth(`${API_BASE_URL}/api/crafts`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload),
	});
	if (!res.ok) {
		const text = await res.text().catch(() => "");
		throw new Error(text || `Failed to create craft: ${res.status} ${res.statusText}`);
	}
	return res.json();
}
