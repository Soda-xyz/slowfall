export type Airport = {
	id: string;
	name: string;
	icaoCode: string;
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
