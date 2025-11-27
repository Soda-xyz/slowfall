export type Craft = {
	/** Craft identifier */
	id: string;
	/** Display name */
	name: string;
	/** Registration number unique code */
	registrationNumber: string;
	/** Optional maximum weight capacity (kg) */
	capacityWeight?: number;
	/** Optional max number of persons onboard */
	capacityPersons?: number;
};

export type CreateCraftRequest = {
	name: string;
	registrationNumber: string;
	capacityWeight?: number;
	capacityPersons?: number;
};
