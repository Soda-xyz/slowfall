// Ensure vi is available for top-level mocks
import { vi } from 'vitest';

// Mock createAirport before importing the component so it's a spy
vi.mock('./api', async () => {
  const actual: any = await vi.importActual('./api');
  return {
    ...actual,
    createAirport: vi.fn(() => Promise.resolve({ id: 'a1', name: 'Local Airport', icaoCode: 'LCL', timezone: 'UTC' })),
  };
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import AirportForm from './AirportForm';
import * as api from './api';
import { describe, it, expect, beforeEach } from 'vitest';

beforeEach(() => vi.clearAllMocks());

describe('AirportForm', () => {
  it('shows validation when name missing', async () => {
    render(
      <MantineProvider>
        <Notifications position="top-right" />
        <AirportForm />
      </MantineProvider>,
    );

    const btn = screen.getByRole('button', { name: /Add Airport/i });
    await userEvent.click(btn);

    // createAirport should not be called and Name input remains empty
    expect(api.createAirport).not.toHaveBeenCalled();
    const nameInput = screen.getByLabelText(/Name/i);
    expect(nameInput).toHaveValue('');
  });

  it('submits createAirport and calls onCreated when provided', async () => {
    const onCreated = vi.fn();
    render(
      <MantineProvider>
        <Notifications position="top-right" />
        <AirportForm onCreated={onCreated} />
      </MantineProvider>,
    );

    const name = screen.getByLabelText(/Name/i);
    await userEvent.type(name, 'Local Airport');

    const icao = screen.getByLabelText(/ICAO Code/i);
    await userEvent.type(icao, 'LCL');

    const btn = screen.getByRole('button', { name: /Add Airport/i });
    await userEvent.click(btn);

    await screen.findByRole('button', { name: /Add Airport/i }); // wait for button to exist
    expect(api.createAirport).toHaveBeenCalled();
    expect(onCreated).toHaveBeenCalled();
  });
});

