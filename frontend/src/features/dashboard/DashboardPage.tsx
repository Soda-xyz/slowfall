import { Stack, Title, Card } from "@mantine/core";
import JumpForm from "../jump/JumpForm";
import JumpTable from "../jump/JumpTable";

export default function DashboardPage() {
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
