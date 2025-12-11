import React, { useState } from "react";
import { Button, Text, Menu, TextInput, ScrollArea, Tooltip, Table } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import type { Jump, PersonDto } from "./types";
import { addSkydiverToJump, addPilotToJump } from "./api";

type Props = {
	jumps: Jump[];
	pilots?: PersonDto[];
	skydivers?: PersonDto[];
	onRefresh?: () => Promise<void> | void;
};

/**
 * JumpTable
 *
 * Renders a list of upcoming jumps as a table. The list is sorted by jumpTime.
 * Provides menu dropdowns for adding a pilot or skydiver to a jump.
 */
export default function JumpTable({
	jumps,
	pilots = [],
	skydivers = [],
	onRefresh,
}: Props): React.JSX.Element {
	const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
	const [dropdownOpenedKey, setDropdownOpenedKey] = useState<string | null>(null);
	const [filter, setFilter] = useState<string>("");

	/**
	 * Compact name helper for display purposes.
	 *
	 * Converts a full name to a short form used in table cells (e.g. "Alice Smith" gives "Alice.S").
	 */
	const compactName = (fullName: string) => {
		if (!fullName) return "";
		const parts = fullName.trim().split(/\s+/);
		if (parts.length === 1) return parts[0];
		const first = parts[0];
		const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
		return `${first}.${lastInitial}`;
	};

	if (!jumps || jumps.length === 0) return <Text>No upcoming jumps</Text>;

	/**
	 * Open the add-person menu for a given jump in the specified mode.
	 */
	const openFor = (jumpId: string, mode: "skydiver" | "pilot") => {
		setSelectedPersonId(null);
		setFilter("");
		setDropdownOpenedKey(`${jumpId}-${mode}`);
	};

	/** Close the add-person menu and clear any temporary selection/filter */
	const closeMenu = () => {
		setSelectedPersonId(null);
		setFilter("");
		setDropdownOpenedKey(null);
	};

	/**
	 * Parse a dropdown key produced by `openFor` into jumpId and mode.
	 */
	const parseKey = (key: string | null) => {
		if (!key) return { jumpId: null as string | null, mode: null as string | null };
		const idx = key.lastIndexOf("-");
		if (idx === -1) return { jumpId: key, mode: null };
		return {
			jumpId: key.substring(0, idx),
			mode: key.substring(idx + 1) as "skydiver" | "pilot" | null,
		};
	};

	const { jumpId: currentJumpId } = parseKey(dropdownOpenedKey);

	/**
	 * Submit adding a skydiver to a jump via the API, show notification, and refresh.
	 */
	const submitAddSkydiver = async (personId?: string) => {
		const personToAdd = personId ?? selectedPersonId;
		if (!currentJumpId || !personToAdd) return;
		try {
			await addSkydiverToJump(currentJumpId, personToAdd);
			notifications.show({
				color: "green",
				title: "Skydiver added",
				message: "Skydiver added successfully",
			});
			closeMenu();
			await onRefresh?.();
		} catch (err) {
			notifications.show({
				color: "red",
				title: "Error",
				message: String(err instanceof Error ? err.message : err),
			});
		}
	};

	/** Submit adding a pilot to a jump */
	const submitAddPilot = async (personId?: string) => {
		const personToAdd = personId ?? selectedPersonId;
		if (!currentJumpId || !personToAdd) return;
		try {
			await addPilotToJump(currentJumpId, personToAdd);
			notifications.show({
				color: "green",
				title: "Pilot added",
				message: "Pilot added successfully",
			});
			closeMenu();
			await onRefresh?.();
		} catch (err) {
			notifications.show({
				color: "red",
				title: "Error",
				message: String(err instanceof Error ? err.message : err),
			});
		}
	};

	const rows = jumps
		.slice()
		.sort((left, right) => new Date(left.jumpTime).getTime() - new Date(right.jumpTime).getTime())
		.map((jump) => {
			const skyKey = `${jump.id}-skydiver`;
			const pilotKey = `${jump.id}-pilot`;

			const filteredSkydivers = skydivers.filter((person) =>
				person.name.toLowerCase().includes(filter.toLowerCase()),
			);
			const filteredPilots = pilots.filter((person) =>
				person.name.toLowerCase().includes(filter.toLowerCase()),
			);

			const maxInline = 3;
			const skyFull = jump.skydivers?.map((person) => person.name) ?? [];
			const pilotFull = jump.pilots?.map((person) => person.name) ?? [];

			const skyInline =
				skyFull.length === 0
					? "None"
					: skyFull.slice(0, maxInline).map(compactName).join(", ") +
						(skyFull.length > maxInline ? ` +${skyFull.length - maxInline}` : "");
			const pilotInline =
				pilotFull.length === 0
					? "None"
					: pilotFull.slice(0, maxInline).map(compactName).join(", ") +
						(pilotFull.length > maxInline ? ` +${pilotFull.length - maxInline}` : "");

			return (
				<Table.Tr key={jump.id}>
					<Table.Td style={{ width: 220, padding: 8 }}>
						<Text size="sm">{new Date(jump.jumpTime).toLocaleString()}</Text>
					</Table.Td>
					<Table.Td style={{ width: 100, padding: 8 }}>
						<Text size="sm">{jump.altitudeFeet}</Text>
					</Table.Td>
					<Table.Td style={{ padding: 8 }}>
						{skyFull.length > 0 ? (
							<Tooltip label={skyFull.join(", ")} position="bottom" withArrow>
								<Text
									size="sm"
									style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
								>
									{skyInline}
								</Text>
							</Tooltip>
						) : (
							<Text size="sm">None</Text>
						)}
					</Table.Td>
					<Table.Td style={{ padding: 8 }}>
						{pilotFull.length > 0 ? (
							<Tooltip label={pilotFull.join(", ")} position="bottom" withArrow>
								<Text
									size="sm"
									style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
								>
									{pilotInline}
								</Text>
							</Tooltip>
						) : (
							<Text size="sm">None</Text>
						)}
					</Table.Td>
					<Table.Td style={{ width: 260, padding: 8, textAlign: "right" }}>
						<Menu
							opened={dropdownOpenedKey === skyKey}
							onOpen={() => setDropdownOpenedKey(skyKey)}
							onClose={closeMenu}
							withinPortal
						>
							<Menu.Target>
								<Button size="xs" onClick={() => openFor(jump.id, "skydiver")}>
									Add skydiver
								</Button>
							</Menu.Target>
							<Menu.Dropdown>
								<TextInput
									placeholder="Filter..."
									value={filter}
									onChange={(e) => setFilter(e.currentTarget.value)}
									mb="xs"
								/>
								<ScrollArea style={{ maxHeight: 240 }}>
									{filteredSkydivers.length > 0 ? (
										filteredSkydivers.map((person) => (
											<Menu.Item key={person.id} onClick={() => submitAddSkydiver(person.id)}>
												<Text size="sm">{person.name}</Text>
											</Menu.Item>
										))
									) : (
										<Text size="sm">No matches</Text>
									)}
								</ScrollArea>
							</Menu.Dropdown>
						</Menu>
						<Menu
							opened={dropdownOpenedKey === pilotKey}
							onOpen={() => setDropdownOpenedKey(pilotKey)}
							onClose={closeMenu}
							withinPortal
						>
							<Menu.Target>
								<Button size="xs" variant="outline" onClick={() => openFor(jump.id, "pilot")}>
									Add pilot
								</Button>
							</Menu.Target>
							<Menu.Dropdown>
								<TextInput
									placeholder="Filter..."
									value={filter}
									onChange={(e) => setFilter(e.currentTarget.value)}
									mb="xs"
								/>
								<ScrollArea style={{ maxHeight: 240 }}>
									{filteredPilots.length > 0 ? (
										filteredPilots.map((person) => (
											<Menu.Item key={person.id} onClick={() => submitAddPilot(person.id)}>
												<Text size="sm">{person.name}</Text>
											</Menu.Item>
										))
									) : (
										<Text size="sm">No matches</Text>
									)}
								</ScrollArea>
							</Menu.Dropdown>
						</Menu>
					</Table.Td>
				</Table.Tr>
			);
		});

	// render table
	return (
		<Table.ScrollContainer minWidth={900} type="native">
			<Table>
				<Table.Thead>
					<Table.Tr>
						<Table.Th style={{ width: 220 }}>
							<Text size="sm" fw={600}>
								Jump time
							</Text>
						</Table.Th>
						<Table.Th style={{ width: 100 }}>
							<Text size="sm" fw={600}>
								Altitude (ft)
							</Text>
						</Table.Th>
						<Table.Th>
							<Text size="sm" fw={600}>
								Skydivers
							</Text>
						</Table.Th>
						<Table.Th>
							<Text size="sm" fw={600}>
								Pilots
							</Text>
						</Table.Th>
						<Table.Th style={{ width: 260 }}>
							<Text size="sm" fw={600}>
								Actions
							</Text>
						</Table.Th>
					</Table.Tr>
				</Table.Thead>
				<Table.Tbody>{rows}</Table.Tbody>
			</Table>
		</Table.ScrollContainer>
	);
}
