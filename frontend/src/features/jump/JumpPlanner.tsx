import React, { useEffect, useState } from "react";
import { ActionIcon, Box, Text, useCombobox, Combobox, Group, Stack, Card } from "@mantine/core";
import { IconParachute, IconParkingCircle } from "@tabler/icons-react";
import type { Jump } from "./types";
import type { PersonDto } from "./types";
import dayjs from "dayjs";

type Props = {
	jumps?: Jump[];
	pilots?: Array<string | PersonDto>;
	skydivers?: Array<string | PersonDto>;
	people?: Array<string | PersonDto>;
	onRefresh?: () => Promise<void>;
};

/**
 *
 */
export default function JumpPlanner({
	jumps,
	pilots,
	skydivers,
	people,
}: Props): React.JSX.Element {
	const combined = people ?? [];
	void pilots;
	void skydivers;
	void people;
	void combined;

	/**
	 *
	 */
	const getNextJump = (): Jump | null => {
		if (!jumps || jumps.length === 0) return null;
		const now = Date.now();
		const sorted = [...jumps].sort(
			(a, b) => new Date(a.jumpTime).getTime() - new Date(b.jumpTime).getTime(),
		);
		return sorted.find((j) => new Date(j.jumpTime).getTime() > now) ?? null;
	};

	const nextJump = getNextJump();

	/**
	 *
	 */
	const toName = (p: any): string => {
		if (!p) return "";
		if (typeof p === "string") return p;
		if (typeof p === "object" && (p.name || p.id)) return String(p.name ?? p.id ?? "");
		return String(p);
	};

	const pilotList: string[] = nextJump ? (nextJump.pilots ?? []).map(toName) : [];

	const skydiverList: string[] = nextJump ? (nextJump.skydivers ?? []).map(toName) : [];

	const [selectedPilots, setSelectedPilots] = useState<(string | null)[]>([null, null]);
	const [selectedSkydivers, setSelectedSkydivers] = useState<{
		left: (string | null)[];
		right: (string | null)[];
	}>({
		left: Array(3).fill(null),
		right: Array(3).fill(null),
	});

	/**
	 *
	 */
	function setPilotAtUnique(index: number, value: string) {
		setSelectedPilots((prev) => {
			const copy = [...prev];
			// clear other occurrences
			for (let i = 0; i < copy.length; i++) {
				if (i !== index && copy[i] === value) copy[i] = null;
			}
			copy[index] = value;
			return copy;
		});
	}

	/**
	 *
	 */
	function setSkydiverAtUnique(side: "left" | "right", index: number, value: string) {
		setSelectedSkydivers((prev) => {
			const left = [...prev.left];
			const right = [...prev.right];
			for (let i = 0; i < left.length; i++) {
				if (!(side === "left" && i === index) && left[i] === value) left[i] = null;
			}
			for (let i = 0; i < right.length; i++) {
				if (!(side === "right" && i === index) && right[i] === value) right[i] = null;
			}
			if (side === "left") left[index] = value;
			else right[index] = value;
			return { left, right };
		});
	}

	useEffect(() => {
		const nj = getNextJump();
		if (!nj) {
			setSelectedPilots([null, null]);
			setSelectedSkydivers({ left: Array(3).fill(null), right: Array(3).fill(null) });
			return;
		}
		const psrc = (nj.pilots ?? []).map(toName);
		setSelectedPilots([psrc[0] ?? null, psrc[1] ?? null]);
		const ssrc = (nj.skydivers ?? []).map(toName);
		const left = Array(3).fill(null);
		const right = Array(3).fill(null);
		for (let i = 0; i < Math.min(3, ssrc.length); i++) left[i] = ssrc[i] ?? null;
		for (let i = 3; i < Math.min(6, ssrc.length); i++) right[i - 3] = ssrc[i] ?? null;
		setSelectedSkydivers({ left, right });
	}, [jumps]);

	/**
	 *
	 */
	function ComboboxField({
		value,
		onChange,
		options,
		icon,
	}: {
		value: string | null;
		onChange: (v: string) => void;
		options: string[];
		icon?: React.ReactNode;
	}) {
		const store = useCombobox();
		const disabled = !options || options.length === 0;

		return (
			<Combobox
				store={store}
				width={220}
				position="bottom-start"
				withArrow
				withinPortal={false}
				onOptionSubmit={(val) => {
					onChange(val);
					store.closeDropdown();
				}}
			>
				<Combobox.Target>
					<ActionIcon
						variant="light"
						size="lg"
						disabled={disabled}
						onClick={() => {
							if (disabled) return;
							store.toggleDropdown();
						}}
						aria-label={
							disabled ? "no options available" : value ? `open ${value}` : "open options"
						}
						title={disabled ? "No participants for upcoming jump" : (value ?? "open options")}
					>
						{icon}
					</ActionIcon>
				</Combobox.Target>

				{!disabled && (
					<Combobox.Dropdown>
						<Combobox.Options>
							{options.map((opt) => (
								<Combobox.Option value={opt} key={opt}>
									{opt}
								</Combobox.Option>
							))}
						</Combobox.Options>
					</Combobox.Dropdown>
				)}
			</Combobox>
		);
	}

	return (
		<Card>
			<Group>
				<Text mb="md">Weight distribution</Text>
				<Box>
					<Text mb="md">{dayjs(nextJump?.jumpTime).format("HH:MM") ?? "No upcomming jump"}</Text>
				</Box>
			</Group>
			<Box>
				<Text mb="xs">Pilots</Text>
				<Group>
					{Array.from({ length: 2 }).map((_, idx) => (
						<Box key={`pilot-${idx}`} mt="xs">
							<ComboboxField
								value={selectedPilots[idx]}
								onChange={(v) => setPilotAtUnique(idx, v)}
								options={pilotList}
								icon={<IconParkingCircle size={18} />}
							/>
							<Text size="sm">{selectedPilots[idx] || "Unassigned"}</Text>
						</Box>
					))}
				</Group>
				<Group>
					<Stack>
						<Text mt="lg" mb="xs">
							Skydivers
						</Text>
						<Group>
							<Group>
								<Box mt="xs">
									<Text mt="lg" mb="xs">
										Left
									</Text>
									{Array.from({ length: 3 }).map((_, idx) => (
										<Group key={`sky-left-${idx}`}>
											<ComboboxField
												value={selectedSkydivers.left[idx]}
												onChange={(v) => setSkydiverAtUnique("left", idx, v)}
												options={skydiverList}
												icon={<IconParachute size={16} />}
											/>
											<Text size="sm">{selectedSkydivers.left[idx] || "Unassigned"}</Text>
										</Group>
									))}
								</Box>
							</Group>
							<Group>
								<Box mt="xs">
									<Text mt="lg" mb="xs">
										Right
									</Text>
									{Array.from({ length: 3 }).map((_, idx) => (
										<Group key={`sky-right-${idx}`}>
											<ComboboxField
												value={selectedSkydivers.right[idx]}
												onChange={(v) => setSkydiverAtUnique("right", idx, v)}
												options={skydiverList}
												icon={<IconParachute size={16} />}
											/>
											<Text size="sm">{selectedSkydivers.right[idx] || "Unassigned"}</Text>
										</Group>
									))}
								</Box>
							</Group>
						</Group>
					</Stack>
				</Group>
			</Box>
		</Card>
	);
}
