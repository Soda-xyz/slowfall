export type Craft = {
	id: string;
	name: string;
	registrationNumber: string;
	capacityWeight?: number;
	capacityPersons?: number;
};

export type CreateCraftRequest = {
	name: string;
	registrationNumber: string;
	capacityWeight?: number;
	capacityPersons?: number;
};
