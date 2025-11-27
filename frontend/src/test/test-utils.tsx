import React from "react";
import type { PropsWithChildren } from "react";
import { render } from "@testing-library/react";
import type { RenderOptions } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { theme as mantineTheme } from "../theme/theme";
import mantineCssVariableResolver from "../theme/cssVariableResolver";

/**
 * Test providers wrapper that mirrors the app's Mantine setup.
 * Use `renderWithMantine(ui, options)` in tests to get a DOM with the
 * same provider, notifications, and cssVariablesResolver as the app.
 */
export function renderWithMantine(ui: React.ReactElement, options?: RenderOptions) {
	const Wrapper: React.FC<PropsWithChildren> = ({ children }) => (
		<MantineProvider theme={mantineTheme} cssVariablesResolver={mantineCssVariableResolver}>
			<Notifications position="top-right" />
			{children}
		</MantineProvider>
	);

	return render(ui, { wrapper: Wrapper, ...options });
}

export * from "@testing-library/react";
