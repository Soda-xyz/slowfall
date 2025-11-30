import { render, screen, fireEvent } from "@testing-library/react";
import { vi, test, expect } from "vitest";
import { MantineProvider } from "@mantine/core";

import PersonForm from "./PersonForm";

vi.mock("@mantine/notifications", () => ({
	notifications: { show: vi.fn() },
}));

vi.mock("./api", () => ({
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

	await new Promise((resolve) => setTimeout(resolve, 50));

	expect(onCreated).toHaveBeenCalled();
});
