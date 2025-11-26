import type { Craft, CreateCraftRequest } from "./types";

const API_BASE_URL = "http://localhost:8080";

export async function fetchCrafts(signal?: AbortSignal): Promise<Craft[]> {
	const res = await fetch(`${API_BASE_URL}/api/crafts`, { signal });
	if (!res.ok) {
		throw new Error(`Failed to fetch crafts: ${res.status} ${res.statusText}`);
	}
	return res.json();
}

export async function createCraft(payload: CreateCraftRequest): Promise<Craft> {
	const res = await fetch(`${API_BASE_URL}/api/crafts`, {
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
