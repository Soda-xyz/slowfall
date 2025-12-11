import React, { useEffect, useState, useRef } from "react";
import { IconClock } from "@tabler/icons-react";
import { Button, Group, Stack, NumberInput, Select, ActionIcon } from "@mantine/core";
import { DateInput, TimePicker } from "@mantine/dates";
import { notifications } from "@mantine/notifications";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
import type { CreateJumpRequest, Jump } from "./types";
import { createJump, fetchJumps } from "./api";
import { fetchPilots } from "../person/api";
import { fetchAirports } from "../airport/api";
import { fetchCrafts } from "../craft/api";
import { useAirport } from "../airport/AirportContext";
import { logger } from "../../lib/log";

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
export default function JumpForm({ onCreated, airportId }: Props): React.JSX.Element {
	const { airports, selectedAirportId: globalAirportId } = useAirport();
	const [jumpDate, setJumpDate] = useState<string | null>(dayjs().format("YYYY-MM-DD"));
	const [dropdownOpened, setDropdownOpened] = useState(false);
	const [timeKey, setTimeKey] = useState(0);
	const [jumpTime, setJumpTime] = useState<string | null>(null);
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

	useEffect(() => {
		mountedRef.current = true;
		fetchPilots()
			.then((pilotsList) => {
				if (!mountedRef.current) return;
				setPersonOptions(
					pilotsList.map((pilot) => ({ value: String(pilot.id), label: pilot.name })),
				);
			})
			.catch((err) => {
				logger.debug("JumpForm: fetchPilots failed:", err);
			});
		return () => {
			mountedRef.current = false;
		};
	}, []);

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
			.catch((err) => {
				logger.debug("JumpForm: fetchCrafts failed:", err);
			});
		return () => {
			mounted = false;
		};
	}, []);

	useEffect(() => {
		if (airportId) return;
		setSelectedAirportId(globalAirportId ?? null);
	}, [globalAirportId, airportId]);

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
				.catch((err) => {
					logger.debug("JumpForm: fetchAirports failed:", err);
				});
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

	/**
	 * Update the internal date state when the date input changes.
	 */
	const handleDateChange = (value: Date | string | null) => {
		if (!value) {
			setJumpDate(null);
			return;
		}
		const dateObj = typeof value === "string" ? dayjs(value).toDate() : value;
		setJumpDate(dayjs(dateObj).format("YYYY-MM-DD"));
	};

	/**
	 * Update the internal time state when the TimePicker changes.
	 */
	const handleTimeChange = (timeValue: string | null) => {
		setJumpTime(timeValue);
	};

	/**
	 * Submit the form to create a Jump; validation, API call and notification flow.
	 */
	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		const airportToUse = airportId ?? selectedAirportId ?? globalAirportId;
		const fallbackCraft =
			craftRegistrationNumber || (craftsOptions.length > 0 ? craftsOptions[0].value : "");
		if (fallbackCraft && fallbackCraft !== craftRegistrationNumber) {
			setCraftRegistrationNumber(fallbackCraft);
			console.debug("JumpForm: applied fallback craftRegistrationNumber:", fallbackCraft);
		}
		if (
			!jumpDate ||
			!jumpTime ||
			!airportToUse ||
			!fallbackCraft ||
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
			craftRegistrationNumber: fallbackCraft,
			altitudeFeet: Number(altitudeFeet),
			pilotId: pilotId || undefined,
		};

		try {
			setSubmitting(true);
			const created = await createJump(payload);
			console.debug("JumpForm: created jump:", created);
			notifications.show({ color: "green", title: "Jump created", message: "Jump scheduled" });
			setJumpDate(dayjs().format("YYYY-MM-DD"));
			setJumpTime(null);
			setTimeKey((prevKey) => prevKey + 1);
			setAltitudeFeet("");
			setPilotId(null);
			if (onCreated) {
				onCreated?.(created);
			} else {
				try {
					await fetchJumps();
					console.debug("JumpForm: fetched latest jumps after create");
				} catch (err) {
					console.debug("JumpForm: failed to fetch jumps after create:", err);
				}
			}

			try {
				console.debug("JumpForm: dispatching global jumpCreated event", created);
				window?.dispatchEvent(
					new CustomEvent("jumpCreated", { detail: created, bubbles: true, composed: true }),
				);
			} catch (err) {
				logger.debug("JumpForm: failed to dispatch jumpCreated event:", err);
			}
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
					value={craftRegistrationNumber ?? undefined}
					onChange={(value) => {
						setCraftRegistrationNumber(value ?? "");
						console.debug("JumpForm: craft selected:", value);
					}}
				/>
				<Group>
					<DateInput
						label="Date"
						radius={"md"}
						required
						value={jumpDate ? dayjs(jumpDate).toDate() : undefined}
						onChange={handleDateChange}
					/>
					<TimePicker
						key={timeKey}
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
						value={jumpTime ?? undefined}
						onChange={(timeValue: string | null) => {
							handleTimeChange(timeValue);
							if (!timeValue) setDropdownOpened(false);
						}}
						popoverProps={{
							withinPortal: true,
							opened: dropdownOpened,
							/**
							 * Popover onChange: close the dropdown when the popover is closed.
							 * Mantine passes the `opened` boolean; when it becomes false we ensure
							 * the local `dropdownOpened` state is cleared.
							 */
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
			{}
		</form>
	);
}
