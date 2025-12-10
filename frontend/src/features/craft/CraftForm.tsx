import React, { useState } from "react";
import { Button, Group, Stack, TextInput, NumberInput } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import type { CreateCraftRequest, Craft } from "./types";
import { createCraft } from "./api";

type Props = {
	/** Optional callback invoked with created Craft */
	onCreated?: (craft: Craft) => void;
};

/**
 * CraftForm
 *
 * Small form for creating crafts. Handles client-side trimming. Calls `createCraft` on submit and
 * invokes `onCreated` with the created craft.
 */
export default function CraftForm({ onCreated }: Props): React.JSX.Element {
	const [name, setName] = useState("");
	const [registrationNumber, setRegistartionNumber] = useState("");
	const [capacityWeight, setCapacityWeight] = useState(0);
	const [capacityPersons, setCapacityPersons] = useState(0);
	const [submitting, setSubmitting] = useState(false);

	/**
	 * Handle form submission: validate fields and call the createCraft API.
	 */
	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		const createRequest: CreateCraftRequest = {
			name: name.trim(),
			registrationNumber: registrationNumber.trim().toUpperCase(),
			capacityWeight: capacityWeight,
			capacityPersons: capacityPersons,
		};
		if (!createRequest.name) {
			notifications.show({ color: "red", title: "Missing fields", message: "Name required" });
			return;
		}
		try {
			setSubmitting(true);
			const createdCraft = await createCraft(createRequest);
			notifications.show({
				color: "green",
				title: "Craft added",
				message: `${createdCraft.name} has been added`,
			});
			setName("");
			setRegistartionNumber("");
			setCapacityWeight(0);
			setCapacityPersons(0);
			onCreated?.(createdCraft);
		} catch (err) {
			const message = err instanceof Error ? err.message : "Failed to create craft";
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
					placeholder="Tunnan"
					withAsterisk
					value={name}
					onChange={(value) => setName(value.currentTarget.value)}
					required={true}
				/>
				<TextInput
					label="Registration Number"
					placeholder="KVT-01"
					value={registrationNumber}
					onChange={(value) => setRegistartionNumber(value.currentTarget.value)}
					required={true}
				/>
				<NumberInput
					label="Capacity Weight (kg)"
					placeholder="300"
					value={capacityWeight}
					onChange={(value) => setCapacityWeight(typeof value === "number" ? value : 0)}
					allowNegative={false}
					allowLeadingZeros={false}
					allowDecimal={false}
					defaultValue={0}
					max={99}
					suffix={"kg"}
					required={true}
				/>
				<NumberInput
					label="Capacity Persons"
					placeholder="6"
					value={capacityPersons}
					onChange={(value) => setCapacityPersons(typeof value === "number" ? value : 0)}
					allowNegative={false}
					allowLeadingZeros={false}
					allowDecimal={false}
					defaultValue={0}
					max={9999}
					required={true}


				/>
				<Group mt="md" style={{ justifyContent: "flex-end" }}>
					<Button type="submit" loading={submitting}>
						Add Craft
					</Button>
				</Group>
			</Stack>
		</form>
	);
}
