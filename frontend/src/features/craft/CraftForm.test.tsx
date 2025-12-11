// Ensure vi is available for top-level mocks
import { vi } from "vitest";

// Mock createCraft before importing the component so it's a spy
vi.mock("./api", async () => {
	const actual: any = await vi.importActual("./api");
	return {
		...actual,
		createCraft: vi.fn(() =>
			Promise.resolve({
				id: "c1",
				name: "Tunnan",
				registrationNumber: "REG-1",
				capacityWeight: 300,
				capacityPersons: 6,
			}),
		),
	};
});

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import CraftForm from "./CraftForm";
import * as api from "./api";
import { describe, it, expect, beforeEach } from "vitest";

beforeEach(() => vi.clearAllMocks());

describe("CraftForm", () => {
	it("shows validation when name missing", async () => {
		render(
			<MantineProvider>
				<Notifications position="top-right" />
				<CraftForm />
			</MantineProvider>,
		);

		const btn = screen.getByRole("button", { name: /Add Craft/i });
		await userEvent.click(btn);

		// Expect createCraft not to have been called and the Name input still empty
		expect(api.createCraft).not.toHaveBeenCalled();
		const nameInput = screen.getByLabelText(/Name/i);
		expect(nameInput).toHaveValue("");
	});

	it("submits createCraft and calls onCreated when provided", async () => {
		const onCreated = vi.fn();
		render(
			<MantineProvider>
				<Notifications position="top-right" />
				<CraftForm onCreated={onCreated} />
			</MantineProvider>,
		);

		// fill inputs
		const name = screen.getByLabelText(/Name/i);
		await userEvent.type(name, "Tunnan");

		const reg = screen.getByLabelText(/Registration Number/i);
		await userEvent.type(reg, "KVT-01");

		const weight = screen.getByLabelText(/Capacity Weight/i);
		await userEvent.clear(weight);
		await userEvent.type(weight, "300");

		const persons = screen.getByLabelText(/Capacity Persons/i);
		await userEvent.clear(persons);
		await userEvent.type(persons, "6");

		const btn = screen.getByRole("button", { name: /Add Craft/i });
		await userEvent.click(btn);

		await waitFor(() => expect(api.createCraft).toHaveBeenCalled());
		await waitFor(() => expect(onCreated).toHaveBeenCalled());
	});
});
