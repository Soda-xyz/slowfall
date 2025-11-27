import { render, screen, waitFor } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import JumpForm from "./JumpForm";
import { MantineProvider } from "@mantine/core";

vi.mock("../person/api", () => ({
	fetchPilots: vi.fn(() =>
		Promise.resolve([
			{
				id: 1,
				name: "Pilot One",
				weight: 80,
				email: "p1@example.com",
				pilot: true,
				skydiver: false,
			},
		]),
	),
}));
vi.mock("../airport/api", () => ({
	fetchAirports: vi.fn(() =>
		Promise.resolve([{ id: "a1", name: "Local Airport", icaoCode: "LCL", timezone: "UTC" }]),
	),
}));
vi.mock("../craft/api", () => ({
	fetchCrafts: vi.fn(() =>
		Promise.resolve([
			{
				id: "c1",
				name: "Jump Craft",
				registrationNumber: "REG-1",
				capacityWeight: 500,
				capacityPersons: 6,
			},
		]),
	),
}));

describe("JumpForm", () => {
	it("loads airports and pilots and enables Create button when airport available", async () => {
		render(
			<MantineProvider>
				<JumpForm />
			</MantineProvider>,
		);

		await waitFor(() =>
			expect(
				(screen.getByRole("button", { name: /Create jump/i }) as HTMLButtonElement).disabled,
			).toBe(false),
		);
	});
});
