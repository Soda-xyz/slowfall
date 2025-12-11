import React, { useEffect, useRef, useState } from "react";
import { Stack, Title, Card } from "@mantine/core";
import JumpForm from "../jump/JumpForm";
import JumpTable from "../jump/JumpTable";
import JumpPlanner from "../jump/JumpPlanner";
import { fetchJumps } from "../jump/api";
import { fetchPilots, fetchSkydivers } from "../person/api";
import type { Jump } from "../jump";
import type { PersonDto } from "../jump";

/**
 * DashboardPage
 *
 * High-level dashboard that surfaces quick actions (create jump) and upcoming data.
 */
export default function DashboardPage(): React.JSX.Element {
	const [jumps, setJumps] = useState<Jump[]>([]);
	const [pilots, setPilots] = useState<PersonDto[]>([]);
	const [skydivers, setSkydivers] = useState<PersonDto[]>([]);
	const mountedRef = useRef(true);

	/**
	 * Load jumps, pilots, and skydivers and set state.
	 */
	const loadAll = async (signal?: AbortSignal) => {
		try {
			const [jumpsData, pilotsData, skydiversData] = await Promise.all([
				fetchJumps(signal),
				fetchPilots(),
				fetchSkydivers(),
			]);

			if (!mountedRef.current) return;
			setJumps(jumpsData);
			setPilots(
				pilotsData.map((person) => ({
					id: String(person.id),
					name: person.name,
					pilot: person.pilot,
					skydiver: person.skydiver,
					weight: person.weight,
					email: person.email,
				})),
			);
			setSkydivers(
				skydiversData.map((person) => ({
					id: String(person.id),
					name: person.name,
					pilot: person.pilot,
					skydiver: person.skydiver,
					weight: person.weight,
					email: person.email,
				})),
			);
		} catch (err) {
			console.debug("DashboardPage: failed to load data:", err);
		}
	};

	useEffect(() => {
		mountedRef.current = true;
		const controller = new AbortController();
		(async () => {
			try {
				await loadAll(controller.signal);
			} catch (err) {
				console.debug("DashboardPage: initial load failed:", err);
			}
		})();

		/**
		 * Event handler to reload jumps/people when a global `jumpCreated` event occurs.
		 */
		const handler = async (_ev: Event) => {
			try {
				await loadAll();
				console.debug("DashboardPage: reloaded data after global jumpCreated event");
			} catch (err) {
				console.debug("DashboardPage: failed to reload after event:", err);
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
				<JumpTable jumps={jumps} pilots={pilots} skydivers={skydivers} onRefresh={loadAll} />
			</Card>
			<Card>
				<JumpPlanner
					jumps={jumps}
					pilots={pilots.map((person) => person.name)}
					skydivers={skydivers.map((person) => person.name)}
					onRefresh={loadAll}
				/>
			</Card>
		</Stack>
	);
}
