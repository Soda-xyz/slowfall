import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { vi, test, expect } from "vitest";
import { MantineProvider } from "@mantine/core";

import PersonForm from "./PersonForm";

// Mock notifications to avoid Mantine runtime side-effects
vi.mock("@mantine/notifications", () => ({
	notifications: { show: vi.fn() },
}));

// Mock the createPerson API used by the component
vi.mock("./api", () => ({
	// use a generic object type for the payload so spreading is valid in the mock
	createPerson: vi.fn(async (payload: Record<string, unknown>) => ({
		id: 1,
		...(payload as Record<string, unknown>),
	})),
}));

test("renders PersonForm and submits with valid data", async () => {
	const onCreated = vi.fn();
	render(
		<MantineProvider>
			<PersonForm onCreated={onCreated} />
		</MantineProvider>,
	);

	const nameInput = screen.getByLabelText(/Name/i);
	const weightInput = screen.getByLabelText(/Weight/i);
	const emailInput = screen.getByLabelText(/Email/i);
	const submit = screen.getByRole("button", { name: /Add person/i });

	fireEvent.change(nameInput, { target: { value: "Jane Doe" } });
	fireEvent.change(weightInput, { target: { value: "72" } });
	fireEvent.change(emailInput, { target: { value: "jane@example.com" } });

	fireEvent.click(submit);

	// wait for an async callback to trigger
	await new Promise((r) => setTimeout(r, 50));

	expect(onCreated).toHaveBeenCalled();
});
