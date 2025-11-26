import { Table, Button, Text, Group } from "@mantine/core";
import type { Jump } from "./types";

type Props = {
	jumps: Jump[];
	onAddSkydiver?: (jumpId: string) => void;
	onAddPilot?: (jumpId: string) => void;
};

export default function JumpTable({ jumps, onAddSkydiver, onAddPilot }: Props) {
	if (!jumps || jumps.length === 0) return <Text>No upcoming jumps</Text>;

	const rows = jumps
		.slice()
		.sort((a, b) => new Date(a.jumpTime).getTime() - new Date(b.jumpTime).getTime())
		.map((j) => (
			<tr key={j.id}>
				<td>{new Date(j.jumpTime).toLocaleString()}</td>
				<td>{j.altitudeFeet}</td>
				<td>
					<Group>
						<Button size="xs" onClick={() => onAddSkydiver?.(j.id)}>
							Add skydiver
						</Button>
						<Button size="xs" variant="outline" onClick={() => onAddPilot?.(j.id)}>
							Add pilot
						</Button>
					</Group>
				</td>
				<td>
					<div>
						<strong>Skydivers:</strong>
						<ul>
							{(j.skydivers ?? []).map((p) => (
								<li key={p.id}>{p.name}</li>
							))}
						</ul>
					</div>
					<div>
						<strong>Pilots:</strong>
						<ul>
							{(j.pilots ?? []).map((p) => (
								<li key={p.id}>{p.name}</li>
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
