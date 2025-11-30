import { renderWithMantine, screen, fireEvent, waitFor } from "../../test/test-utils";
import LoginPage from "./LoginPage";
import * as fetchClient from "../../lib/fetchClient";
import { vi, describe, it, beforeEach, afterEach, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import React from "react";

function renderWithRouter(ui: React.ReactElement) {
	return renderWithMantine(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("LoginPage", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		localStorage.clear();
	});

	afterEach(() => {
		localStorage.clear();
	});

	it("on successful login stores token and shows no error", async () => {
		const mockFetch = vi.fn(
			async () => new Response(JSON.stringify({ access_token: "tok-login" }), { status: 200 }),
		);
		globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;

		const setSpy = vi.spyOn(fetchClient, "setAuthToken").mockImplementation(() => {});

		renderWithRouter(<LoginPage />);

		// fill form
		const username = screen.getByLabelText(/Username/i);
		const password = screen.getByLabelText(/Password/i);
		const submit = screen.getByRole("button", { name: /Sign in/i });

		fireEvent.change(username, { target: { value: "u1" } });
		fireEvent.change(password, { target: { value: "p1" } });
		fireEvent.click(submit);

		await waitFor(() => expect(setSpy).toHaveBeenCalledWith("tok-login"));
		expect(screen.queryByText(/Login failed/i)).toBeNull();
	});

	it("shows error on failed login", async () => {
		globalThis.fetch = vi.fn(
			async () => new Response(null, { status: 401 }),
		) as unknown as typeof globalThis.fetch;

		renderWithRouter(<LoginPage />);

		const submit = screen.getByRole("button", { name: /Sign in/i });
		fireEvent.click(submit);

		await waitFor(() => expect(screen.getByText(/Login failed/i)).toBeTruthy());
	});
});
