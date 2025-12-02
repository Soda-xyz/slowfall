import * as React from "react";
import { render } from "@testing-library/react";
import type { RenderResult } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { mantineTheme } from "../theme/theme";
import mantineCssVariableResolver from "../theme/cssVariableResolver";

/**
 * Test providers wrapper that mirrors the app's Mantine setup.
 * Use `renderWithMantine(ui, options)` in tests to get a DOM with the
 * same provider, notifications, and cssVariablesResolver as the app.
 */
export const renderWithMantine = (ui: React.ReactElement): RenderResult => {
	const Wrapper = ({ children }: React.PropsWithChildren<object>) => (
		<MantineProvider theme={mantineTheme} cssVariablesResolver={mantineCssVariableResolver}>
			<Notifications position="top-right" />
			{children}
		</MantineProvider>
	);

	return render(ui, { wrapper: Wrapper });
};

export * from "@testing-library/react";
