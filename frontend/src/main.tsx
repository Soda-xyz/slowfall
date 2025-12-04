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
import { mantineTheme } from "./theme/theme";
import styles from "./theme/app-global.module.css";
import mantineCssVariableResolver from "./theme/cssVariableResolver";
import { BrowserRouter } from "react-router-dom";
import { MsalAppProvider, SyncMsalToken } from "./auth/MsalProvider";

// Prefer runtime-provided env (window.__env) set by index.html loader, then fall back to build-time import.meta.env
// type RuntimeEnv = Record<string, string | undefined>;
// const runtimeEnv = (typeof window !== "undefined" ? (window as unknown as { __env?: RuntimeEnv }).__env : undefined);
// const buildEnv = import.meta.env as unknown as Record<string, string | undefined>;
// const env = Object.assign({}, buildEnv, runtimeEnv || {});
// runtime envs are read by modules that need them (msalClient, fetchClient, etc.)

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<MantineProvider theme={mantineTheme} cssVariablesResolver={mantineCssVariableResolver}>
			<Notifications position="top-right" />
			<div className={styles.appRoot}>
				<MsalAppProvider>
					<SyncMsalToken />
					<BrowserRouter>
						<App />
					</BrowserRouter>
				</MsalAppProvider>
			</div>
		</MantineProvider>
	</StrictMode>,
);
