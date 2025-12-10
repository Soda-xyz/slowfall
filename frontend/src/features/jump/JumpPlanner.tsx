// frontend/src/features/jump/JumpPlanner.tsx
import React, {useEffect, useState} from 'react';
import {ActionIcon, Box, Text, useCombobox, Combobox, Group, Stack, Card} from '@mantine/core';
import {IconParachute, IconParkingCircle, IconRefresh} from '@tabler/icons-react';
import type {Jump} from './types';

type Props = {
	jumps?: Jump[]; // kept for compatibility
	pilots?: string[]; // list from API (names)
	skydivers?: string[]; // list from API (names)
	people?: string[]; // optional combined list of names
	onRefresh?: () => Promise<void>;
};

export default function JumpPlanner({jumps, pilots, skydivers, people, onRefresh}: Props): React.JSX.Element {
	// If a combined people list is provided, prefer that for both pilot and skydiver options.
	const combined = people ?? [];

	// Use combined list if present, otherwise prefer next upcoming jump data, otherwise props lists, otherwise empty.
	const getNextJump = (): Jump | null => {
		if (!jumps || jumps.length === 0) return null;
		const now = Date.now();
		const sorted = [...jumps].sort((a, b) => new Date(a.jumpTime).getTime() - new Date(b.jumpTime).getTime());
		return sorted.find((j) => new Date(j.jumpTime).getTime() > now) ?? sorted[0] ?? null;
	};

	const nextJump = getNextJump();

	const toName = (p: any): string => {
		if (!p) return '';
		if (typeof p === 'string') return p;
		if (typeof p === 'object' && (p.name || p.id)) return String(p.name ?? p.id ?? '');
		return String(p);
	};

	const pilotList = combined.length > 0
		? combined
		: (nextJump?.pilots?.map(toName) ?? pilots ?? []);

	const skydiverList = combined.length > 0
		? combined
		: (nextJump?.skydivers?.map(toName) ?? skydivers ?? []);

	const [selectedPilots, setSelectedPilots] = useState<(string | null)[]>([null, null]);
	const [selectedSkydivers, setSelectedSkydivers] = useState<{ left: (string | null)[]; right: (string | null)[] }>({
		left: Array(3).fill(null),
		right: Array(3).fill(null),
	});

	// Refresh state for the button
	const [isRefreshing, setIsRefreshing] = useState(false);

	// Uniqueness helpers: when assigning a person to a slot, remove them from any other slot
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

	function setSkydiverAtUnique(side: 'left' | 'right', index: number, value: string) {
		setSelectedSkydivers((prev) => {
			const left = [...prev.left];
			const right = [...prev.right];
			// clear other occurrences across both sides
			for (let i = 0; i < left.length; i++) {
				if (!(side === 'left' && i === index) && left[i] === value) left[i] = null;
			}
			for (let i = 0; i < right.length; i++) {
				if (!(side === 'right' && i === index) && right[i] === value) right[i] = null;
			}
			if (side === 'left') left[index] = value; else right[index] = value;
			return { left, right };
		});
	}

	// When mounts or when `jumps` updates (for example after refresh), populate slots from next jump if present
	useEffect(() => {
		const nj = getNextJump();
		if (!nj) return;
		// populate pilots (if present on the jump)
		const psrc = (nj.pilots ?? []).map(toName);
		setSelectedPilots([psrc[0] ?? null, psrc[1] ?? null]);
		// populate skydivers - try to split into left and right evenly if possible
		const ssrc = (nj.skydivers ?? []).map(toName);
		const left = Array(3).fill(null);
		const right = Array(3).fill(null);
		for (let i = 0; i < Math.min(3, ssrc.length); i++) left[i] = ssrc[i] ?? null;
		for (let i = 3; i < Math.min(6, ssrc.length); i++) right[i - 3] = ssrc[i] ?? null;
		setSelectedSkydivers({ left, right });
	}, [jumps]);

	function ComboboxField({
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
						onClick={() => {
						store.toggleDropdown();
						}}
						aria-label={'open'}
					>
						{icon}
					</ActionIcon>
				</Combobox.Target>

				<Combobox.Dropdown>
					<Combobox.Options>
						{options.map((opt) => (
							<Combobox.Option value={opt} key={opt}>
								{opt}
							</Combobox.Option>
						))}
					</Combobox.Options>
				</Combobox.Dropdown>
			</Combobox>
		);
	}

	return (
		<Card>
			<Group>
				<Text mb="md">Weight distribution</Text>
				<ActionIcon
					variant="light"
					size="lg"
					disabled={isRefreshing}
					onClick={async () => {
						if (!onRefresh) return;
						setIsRefreshing(true);
						try {
							await onRefresh();
						} catch (err) {
							console.error('JumpPlanner: refresh failed', err);
						} finally {
							setIsRefreshing(false);
						}
					}}
				>
					<IconRefresh size={24} />
				</ActionIcon>
				{isRefreshing && <Text size="xs" color="dimmed" ml="xs">Refreshing...</Text>}
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
							<Text size="sm">
								{selectedPilots[idx] || ''}
							</Text>
						</Box>
					))}
				</Group>
				<Group>
					<Stack>
						<Text mt="lg" mb="xs">Skydivers</Text>
						<Group>
							<Group>
								<Box mt="xs">
									<Text mt="lg" mb="xs">Left</Text>
									{Array.from({length: 3}).map((_, idx) => (
										<Group key={`sky-left-${idx}`}>
											<ComboboxField
												value={selectedSkydivers.left[idx]}
												onChange={(v) => setSkydiverAtUnique('left', idx, v)}
												options={skydiverList}
												icon={<IconParachute size={16}/>}

											/>
											<Text size="sm">{selectedSkydivers.left[idx] || ''}</Text>
										</Group>
									))}
								</Box>
							</Group>
							<Group>
								<Box mt="xs">
									<Text mt="lg" mb="xs">Right</Text>
									{Array.from({length: 3}).map((_, idx) => (
										<Group key={`sky-right-${idx}`}>
											<ComboboxField
												value={selectedSkydivers.right[idx]}
												onChange={(v) => setSkydiverAtUnique('right', idx, v)}
												options={skydiverList}
												icon={<IconParachute size={16}/>}
											/>
											<Text size="sm">{selectedSkydivers.right[idx] || ''}</Text>
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
