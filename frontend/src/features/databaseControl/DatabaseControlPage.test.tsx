// Ensure vi is available for top-level mocks
import { vi } from 'vitest';

// Mock child components and APIs before importing the DatabaseControlPage
vi.mock('../person', () => ({ PersonTable: () => <div>PersonTable</div>, PersonForm: () => <div>PersonForm</div> }));
vi.mock('../airport', () => ({ AirportTable: () => <div>AirportTable</div>, AirportForm: () => <div>AirportForm</div> }));
vi.mock('../craft', () => ({ CraftTable: () => <div>CraftTable</div>, CraftForm: () => <div>CraftForm</div> }));
vi.mock('../person/api', () => ({ fetchPerson: vi.fn(() => Promise.resolve([])) }));
vi.mock('../airport/api', () => ({ fetchAirports: vi.fn(() => Promise.resolve([])) }));
vi.mock('../craft/api', () => ({ fetchCrafts: vi.fn(() => Promise.resolve([])) }));

import { render, screen, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import DatabaseControlPage from './DatabaseControlPage';
import { describe, it, expect } from 'vitest';

describe('DatabaseControlPage', () => {
  it('renders title and child placeholders', async () => {
    render(
      <MantineProvider>
        <DatabaseControlPage />
      </MantineProvider>,
    );

    // Wait for loading to finish and title to appear
    await waitFor(() => expect(screen.getByText(/Database Control/i)).toBeTruthy());

    // child placeholders should be present (PersonForm/PersonTable, AirportForm/Table, CraftForm/Table are mocked)
    await waitFor(() => expect(screen.getByText(/PersonForm/i)).toBeTruthy());
    expect(screen.getByText(/PersonTable/i)).toBeTruthy();
    expect(screen.getByText(/AirportForm/i)).toBeTruthy();
    expect(screen.getByText(/AirportTable/i)).toBeTruthy();
    expect(screen.getByText(/CraftForm/i)).toBeTruthy();
    expect(screen.getByText(/CraftTable/i)).toBeTruthy();
  });
});
