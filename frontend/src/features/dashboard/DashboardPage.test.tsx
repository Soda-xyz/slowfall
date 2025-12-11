// Ensure vi is available for top-level mocks
import { vi } from "vitest";

// Mock child jump components and APIs before importing the DashboardPage
vi.mock("../jump/JumpForm", () => ({
	/**
	 *
	 */
	default: () => <div>JumpForm</div>,
}));
vi.mock("../jump/JumpTable", () => ({
	/**
	 *
	 */
	default: () => <div>JumpTable</div>,
}));
vi.mock("../jump/JumpPlanner", () => ({
	/**
	 *
	 */
	default: () => <div>JumpPlanner</div>,
}));
vi.mock("../jump/api", () => ({ fetchJumps: vi.fn(() => Promise.resolve([])) }));
vi.mock("../person/api", () => ({
	fetchPilots: vi.fn(() => Promise.resolve([])),
	fetchSkydivers: vi.fn(() => Promise.resolve([])),
}));

import { render, screen, waitFor } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import DashboardPage from "./DashboardPage";
import { describe, it, expect } from "vitest";

describe("DashboardPage", () => {
	it("renders title and child placeholders", async () => {
		render(
			<MantineProvider>
				<DashboardPage />
			</MantineProvider>,
		);

		expect(screen.getByText(/Dashboard/i)).toBeTruthy();
		// child placeholders should be present (JumpForm/JumpTable/JumpPlanner are mocked)
		await waitFor(() => expect(screen.getByText(/JumpForm/i)).toBeTruthy());
		expect(screen.getByText(/JumpTable/i)).toBeTruthy();
		expect(screen.getByText(/JumpPlanner/i)).toBeTruthy();
	});
});
