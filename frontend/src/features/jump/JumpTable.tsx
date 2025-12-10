import React, { useState } from "react";
import { Button, Group, Table, Text, List, Stack, Menu, TextInput, ScrollArea } from "@mantine/core";
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
export default function JumpTable({ jumps, pilots = [], skydivers = [], onRefresh }: Props): React.JSX.Element {
	const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
	// Controlled key identifying which dropdown is open: `${jumpId}-${mode}`
	const [dropdownOpenedKey, setDropdownOpenedKey] = useState<string | null>(null);
	const [filter, setFilter] = useState<string>("");

	if (!jumps || jumps.length === 0) return <Text>No upcoming jumps</Text>;

	const openFor = (jumpId: string, mode: "skydiver" | "pilot") => {
		setSelectedPersonId(null);
		setFilter("");
		setDropdownOpenedKey(`${jumpId}-${mode}`);
	};

	const closeMenu = () => {
		setSelectedPersonId(null);
		setFilter("");
		setDropdownOpenedKey(null);
	};

	const parseKey = (key: string | null) => {
		if (!key) return { jumpId: null as string | null, mode: null as string | null };
		const idx = key.lastIndexOf("-");
		if (idx === -1) return { jumpId: key, mode: null };
		return { jumpId: key.substring(0, idx), mode: key.substring(idx + 1) as "skydiver" | "pilot" | null };
	};

	const { jumpId: currentJumpId } = parseKey(dropdownOpenedKey);

	const submitAddSkydiver = async (personId?: string) => {
		const personToAdd = personId ?? selectedPersonId;
		if (!currentJumpId || !personToAdd) return;
		try {
			await addSkydiverToJump(currentJumpId, personToAdd);
			notifications.show({ color: "green", title: "Skydiver added", message: "Skydiver added successfully" });
			closeMenu();
			await onRefresh?.();
		} catch (err) {
			notifications.show({ color: "red", title: "Error", message: String(err instanceof Error ? err.message : err) });
		}
	};

	const submitAddPilot = async (personId?: string) => {
		const personToAdd = personId ?? selectedPersonId;
		if (!currentJumpId || !personToAdd) return;
		try {
			await addPilotToJump(currentJumpId, personToAdd);
			notifications.show({ color: "green", title: "Pilot added", message: "Pilot added successfully" });
			closeMenu();
			await onRefresh?.();
		} catch (err) {
			notifications.show({ color: "red", title: "Error", message: String(err instanceof Error ? err.message : err) });
		}
	};

	const rows = jumps
		.slice()
		.sort((left, right) => new Date(left.jumpTime).getTime() - new Date(right.jumpTime).getTime())
		.map((jump) => {
			const skyKey = `${jump.id}-skydiver`;
			const pilotKey = `${jump.id}-pilot`;

			const filteredSkydivers = skydivers.filter((p) => p.name.toLowerCase().includes(filter.toLowerCase()));
			const filteredPilots = pilots.filter((p) => p.name.toLowerCase().includes(filter.toLowerCase()));

			return (
				<tr key={jump.id}>
					<td>{new Date(jump.jumpTime).toLocaleString()}</td>
					<td>{jump.altitudeFeet}</td>
					<td>
						<Group>
							{/* Skydiver menu */}
							<Menu
								opened={dropdownOpenedKey === skyKey}
								onOpen={() => setDropdownOpenedKey(skyKey)}
								onClose={closeMenu}
								withinPortal={true}
							>
								<Menu.Target>
									<Button size="xs" onClick={() => openFor(jump.id, "skydiver")}>Add skydiver</Button>
								</Menu.Target>
								<Menu.Dropdown>
									<TextInput placeholder="Filter..." value={filter} onChange={(e) => setFilter(e.currentTarget.value)} mb="xs" />
									<ScrollArea style={{ maxHeight: 240 }}>
										{filteredSkydivers.length > 0 ? (
											filteredSkydivers.map((p) => (
												<Menu.Item key={p.id} onClick={() => submitAddSkydiver(p.id)}>
													{p.name}
												</Menu.Item>
											))
										) : (
											<Text size="sm" color="dimmed">No matches</Text>
										)}
									</ScrollArea>
								</Menu.Dropdown>
							</Menu>

							{/* Pilot menu */}
							<Menu
								opened={dropdownOpenedKey === pilotKey}
								onOpen={() => setDropdownOpenedKey(pilotKey)}
								onClose={closeMenu}
								withinPortal={true}
							>
								<Menu.Target>
									<Button size="xs" variant="outline" onClick={() => openFor(jump.id, "pilot")}>Add pilot</Button>
								</Menu.Target>
								<Menu.Dropdown>
									<TextInput placeholder="Filter..." value={filter} onChange={(e) => setFilter(e.currentTarget.value)} mb="xs" />
									<ScrollArea style={{ maxHeight: 240 }}>
										{filteredPilots.length > 0 ? (
											filteredPilots.map((p) => (
												<Menu.Item key={p.id} onClick={() => submitAddPilot(p.id)}>
													{p.name}
												</Menu.Item>
											))
										) : (
											<Text size="sm" color="dimmed">No matches</Text>
										)}
									</ScrollArea>
								</Menu.Dropdown>
							</Menu>
						</Group>
					</td>
					<td>
						<Stack>
							<div>
								<Text size="sm" style={{ fontWeight: 700 }}>Skydivers</Text>
								{jump.skydivers && jump.skydivers.length > 0 ? (
									<List withPadding spacing="xs" size="sm">
										{jump.skydivers.map((person) => (
											<List.Item key={person.id}>{person.name}</List.Item>
										))}
									</List>
								) : (
									<Text size="sm" color="dimmed">None</Text>
								)}
							</div>
							<div>
								<Text size="sm" style={{ fontWeight: 700 }}>Pilots</Text>
								{jump.pilots && jump.pilots.length > 0 ? (
									<List withPadding spacing="xs" size="sm">
										{jump.pilots.map((person) => (
											<List.Item key={person.id}>{person.name}</List.Item>
										))}
									</List>
								) : (
									<Text size="sm" color="dimmed">None</Text>
								)}
							</div>
						</Stack>
					</td>
				</tr>
			);
		});

	return (
		<Table striped highlightOnHover>
			<thead>
				<tr>
					<th scope="col">Jump time</th>
					<th scope="col">Altitude (ft)</th>
					<th scope="col">Actions</th>
					<th scope="col">Participants</th>
				</tr>
			</thead>
			<tbody>{rows}</tbody>
		</Table>
	);
}
