/**
 * DatabaseControlPage test - ensures page renders its title and internal placeholders.
 */
import { vi } from "vitest";

vi.mock("../person", () => ({
	/** Mock PersonTable used in DatabaseControlPage tests */
	PersonTable: () => <div>PersonTable</div>,
	/** Mock PersonForm used in DatabaseControlPage tests */
	PersonForm: () => <div>PersonForm</div>,
}));
vi.mock("../airport", () => ({
	/** Mock AirportTable used in DatabaseControlPage tests */
	AirportTable: () => <div>AirportTable</div>,
	/** Mock AirportForm used in DatabaseControlPage tests */
	AirportForm: () => <div>AirportForm</div>,
}));
vi.mock("../craft", () => ({
	/** Mock CraftTable used in DatabaseControlPage tests */
	CraftTable: () => <div>CraftTable</div>,
	/** Mock CraftForm used in DatabaseControlPage tests */
	CraftForm: () => <div>CraftForm</div>,
}));
vi.mock("../person/api", () => ({ fetchPerson: vi.fn(() => Promise.resolve([])) }));
vi.mock("../airport/api", () => ({ fetchAirports: vi.fn(() => Promise.resolve([])) }));
vi.mock("../craft/api", () => ({ fetchCrafts: vi.fn(() => Promise.resolve([])) }));

import { render, screen, waitFor } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import DatabaseControlPage from "./DatabaseControlPage";
import { describe, it, expect } from "vitest";

describe("DatabaseControlPage", () => {
	it("renders title and child placeholders", async () => {
		render(
			<MantineProvider>
				<DatabaseControlPage />
			</MantineProvider>,
		);

		await waitFor(() => expect(screen.getByText(/Database Control/i)).toBeTruthy());

		await waitFor(() => expect(screen.getByText(/PersonForm/i)).toBeTruthy());
		expect(screen.getByText(/PersonTable/i)).toBeTruthy();
		expect(screen.getByText(/AirportForm/i)).toBeTruthy();
		expect(screen.getByText(/AirportTable/i)).toBeTruthy();
		expect(screen.getByText(/CraftForm/i)).toBeTruthy();
		expect(screen.getByText(/CraftTable/i)).toBeTruthy();
	});
});
