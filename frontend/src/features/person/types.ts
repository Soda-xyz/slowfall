export type Person = {
	id: number;
	name: string;
	firstName?: string;
	lastName?: string;
	pilot: boolean;
	skydiver: boolean;
	weight: number;
	email: string;
};

export type CreatePersonRequest = {
	firstName: string;
	lastName: string;
	pilot: boolean;
	skydiver: boolean;
	weight: number;
	email: string;
};
