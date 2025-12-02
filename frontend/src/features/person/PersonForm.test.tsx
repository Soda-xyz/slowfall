import { render, screen, waitFor } from "@testing-library/react";
import { vi, test, expect } from "vitest";
import userEvent from "@testing-library/user-event";
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

	const user = userEvent.setup();
	await user.type(nameInput, "Jane Doe");
	await user.type(weightInput, "72");
	await user.type(emailInput, "jane@example.com");
	await user.click(submit);

	await waitFor(() => expect(onCreated).toHaveBeenCalled());
});
