import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import AirportTable from './AirportTable';
import { describe, it, expect } from 'vitest';

describe('AirportTable', () => {
  it('renders empty state when no airports', () => {
    render(
      <MantineProvider>
        <AirportTable airports={[]} />
      </MantineProvider>,
    );

    // Ensure header exists (may be multiple elements with same text)
    expect(screen.getAllByText((_c, node) => node?.textContent === 'Airports').length).toBeGreaterThan(0);
    expect(screen.getByText(/No airports yet. Add the first airport using the form\./i)).toBeTruthy();
  });

  it('renders rows when airports provided', () => {
    const airports = [{ id: 'a1', name: 'Local Airport', icaoCode: 'LCL', timezone: 'UTC' }];
    render(
      <MantineProvider>
        <AirportTable airports={airports} />
      </MantineProvider>,
    );

    expect(screen.getByText(/Local Airport/i)).toBeTruthy();
    expect(screen.getByText(/LCL/i)).toBeTruthy();
  });
});
