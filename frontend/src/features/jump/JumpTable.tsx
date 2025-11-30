import React from "react";
import { Button, Group, Table, Text } from "@mantine/core";
import type { Jump } from "./types";

type Props = {
	jumps: Jump[];
	onAddSkydiver?: (jumpId: string) => void;
	onAddPilot?: (jumpId: string) => void;
};

/**
 * JumpTable
 *
 * Renders a list of upcoming jumps as a table. The list is sorted by jumpTime.
 * Provides optional callbacks for adding skydivers or pilots to a given jump.
 */
export default function JumpTable({ jumps, onAddSkydiver, onAddPilot }: Props): React.JSX.Element {
	if (!jumps || jumps.length === 0) return <Text>No upcoming jumps</Text>;

	const rows = jumps
		.slice()
		.sort((left, right) => new Date(left.jumpTime).getTime() - new Date(right.jumpTime).getTime())
		.map((jump) => (
			<tr key={jump.id}>
				<td>{new Date(jump.jumpTime).toLocaleString()}</td>
				<td>{jump.altitudeFeet}</td>
				<td>
					<Group>
						<Button size="xs" onClick={() => onAddSkydiver?.(jump.id)}>
							Add skydiver
						</Button>
						<Button size="xs" variant="outline" onClick={() => onAddPilot?.(jump.id)}>
							Add pilot
						</Button>
					</Group>
				</td>
				<td>
					<div>
						<strong>Skydivers:</strong>
						<ul>
							{(jump.skydivers ?? []).map((person) => (
								<li key={person.id}>{person.name}</li>
							))}
						</ul>
					</div>
					<div>
						<strong>Pilots:</strong>
						<ul>
							{(jump.pilots ?? []).map((person) => (
								<li key={person.id}>{person.name}</li>
							))}
						</ul>
					</div>
				</td>
			</tr>
		));

	return (
		<Table striped highlightOnHover>
			<thead>
				<tr>
					<th>Jump time</th>
					<th>Altitude</th>
				</tr>
			</thead>
			<tbody>{rows}</tbody>
		</Table>
	);
}
