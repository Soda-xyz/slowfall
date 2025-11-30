import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/dates/styles.css";
import "./index.css";
import "./global.css";
import App from "./App";
import { theme as mantineTheme } from "./theme/theme";
import styles from "./theme/app-global.module.css";
import mantineCssVariableResolver from "./theme/cssVariableResolver";
// NOTE: react-router-dom must be installed in frontend for this import to resolve.
// If you haven't yet run `npm install react-router-dom`, add it and then remove the ts-ignore.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: react-router-dom may be missing until install step is run
import { BrowserRouter } from "react-router-dom";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<MantineProvider theme={mantineTheme} cssVariablesResolver={mantineCssVariableResolver}>
			<Notifications position="top-right" />
			<div className={styles.appRoot}>
				<BrowserRouter>
					<App />
				</BrowserRouter>
			</div>
		</MantineProvider>
	</StrictMode>,
);
