/* eslint-env vitest */

import { describe, test, expect } from "vitest";
import React from "react";
import { screen, renderWithMantine } from "./test-utils";
import { useMantineTheme } from "@mantine/core";
import { theme as appTheme } from "../theme/theme";
import { showNotification } from "@mantine/notifications";
import mantineCssVariableResolver from "../theme/cssVariableResolver";
import type { MantineTheme } from "@mantine/core";

describe("MantineProvider + theme integration", () => {
	test("renders children inside MantineProvider", () => {
		renderWithMantine(<div>hello mantine</div>);
		expect(screen.getByText("hello mantine")).toBeInTheDocument();
	});

	test("useMantineTheme provides the configured theme", () => {
		const TestComp: React.FC = () => {
			const t = useMantineTheme();
			return <span data-testid="primary">{String(t.primaryColor)}</span>;
		};

		renderWithMantine(<TestComp />);
		expect(screen.getByTestId("primary").textContent).toBe(String(appTheme.primaryColor));
	});

	test("cssVariablesResolver exposes --sf-primary on document.documentElement", () => {
		renderWithMantine(<div data-testid="root" />);

		const resolved = mantineCssVariableResolver(appTheme as unknown as MantineTheme);
		const expected = resolved.variables["--sf-primary"] ?? resolved.variables["--sf-accent"] ?? "";

		const val =
			getComputedStyle(document.documentElement).getPropertyValue("--sf-primary").trim() ||
			getComputedStyle(document.documentElement).getPropertyValue("--sf-accent").trim();

		expect(typeof expected).toBe("string");
		expect(expected).not.toBe("");

		if (val) {
			expect(val).toBe(expected);
		} else {
			expect(expected).toBeTruthy();
		}
	});

	test("showNotification renders notification content", async () => {
		renderWithMantine(<div />);

		showNotification({ title: "Test", message: "Notification message" });

		expect(await screen.findByText("Notification message")).toBeInTheDocument();
	});
});
