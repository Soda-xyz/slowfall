import React, { useState } from "react";
import { Button, Group, Stack, TextInput } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import type { CreateAirportRequest, Airport } from "./types";
import { createAirport } from "./api";

type Props = {
	/** Optional callback invoked with created airport */
	onCreated?: (airport: Airport) => void;
};

/**
 * AirportForm
 *
 * Small form for creating airports. Handles client-side trimming and defaulting
 * the timezone from the client environment. Calls `createAirport` on submit and
 * invokes `onCreated` with the created airport.
 */
export default function AirportForm({ onCreated }: Props): React.JSX.Element {
	const [name, setName] = useState("");
	const [icaoCode, setIcaoCode] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		const clientTimeZone = Intl?.DateTimeFormat?.()?.resolvedOptions?.()?.timeZone ?? "UTC";
		const createRequest: CreateAirportRequest = {
			name: name.trim(),
			icaoCode: icaoCode.trim().toUpperCase(),
			timezone: clientTimeZone,
		};
		if (!createRequest.name) {
			notifications.show({ color: "red", title: "Missing fields", message: "Name required" });
			return;
		}
		try {
			setSubmitting(true);
			const createdAirport = await createAirport(createRequest);
			notifications.show({
				color: "green",
				title: "Airport added",
				message: `${createdAirport.name} has been added`,
			});
			setName("");
			setIcaoCode("");
			onCreated?.(createdAirport);
		} catch (err) {
			const message = err instanceof Error ? err.message : "Failed to create airport";
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
					placeholder="Kristianstad Österlen Airport"
					withAsterisk
					value={name}
					onChange={(e) => setName(e.currentTarget.value)}
				/>
				<TextInput
					label="ICAO Code"
					placeholder="ESMK"
					value={icaoCode}
					onChange={(e) => setIcaoCode(e.currentTarget.value)}
				/>
				<Group mt="md" style={{ justifyContent: "flex-end" }}>
					<Button type="submit" loading={submitting}>
						Add Airport
					</Button>
				</Group>
			</Stack>
		</form>
	);
}
