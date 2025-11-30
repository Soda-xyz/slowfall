import { renderWithMantine, screen } from "../../test/test-utils";
import ProtectedRoute from "./ProtectedRoute";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: react-router-dom may not be installed yet in the environment where static checks run
import { MemoryRouter, Routes, Route } from "react-router-dom";
import * as fetchClient from "../../lib/fetchClient";
import { vi, describe, it, beforeEach, expect } from "vitest";

describe("ProtectedRoute", () => {
	beforeEach(() => vi.restoreAllMocks());

	it("redirects to /login when no token", async () => {
		vi.spyOn(fetchClient, "getAuthToken").mockReturnValue(null);
		renderWithMantine(
			<MemoryRouter initialEntries={["/database"]}>
				<Routes>
					<Route
						path="/database"
						element={
							<ProtectedRoute>
								<div>DB</div>
							</ProtectedRoute>
						}
					/>
					<Route path="/login" element={<div>LoginPage</div>} />
				</Routes>
			</MemoryRouter>,
		);

		// the memory router should render the login page content
		expect(screen.getByText(/LoginPage/i)).toBeTruthy();
	});

	it("renders children when token present", () => {
		vi.spyOn(fetchClient, "getAuthToken").mockReturnValue("tok-abc");
		renderWithMantine(
			<MemoryRouter initialEntries={["/database"]}>
				<Routes>
					<Route
						path="/database"
						element={
							<ProtectedRoute>
								<div>DB</div>
							</ProtectedRoute>
						}
					/>
				</Routes>
			</MemoryRouter>,
		);

		expect(screen.getByText(/DB/i)).toBeTruthy();
	});
});
