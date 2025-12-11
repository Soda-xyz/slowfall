/**
 * DashboardPage test - verifies rendering of title and child placeholders.
 */
import { vi } from "vitest";

vi.mock("../jump/JumpForm", () => ({
	/** Mock JumpForm child for DashboardPage tests */
	default: () => <div>JumpForm</div>,
}));
vi.mock("../jump/JumpTable", () => ({
	/** Mock JumpTable child for DashboardPage tests */
	default: () => <div>JumpTable</div>,
}));
vi.mock("../jump/JumpPlanner", () => ({
	/** Mock JumpPlanner child for DashboardPage tests */
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
		await waitFor(() => expect(screen.getByText(/JumpForm/i)).toBeTruthy());
		expect(screen.getByText(/JumpTable/i)).toBeTruthy();
		expect(screen.getByText(/JumpPlanner/i)).toBeTruthy();
	});
});
