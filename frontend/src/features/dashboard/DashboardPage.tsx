import React from "react";
import { Stack, Title, Card } from "@mantine/core";
import JumpForm from "../jump/JumpForm";
import JumpTable from "../jump/JumpTable";

/**
 * DashboardPage
 *
 * High-level dashboard that surfaces quick actions (create jump) and upcoming data.
 */
export default function DashboardPage(): React.JSX.Element {
	return (
		<Stack gap="md">
			<Title order={3}>Dashboard</Title>

			<Card shadow="xs" padding="md">
				<JumpForm />
			</Card>

			<Card shadow="xs" padding="md">
				<JumpTable jumps={[]} />
			</Card>
		</Stack>
	);
}
