// frontend/src/features/jump/JumpPlanner.tsx
import React, {useState} from 'react';
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

	// Fallback sample data if API data not provided yet
	const defaultPilots = ['Pilot A', 'Pilot B', 'Pilot C'];
	const defaultSkydivers = [
		'Skydiver 1',
		'Skydiver 2',
		'Skydiver 3',
		'Skydiver 4',
		'Skydiver 5',
		'Skydiver 6',
	];

	// Use combined list if present, otherwise the specific lists, otherwise defaults.
	const pilotList = combined.length > 0 ? combined : pilots ?? defaultPilots;
	const skydiverList = combined.length > 0 ? combined : skydivers ?? defaultSkydivers;

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

	if (jumps && jumps.length === 0) return <Text>No upcoming jumps</Text>;

	function ComboboxField({
				   onChange,
				   options,
				   placeholder,
				   icon,
				}: {
		value: string | null;
		onChange: (v: string) => void;
		options: string[];
		placeholder?: string;
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
						aria-label={placeholder ?? 'open'}
						title={placeholder}
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
								placeholder={`Pilot ${idx + 1}`}
								icon={<IconParkingCircle size={18} />}
							/>
							<Text size="sm">
								{selectedPilots[idx] ?? 'None'}
							</Text>
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
									{Array.from({length: 3}).map((_, idx) => (
										<Group key={`sky-left-${idx}`}>
											<ComboboxField
												value={selectedSkydivers.left[idx]}
												onChange={(v) => setSkydiverAtUnique('left', idx, v)}
												options={skydiverList}
												placeholder={`Skydiver ${idx + 1}`}
												icon={<IconParachute size={16}/>}

											/>
											<Text size="sm">
												{selectedSkydivers.left[idx] ?? 'None'}
											</Text>
										</Group>
									))}
								</Box>
							</Group>
							<Group>
								<Box mt="xs">
									<Text mt="lg" mb="xs">
										Right
									</Text>
									{Array.from({length: 3}).map((_, idx) => (
										<Group key={`sky-right-${idx}`}>
											<ComboboxField
												value={selectedSkydivers.right[idx]}
												onChange={(v) => setSkydiverAtUnique('right', idx, v)}
												options={skydiverList}
												placeholder={`Skydiver ${idx + 1}`}
												icon={<IconParachute size={16}/>}
											/>
											<Text size="sm">
												{selectedSkydivers.right[idx] ?? 'None'}
											</Text>
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
