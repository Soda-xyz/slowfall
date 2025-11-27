import { test, expect } from "@playwright/test";
import { visitHome } from "../test-helpers";

test("home page loads and shows brand and dashboard", async ({ page }) => {
	await visitHome(page);
	await expect(page.getByRole("heading", { name: "Slowfall" })).toBeVisible();
	await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
});
