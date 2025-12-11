import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import CraftTable from './CraftTable';
import { describe, it, expect } from 'vitest';

describe('CraftTable', () => {
  it('renders empty state when no crafts', () => {
    render(
      <MantineProvider>
        <CraftTable crafts={[]} />
      </MantineProvider>,
    );

    // There can be multiple elements with the text 'Crafts' (heading and dimmed note), so match more specifically
    expect(screen.getAllByText((_content, node) => node?.textContent === 'Crafts').length).toBeGreaterThan(0);
    expect(screen.getByText(/No crafts yet. Add the first craft using the form\./i)).toBeTruthy();
  });

  it('renders rows when crafts provided', () => {
    const crafts = [
      { id: 'c1', name: 'Tunnan', registrationNumber: 'REG-1', capacityWeight: 300, capacityPersons: 6 },
    ];
    render(
      <MantineProvider>
        <CraftTable crafts={crafts} />
      </MantineProvider>,
    );

    expect(screen.getByText(/Tunnan/i)).toBeTruthy();
    expect(screen.getByText(/REG-1/i)).toBeTruthy();
  });
});
