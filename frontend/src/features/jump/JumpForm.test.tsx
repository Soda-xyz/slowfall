/**
 * JumpForm test - verifies form behavior, validations and API integration.
 */
import React from "react";
vi.mock(
	"@mantine/dates",
	() =>
		({
			/** Mock DateInput returning a simple input element */
			DateInput: (props: any) =>
				React.createElement("input", {
					"aria-label": props.label ?? "Date",
					value: props.value
						? typeof props.value === "string"
							? props.value
							: props.value.toString()
						: "",
					/** Mock onChange handler for DateInput */
					onChange: (e: any) => props.onChange?.(e.target.value),
				}),
			/** Mock TimePicker returning a simple input element */
			TimePicker: (props: any) =>
				React.createElement("input", {
					"aria-label": props.label ?? "Time",
					value: props.value ?? "",
					/** Mock onChange handler for TimePicker */
					onChange: (e: any) => props.onChange?.(e.target.value),
				}),
		}) as unknown as any,
);

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import JumpForm from "./JumpForm";
import { MantineProvider } from "@mantine/core";
import * as api from "./api";
import { Notifications } from "@mantine/notifications";

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

vi.mock("./api", async () => {
	const actual: any = await vi.importActual("./api");
	return {
		...actual,
		createJump: vi.fn(() =>
			Promise.resolve({
				id: "j1",
				jumpTime: new Date().toISOString(),
				airportId: "a1",
				altitudeFeet: 10000,
				skydivers: [],
				pilots: [],
			}),
		),
		fetchJumps: vi.fn(() => Promise.resolve([])),
	};
});

beforeEach(() => {
	vi.clearAllMocks();
});

describe("JumpForm", () => {
	it("loads airports and pilots and enables Create button when airport available", async () => {
		render(
			<MantineProvider>
				<Notifications position="top-right" />
				<JumpForm />
			</MantineProvider>,
		);

		await waitFor(() =>
			expect(
				(screen.getByRole("button", { name: /Create jump/i }) as HTMLButtonElement).disabled,
			).toBe(false),
		);
	});

	it("submits createJump and calls onCreated when provided", async () => {
		const onCreated = vi.fn();
		render(
			<MantineProvider>
				<Notifications position="top-right" />
				<JumpForm onCreated={onCreated} />
			</MantineProvider>,
		);

		await waitFor(() => expect(screen.getByPlaceholderText(/Select craft/i)).toBeTruthy());

		const altitude = screen.getByLabelText(/Altitude/i);
		await userEvent.clear(altitude);
		await userEvent.type(altitude, "10000");

		const timeInput = screen.getByLabelText(/Time/i);
		await userEvent.clear(timeInput);
		await userEvent.type(timeInput, "12:00");

		const btn = screen.getByRole("button", { name: /Create jump/i });
		await userEvent.click(btn);

		await waitFor(() => expect(onCreated).toHaveBeenCalled());
		expect(api.createJump).toHaveBeenCalled();
	});

	it("shows validation error when required fields missing", async () => {
		render(
			<MantineProvider>
				<Notifications position="top-right" />
				<JumpForm />
			</MantineProvider>,
		);

		const btn = await screen.findByRole("button", { name: /Create jump/i });
		userEvent.click(btn);

		await waitFor(() => expect(document.body.textContent).toContain("Missing fields"));
		expect(api.createJump).not.toHaveBeenCalled();
	});

	it("calls fetchJumps when onCreated is not provided", async () => {
		render(
			<MantineProvider>
				<Notifications position="top-right" />
				<JumpForm />
			</MantineProvider>,
		);

		await waitFor(() => expect(screen.getByPlaceholderText(/Select craft/i)).toBeTruthy());

		const altitude2 = screen.getByLabelText(/Altitude/i);
		await userEvent.clear(altitude2);
		await userEvent.type(altitude2, "9000");
		const timeInput2 = screen.getByLabelText(/Time/i);
		await userEvent.clear(timeInput2);
		await userEvent.type(timeInput2, "13:00");

		await userEvent.click(screen.getByRole("button", { name: /Create jump/i }));

		await waitFor(() => expect(api.createJump).toHaveBeenCalled());
		await waitFor(() => expect(api.fetchJumps).toHaveBeenCalled());
	});
});
