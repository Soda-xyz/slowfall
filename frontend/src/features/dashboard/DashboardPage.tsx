import React, { useEffect, useRef, useState } from "react";
import { Stack, Title, Card } from "@mantine/core";
import JumpForm from "../jump/JumpForm";
import JumpTable from "../jump/JumpTable";
import { fetchJumps } from "../jump/api";
import type { Jump } from "../jump/types";

/**
 * DashboardPage
 *
 * High-level dashboard that surfaces quick actions (create jump) and upcoming data.
 */
export default function DashboardPage(): React.JSX.Element {
	const [jumps, setJumps] = useState<Jump[]>([]);
	const mountedRef = useRef(true);

	useEffect(() => {
		mountedRef.current = true;
		const controller = new AbortController();

		const load = async () => {
			try {
				const data = await fetchJumps(controller.signal);
				if (!mountedRef.current) return;
				setJumps(data);
			} catch (err) {
				// ignore load errors on dashboard for now
				console.debug("DashboardPage: failed to load jumps:", err);
			}
		};

		load();

		const handler = async (_ev: Event) => {
			try {
				const data = await fetchJumps();
				if (!mountedRef.current) return;
				setJumps(data);
				console.debug("DashboardPage: reloaded jumps after global jumpCreated event");
			} catch (err) {
				console.debug("DashboardPage: failed to reload jumps after event:", err);
			}
		};
		window.addEventListener("jumpCreated", handler as EventListener);

		return () => {
			mountedRef.current = false;
			controller.abort();
			window.removeEventListener("jumpCreated", handler as EventListener);
		};
	}, []);

	return (
		<Stack gap="md">
			<Title order={3}>Dashboard</Title>

			<Card shadow="xs" padding="md">
				<JumpForm />
			</Card>

			<Card shadow="xs" padding="md">
				<JumpTable jumps={jumps} />
			</Card>
		</Stack>
	);
}
