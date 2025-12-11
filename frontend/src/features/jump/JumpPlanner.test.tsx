/**
 * JumpPlanner smoke test - renders the component and checks key UI labels.
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import JumpPlanner from "./JumpPlanner";
import { MantineProvider } from "@mantine/core";

describe("JumpPlanner", () => {
	it("renders without crashing and shows expected labels", () => {
		render(
			<MantineProvider>
				<JumpPlanner />
			</MantineProvider>,
		);
		expect(screen.getByText(/Weight distribution/i)).toBeTruthy();
		expect(screen.getByText(/Pilots/i)).toBeTruthy();
	});
});
