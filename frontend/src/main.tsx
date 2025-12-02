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

const env = import.meta.env as unknown as Record<string, string | undefined>;
const backendClientId = env.VITE_MSAL_BACKEND_CLIENT_ID || env.VITE_MSAL_CLIENT_ID || "";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<MantineProvider theme={mantineTheme} cssVariablesResolver={mantineCssVariableResolver}>
			<Notifications position="top-right" />
			<div className={styles.appRoot}>
				<MsalAppProvider>
					<SyncMsalToken scopes={[`api://${backendClientId}/access_as_user`]} />
					<BrowserRouter>
						<App />
					</BrowserRouter>
				</MsalAppProvider>
			</div>
		</MantineProvider>
	</StrictMode>,
);
