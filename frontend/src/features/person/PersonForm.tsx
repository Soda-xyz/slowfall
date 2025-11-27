import React, { useState } from "react";
import { Button, Group, NumberInput, Stack, TextInput } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import type { CreatePersonRequest, Person } from "./types";
import { createPerson } from "./api";

type Props = {
	/** Callback invoked with the created Person after successful submission */
	onCreated?: (person: Person) => void;
};

/**
 * PersonForm
 *
 * A controlled form component for creating a new person. Performs client-side
 * validation (required fields and numeric weight) and calls the backend via
 * `createPerson`. On success, it clears the form and calls `onCreated`.
 *
 * @param props.onCreated optional callback called with the created Person
 */
export default function PersonForm({ onCreated }: Props) {
	const [name, setName] = useState("");
	const [weight, setWeight] = useState<number | string>("");
	const [email, setEmail] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (weight === "" || Number.isNaN(Number(weight))) {
			notifications.show({
				color: "red",
				title: "Invalid input",
				message: "Weight must be a number",
			});
			return;
		}

		const parts = name.trim().split(/\s+/);
		const firstName = parts[0] ?? "";
		const lastName = parts.slice(1).join(" ") || "";

		const payload: CreatePersonRequest = {
			firstName: firstName,
			lastName: lastName,
			weight: Number(weight),
			pilot: false,
			skydiver: true,
			email: email.trim(),
		};
		if (!payload.firstName || !payload.lastName || !payload.email) {
			notifications.show({
				color: "red",
				title: "Missing fields",
				message: "First name, last name and email required",
			});
			return;
		}

		try {
			setSubmitting(true);
			const created = await createPerson(payload);
			notifications.show({
				color: "green",
				title: "Person added",
				message: `${created.firstName} has been added`,
			});
			setName("");
			setWeight("");
			setEmail("");
			onCreated?.(created);
		} catch (err) {
			const message = err instanceof Error ? err.message : "Failed to create person";
			notifications.show({ color: "red", title: "Error", message });
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<form onSubmit={handleSubmit}>
			<Stack gap="sm">
				<TextInput
					label="Name"
					placeholder="Jane Doe"
					withAsterisk
					value={name}
					onChange={(e) => setName(e.currentTarget.value)}
				/>
				<NumberInput
					label="Weight"
					placeholder="72"
					withAsterisk
					value={weight}
					onChange={setWeight}
					min={0}
				/>
				<TextInput
					label="Email"
					placeholder="jane@example.com"
					withAsterisk
					type="email"
					value={email}
					onChange={(e) => setEmail(e.currentTarget.value)}
				/>
				<Group justify="flex-end" mt="xs">
					<Button type="submit" loading={submitting} variant="filled">
						Add person
					</Button>
				</Group>
			</Stack>
		</form>
	);
}
