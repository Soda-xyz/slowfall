import { render, screen } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import PersonTable from "./PersonTable";
import { describe, it, expect } from "vitest";

describe("PersonTable", () => {
	it("renders empty state when no persons", () => {
		render(
			<MantineProvider>
				<PersonTable person={[]} />
			</MantineProvider>,
		);

		expect(screen.getByText(/Person in database/i)).toBeTruthy();
		expect(screen.getByText(/No person yet. Add the first person using the form\./i)).toBeTruthy();
	});

	it("renders rows when persons provided", () => {
		const persons = [
			{
				id: 1,
				name: "Jane Doe",
				weight: 72,
				email: "jane@example.com",
				pilot: false,
				skydiver: false,
			},
		];
		render(
			<MantineProvider>
				<PersonTable person={persons} />
			</MantineProvider>,
		);

		expect(screen.getByText(/Jane Doe/i)).toBeTruthy();
		expect(screen.getByText(/72/i)).toBeTruthy();
		expect(screen.getByText(/jane@example.com/i)).toBeTruthy();
	});
});
