export type UUID = string;

export type PersonDto = {
	/** Unique identifier for the person */
	id: UUID;
	/** Display name */
	name: string;
	/** Whether the person can pilot */
	pilot?: boolean;
	/** Whether the person can skydiver */
	skydiver?: boolean;
	/** Optional weight in kilograms */
	weight?: number;
	/** Optional contact email */
	email?: string;
};

export type Jump = {
	/** Unique identifier for the jump */
	id: UUID;
	/** Jump time as an ISO datetime string */
	jumpTime: string; // ISO datetime
	/** Airport id where the jump will occur */
	airportId: UUID;
	/** Jump altitude in feet */
	altitudeFeet: number;
	/** Skydivers booked for this jump */
	skydivers: PersonDto[];
	/** Pilots booked for this jump */
	pilots: PersonDto[];
};

export type CreateJumpRequest = {
	jumpTime: string;
	airportId: UUID;
	craftRegistrationNumber: string;
	altitudeFeet: number;
	pilotId?: UUID;
};
