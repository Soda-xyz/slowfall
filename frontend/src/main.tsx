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

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<MantineProvider theme={mantineTheme} cssVariablesResolver={mantineCssVariableResolver}>
			<Notifications position="top-right" />
			<div className={styles.appRoot}>
				<App />
			</div>
		</MantineProvider>
	</StrictMode>,
);
