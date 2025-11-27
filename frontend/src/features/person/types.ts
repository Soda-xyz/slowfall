/**
 * Represents a person with various attributes including
 * personal details and capabilities such as piloting and skydiving.
 */
export type Person = {
	/** Database identifier (numeric) */
	id: number;
	/** Full display name (can be generated from firstName/lastName) */
	name: string;
	/** Optional given/first name */
	firstName?: string;
	/** Optional family/last name */
	lastName?: string;
	/** Whether the person can serve as an aircraft pilot */
	pilot: boolean;
	/** Whether the person is a skydiver */
	skydiver: boolean;
	/** Person weight in kilograms (number) */
	weight: number;
	/** Contact email address */
	email: string;
};

/**
 * Payload used to create a new person via the API.
 * All fields are required when creating a person from the client.
 */
export type CreatePersonRequest = {
	/** Optional given/first name */
	firstName: string;
	/** Optional family/last name */
	lastName: string;
	/** Whether the person can serve as an aircraft pilot */
	pilot: boolean;
	/** Whether the person is a skydiver */
	skydiver: boolean;
	/** Person weight in kilograms (number) */
	weight: number;
	/** Contact email address */
	email: string;
};
