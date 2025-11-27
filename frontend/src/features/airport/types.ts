export type Airport = {
	/** Airport identifier (string) */
	id: string;
	/** Airport display name */
	name: string;
	/** ICAO identifier code */
	icaoCode: string;
	/** IANA timezone identifier for the airport (e.g., 'Europe/Oslo') */
	timezone: string;
};

export type CreateAirportRequest = {
	name: string;
	icaoCode: string;
	timezone: string;
};

export type UpdateAirportRequest = {
	name?: string;
	icaoCode?: string;
	timezone?: string;
};

export type DeleteAirportRequest = { id: string };
