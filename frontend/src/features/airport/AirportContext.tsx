import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Select } from "@mantine/core";
import type { SelectProps } from "@mantine/core";
import type { Airport } from "./types";
import { fetchAirports } from "./api";

type AirportContextType = {
	airports: Airport[];
	selectedAirportId: string | null;
	setSelectedAirportId: (id: string | null) => void;
	loading: boolean;
	refresh: () => Promise<void>;
};

const AirportContext = createContext<AirportContextType | undefined>(undefined);

/**
 * AirportProvider
 *
 * Provides airport data and selection state to descendants via React Context.
 * It fetches airports on mount and exposes a `refresh` function to re-fetch.
 */
export function AirportProvider({ children }: { children: React.ReactNode }) {
	const [airports, setAirports] = useState<Airport[]>([]);
	const [selectedAirportId, setSelectedAirportId] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const load = useCallback(async () => {
		setLoading(true);
		try {
			const airportsResponse = await fetchAirports();
			setAirports(airportsResponse);
			setSelectedAirportId((prev) => {
				if (prev) return prev;
				return airportsResponse.length > 0 ? String(airportsResponse[0].id) : prev;
			});
		} catch (err) {
			console.error("Failed to load airports:", err);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	return (
		<AirportContext.Provider
			value={{ airports, selectedAirportId, setSelectedAirportId, loading, refresh: load }}
		>
			{children}
		</AirportContext.Provider>
	);
}

/**
 * useAirport
 *
 * Hook to access airport context. If used outside `AirportProvider`, return
 * a safe default so components can render in isolation (tests) without
 * crashing.
 */
export function useAirport() {
	const ctx = useContext(AirportContext);
	if (!ctx) {
		return {
			airports: [] as Airport[],
			selectedAirportId: null,
			setSelectedAirportId: () => {},
			loading: false,
			refresh: async () => {},
		} as AirportContextType;
	}
	return ctx;
}

/**
 * AirportSelector
 *
 * A small select component bound to the airport context. Accepts any Mantine
 * `Select` props and forwards them to the underlying component.
 */
export function AirportSelector(props: SelectProps) {
	const { airports, selectedAirportId, setSelectedAirportId, loading } = useAirport();
	const data = airports.map((airport) => ({ value: String(airport.id), label: airport.name }));
	return (
		<Select
			data={data}
			value={selectedAirportId ?? undefined}
			onChange={(value) => setSelectedAirportId(value ?? null)}
			placeholder={loading ? "Loading airports..." : "Select airport"}
			searchable
			clearable
			style={{ minWidth: 220 }}
			{...props}
		/>
	);
}
