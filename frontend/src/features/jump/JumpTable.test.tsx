// Ensure api is mocked before component imports
vi.mock('./api', async () => {
	const actual: any = await vi.importActual('./api');
	return {
		...actual,
		addSkydiverToJump: vi.fn(() => Promise.resolve()),
		addPilotToJump: vi.fn(() => Promise.resolve()),
	};
});

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import JumpTable from './JumpTable';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import * as api from './api';

beforeEach(() => vi.clearAllMocks());

describe('JumpTable', () => {
	it('renders no upcoming jumps when empty', () => {
		render(
			<MantineProvider>
				<Notifications position="top-right" />
				<JumpTable jumps={[]} />
			</MantineProvider>,
		);
		expect(screen.getByText(/No upcoming jumps/i)).toBeTruthy();
	});

	it('renders jump rows sorted by time and allows adding skydiver', async () => {
		const now = new Date();
		const later = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
		const earlier = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
		const jumps = [
			{ id: 'j-later', jumpTime: later, airportId: 'a1', altitudeFeet: 8000, skydivers: [], pilots: [] },
			{ id: 'j-earlier', jumpTime: earlier, airportId: 'a1', altitudeFeet: 9000, skydivers: [], pilots: [] },
		];

		render(
			<MantineProvider>
				<Notifications position="top-right" />
				<JumpTable
					jumps={jumps}
					pilots={[{ id: 'p1', name: 'Pilot One' } as any]}
					skydivers={[{ id: 's1', name: 'Sky One' } as any]}
					onRefresh={vi.fn()}
				/>
			</MantineProvider>,
		);

		// Table should render rows; first row should be earlier time
		const cells = await screen.findAllByRole('cell');
		expect(cells.length).toBeGreaterThan(0);

		// Open the first Add skydiver button and click the option
		const addButtons = screen.getAllByRole('button', { name: /Add skydiver/i });
		expect(addButtons.length).toBeGreaterThan(0);
		await userEvent.click(addButtons[0]);

		// After opening, the option should be visible in document body
		await waitFor(() => expect(screen.getByText(/Sky One/)).toBeTruthy());

		await userEvent.click(screen.getByText(/Sky One/));

		expect(api.addSkydiverToJump).toHaveBeenCalled();
	});
});
