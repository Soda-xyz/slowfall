import React, { useEffect, useRef, useState } from "react";
import { Card, Container, Group, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import JumpForm from "./JumpForm";
import JumpTable from "./JumpTable";
import { fetchJumps } from "./api";
import type { Jump } from "./types";

/**
 * JumpPage
 *
 * Page component that loads jumps and renders the jump creation form and the upcoming-jumps table.
 */
export default function JumpPage(): React.JSX.Element {
	const [jumps, setJumps] = useState<Jump[]>([]);
	const mountedRef = useRef(true);
	const loadAllRef = useRef<(signal?: AbortSignal) => Promise<void>>(async () => {});

	useEffect(() => {
		mountedRef.current = true;
		const controller = new AbortController();

		/**
		 * Fetch jumps and populate local state.
		 * @param signal - optional AbortSignal to cancel the request
		 */
		const fetchAndSet = async (signal?: AbortSignal) => {
			try {
				const jumpsData = await fetchJumps(signal);

				if (!mountedRef.current) return;
				setJumps(jumpsData);
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

	useEffect(() => {
		if (typeof window === "undefined") return;
		/**
		 * Handle global `jumpCreated` event by reloading all data.
		 */
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

	/**
	 * When a jump is created locally, add it to the list and refresh server data.
	 */
	const onCreated = async (createdJump: Jump) => {
		console.debug("JumpPage: onCreated received:", createdJump);
		setJumps((prev) => {
			const next = [...prev, createdJump];
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
					<JumpTable jumps={jumps} />

					{/** The per-jump add UI is now handled inside JumpTable (Dashboard supplies people lists) */}
				</Card>
			</Container>
		</>
	);
}
