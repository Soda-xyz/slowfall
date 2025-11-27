import { test, expect } from "@playwright/test";
import { visitHome, openTab, fillPersonForm, waitForNotification } from "../test-helpers";

// Mock fixtures used by the page
const createdPerson = {
	id: 123,
	firstName: "Jane",
	lastName: "Doe",
	email: "jane@example.com",
	weight: 72,
};

test("creates a person via Database Control form", async ({ page }) => {
	// Stub network calls the DatabaseControlPage makes on mount
	await page.route("**/api/person", async (route) => {
		// GET persons
		if (route.request().method() === "GET") {
			await route.fulfill({
				status: 200,
				body: JSON.stringify([]),
				headers: { "Content-Type": "application/json" },
			});
			return;
		}
		// POST create person
		if (route.request().method() === "POST") {
			await route.fulfill({
				status: 200,
				body: JSON.stringify(createdPerson),
				headers: { "Content-Type": "application/json" },
			});
			return;
		}
		await route.continue();
	});

	await page.route("**/api/airports", async (route) => {
		if (route.request().method() === "GET") {
			await route.fulfill({
				status: 200,
				body: JSON.stringify([]),
				headers: { "Content-Type": "application/json" },
			});
			return;
		}
		await route.continue();
	});

	await visitHome(page);
	await openTab(page, "Database");

	await fillPersonForm(page, { name: "Jane Doe", weight: "72", email: "jane@example.com" });

	// Notification from PersonForm
	await waitForNotification(page, /Person added/);

	// Ensure the created person's email appears in the table after creation
	await page.getByText("jane@example.com").waitFor({ state: "visible" });
	await expect(page.getByText("jane@example.com")).toBeVisible();
});
