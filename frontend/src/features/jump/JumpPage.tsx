import React, { useEffect, useRef, useState } from "react";
import { Card, Container, Group, Title, Select, Button } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import JumpForm from "./JumpForm";
import JumpTable from "./JumpTable";
import { fetchJumps, addSkydiverToJump, addPilotToJump } from "./api";
import { fetchPilots, fetchSkydivers } from "../person/api";
import type { Jump, PersonDto } from "./types";

/**
 * JumpPage
 *
 * Page component that loads jumps and available people (pilots/skydivers),
 * renders the jump creation form and the upcoming-jumps table. Supports
 * adding a selected person as a pilot or skydiver to a target jump.
 */
export default function JumpPage(): React.JSX.Element {
	const [jumps, setJumps] = useState<Jump[]>([]);
	const [pilots, setPilots] = useState<PersonDto[]>([]);
	const [skydivers, setSkydivers] = useState<PersonDto[]>([]);
	const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
	const [targetJumpId, setTargetJumpId] = useState<string | null>(null);
	const [actionMode, setActionMode] = useState<"skydiver" | "pilot" | null>(null);
	const mountedRef = useRef(true);
	const loadAllRef = useRef<(signal?: AbortSignal) => Promise<void>>(async () => {});

	useEffect(() => {
		mountedRef.current = true;
		const controller = new AbortController();

		const fetchAndSet = async (signal?: AbortSignal) => {
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
				if (!mountedRef.current) return;
				notifications.show({
					color: "red",
					title: "Load failed",
					message: String(err instanceof Error ? err.message : err),
				});
			}
		};

		loadAllRef.current = fetchAndSet;
		fetchAndSet(controller.signal);
		return () => {
			mountedRef.current = false;
			controller.abort();
		};
	}, []);

	// Listen for global jumpCreated events (dispatched by JumpForm after create)
	useEffect(() => {
		if (typeof window === "undefined") return;
		const handler = async (ev: Event) => {
			const detail = (ev as CustomEvent).detail;
			console.debug("JumpPage: received global jumpCreated event detail:", detail);
			try {
				await loadAllRef.current();
				console.debug("JumpPage: reloaded jumps in response to global jumpCreated event");
			} catch (err) {
				console.debug("JumpPage: failed to reload after global event:", err);
			}
		};
		window.addEventListener("jumpCreated", handler as EventListener);
		return () => window.removeEventListener("jumpCreated", handler as EventListener);
	}, []);

	const onCreated = async (j: Jump) => {
		console.debug("JumpPage: onCreated received:", j);
		setJumps((prev) => {
			const next = [...prev, j];
			console.debug("JumpPage: updated jumps array:", next);
			return next;
		});

		try {
			await loadAllRef.current();
			console.debug("JumpPage: reloaded jumps from server after create");
		} catch (err) {
			console.debug("JumpPage: failed to reload jumps after create:", err);
		}
	};

	const handleAddSkydiver = async (jumpId: string) => {
		setTargetJumpId(jumpId);
		setActionMode("skydiver");
	};

	const submitAddSkydiver = async () => {
		if (!targetJumpId || !selectedPersonId) return;
		try {
			await addSkydiverToJump(targetJumpId, selectedPersonId);
			notifications.show({
				color: "green",
				title: "Skydiver added",
				message: "Skydiver added successfully",
			});
			setSelectedPersonId(null);
			setTargetJumpId(null);
			await loadAllRef.current();
		} catch (err) {
			notifications.show({
				color: "red",
				title: "Error",
				message: String(err instanceof Error ? err.message : err),
			});
		}
	};

	const handleAddPilot = async (jumpId: string) => {
		setTargetJumpId(jumpId);
		setActionMode("pilot");
	};

	const submitAddPilot = async () => {
		if (!targetJumpId || !selectedPersonId) return;
		try {
			await addPilotToJump(targetJumpId, selectedPersonId);
			notifications.show({
				color: "green",
				title: "Pilot added",
				message: "Pilot added successfully",
			});
			setSelectedPersonId(null);
			setTargetJumpId(null);
			await loadAllRef.current();
		} catch (err) {
			notifications.show({
				color: "red",
				title: "Error",
				message: String(err instanceof Error ? err.message : err),
			});
		}
	};

	return (
		<>
			<Group p="md">
				<Title order={3}>Jump schedule</Title>
			</Group>

			<Container size="lg">
				<Card withBorder shadow="sm" radius="md" p="md" mb="md">
					<Title order={4} mb="sm">
						Create jump
					</Title>
					<JumpForm onCreated={onCreated} />
				</Card>

				<Card withBorder shadow="sm" radius="md" p="md">
					<Title order={4} mb="sm">
						Upcoming jumps
					</Title>
					<JumpTable jumps={jumps} onAddSkydiver={handleAddSkydiver} onAddPilot={handleAddPilot} />

					{targetJumpId && (
						<Card mt="md">
							<Select
								label="Select person"
								placeholder="Search person"
								searchable
								value={selectedPersonId ?? undefined}
								onChange={(v) => setSelectedPersonId(v ?? null)}
								data={(actionMode === "pilot" ? pilots : skydivers).map((p) => ({
									value: p.id,
									label: p.name,
								}))}
							/>
							<Group mt="xs">
								{actionMode === "skydiver" && (
									<Button onClick={submitAddSkydiver} disabled={!selectedPersonId}>
										Add skydiver
									</Button>
								)}
								{actionMode === "pilot" && (
									<Button onClick={submitAddPilot} disabled={!selectedPersonId} variant="outline">
										Add pilot
									</Button>
								)}
								<Button
									variant="subtle"
									onClick={() => {
										setTargetJumpId(null);
										setSelectedPersonId(null);
									}}
								>
									Cancel
								</Button>
							</Group>
						</Card>
					)}
				</Card>
			</Container>
		</>
	);
}
