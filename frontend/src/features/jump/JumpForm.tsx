import React, { useEffect, useState, useRef } from "react";
import { IconClock } from "@tabler/icons-react";
import { Button, Group, Stack, NumberInput, Select, ActionIcon } from "@mantine/core";
import { DateInput, TimePicker } from "@mantine/dates";
import { notifications } from "@mantine/notifications";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
import type { CreateJumpRequest, Jump } from "./types";
import { createJump } from "./api";
import { fetchPilots } from "../person/api";
import { fetchAirports } from "../airport/api";
import { fetchCrafts } from "../craft/api";
import { useAirport } from "../airport/AirportContext";

type Props = {
	/** Called when a jump is successfully created */
	onCreated?: (jump: Jump) => void;
	/** Optional airport id to pre-select */
	airportId?: string;
};

/**
 * JumpForm
 *
 * Form component used to schedule a new jump. It composes Mantine Date/Time inputs
 * and other selectors to collect a `CreateJumpRequest` payload and calls the
 * backend `createJump` API. The component accepts an optional `airportId` to
 * pre-select an airport and an `onCreated` callback that's invoked with the
 * created `Jump` object after a successful create operation.
 */
export default function JumpForm({ onCreated, airportId }: Props) {
	const { airports, selectedAirportId: globalAirportId } = useAirport();
	const [jumpDate, setJumpDate] = useState<string | null>(null);
	const [jumpTime, setJumpTime] = useState<string | undefined>(undefined);
	const [dropdownOpened, setDropdownOpened] = useState(false);
	const [craftRegistrationNumber, setCraftRegistrationNumber] = useState("");
	const [altitudeFeet, setAltitudeFeet] = useState<number | string>("");
	const [pilotId, setPilotId] = useState<string | null>(null);
	const [personOptions, setPersonOptions] = useState<{ value: string; label: string }[]>([]);
	const [craftsOptions, setCraftsOptions] = useState<{ value: string; label: string }[]>([]);
	const [selectedAirportId, setSelectedAirportId] = useState<string | null>(
		airportId ?? globalAirportId ?? null,
	);
	const [submitting, setSubmitting] = useState(false);
	const mountedRef = useRef(true);

	// Fetch pilots once on mount
	useEffect(() => {
		mountedRef.current = true;
		fetchPilots()
			.then((pilotsList) => {
				if (!mountedRef.current) return;
				setPersonOptions(
					pilotsList.map((pilot) => ({ value: String(pilot.id), label: pilot.name })),
				);
			})
			.catch(() => {});
		return () => {
			mountedRef.current = false;
		};
	}, []);

	// Fetch crafts once on mount
	useEffect(() => {
		let mounted = true;
		fetchCrafts()
			.then((craftsList) => {
				if (!mounted) return;
				setCraftsOptions(
					craftsList.map((craftItem) => ({
						value: String(craftItem.registrationNumber),
						label: craftItem.name,
					})),
				);
				setCraftRegistrationNumber((prev) =>
					prev ? prev : craftsList.length > 0 ? String(craftsList[0].registrationNumber) : "",
				);
			})
			.catch(() => {});
		return () => {
			mounted = false;
		};
	}, []);

	// Sync selected airport when globalAirportId changes and no explicit airportId prop is provided
	useEffect(() => {
		if (airportId) return;
		setSelectedAirportId(globalAirportId ?? null);
	}, [globalAirportId, airportId]);

	// If no airports are available at mount, fetch them once to set an initial airport selection
	useEffect(() => {
		let mounted = true;
		if (!airports || airports.length === 0) {
			fetchAirports()
				.then((airportsResponse) => {
					if (!mounted) return;
					setSelectedAirportId((prev) => {
						if (prev) return prev;
						return airportsResponse.length > 0 ? String(airportsResponse[0].id) : prev;
					});
				})
				.catch(() => {});
		} else {
			setSelectedAirportId(
				(prev) =>
					prev ??
					airportId ??
					globalAirportId ??
					(airports.length > 0 ? String(airports[0].id) : null),
			);
		}
		return () => {
			mounted = false;
		};
	}, [airports, airportId, globalAirportId]);

	const handleDateChange = (value: Date | string | null) => {
		if (!value) {
			setJumpDate(null);
			return;
		}
		const dateObj = typeof value === "string" ? dayjs(value).toDate() : value;
		setJumpDate(dayjs(dateObj).format("YYYY-MM-DD"));
	};

	const handleTimeChange = (timeValue: string) => {
		setJumpTime(timeValue);
	};

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		const airportToUse = airportId ?? selectedAirportId ?? globalAirportId;
		if (
			!jumpDate ||
			!jumpTime ||
			!airportToUse ||
			!craftRegistrationNumber ||
			altitudeFeet === "" ||
			Number.isNaN(Number(altitudeFeet))
		) {
			notifications.show({
				color: "red",
				title: "Missing fields",
				message: "All fields are required",
			});
			return;
		}

		const combined = dayjs(`${jumpDate}T${jumpTime}`);
		const payload: CreateJumpRequest = {
			jumpTime: combined.utc().toISOString(),
			airportId: airportToUse,
			craftRegistrationNumber,
			altitudeFeet: Number(altitudeFeet),
			pilotId: pilotId || undefined,
		};

		try {
			setSubmitting(true);
			const created = await createJump(payload);
			notifications.show({ color: "green", title: "Jump created", message: "Jump scheduled" });
			setJumpDate(null);
			setJumpTime(undefined);
			setCraftRegistrationNumber("");
			setAltitudeFeet("");
			setPilotId(null);
			onCreated?.(created);
		} catch (err) {
			const message = err instanceof Error ? err.message : "Failed to create jump";
			notifications.show({ color: "red", title: "Error", message });
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<form onSubmit={handleSubmit}>
			<Stack gap="xm">
				<Select
					label="Craft"
					placeholder="Select craft"
					withAsterisk
					data={craftsOptions}
					clearable
					value={craftRegistrationNumber ?? undefined}
					onChange={(value) => setCraftRegistrationNumber(value ?? "")}
					searchable
				/>
				<Group>
					<DateInput
						label="Date"
						radius={"md"}
						required
						defaultValue={dayjs().toDate()}
						onChange={handleDateChange}
					/>
					<TimePicker
						label="Time"
						required
						clearable
						withDropdown
						minutesStep={15}
						radius="md"
						rightSection={
							<ActionIcon radius={"md"} onClick={() => setDropdownOpened(true)} variant="default">
								<IconClock size={14} stroke={1.5} />
							</ActionIcon>
						}
						value={jumpTime}
						onChange={(timeValue: string) => {
							handleTimeChange(timeValue);
							if (!timeValue) setDropdownOpened(false);
						}}
						popoverProps={{
							withinPortal: true,
							opened: dropdownOpened,
							onChange: (_opened) => !_opened && setDropdownOpened(false),
						}}
					/>
				</Group>
				<NumberInput
					label="Altitude"
					withAsterisk
					radius="md"
					min={0}
					value={altitudeFeet as number | string}
					onChange={setAltitudeFeet}
					suffix={"ft"}
					allowNegative={false}
					allowDecimal={false}
					step={500}
					thousandSeparator={" "}
				/>

				<Select
					label="Pilot (optional)"
					placeholder="Select pilot"
					data={personOptions}
					value={pilotId ?? undefined}
					onChange={setPilotId}
					searchable
					radius="md"
					clearable
					allowDeselect
				/>

				<Group justify="flex-end" mt="xs">
					<Button
						type="submit"
						loading={submitting}
						radius="md"
						variant="filled"
						disabled={!(selectedAirportId ?? airportId ?? globalAirportId) || submitting}
					>
						Create jump
					</Button>
				</Group>
			</Stack>
		</form>
	);
}
