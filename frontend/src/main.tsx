import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/dates/styles.css";
import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<MantineProvider
			defaultColorScheme="dark"
			theme={{
				defaultRadius: "md",
				fontFamily: "Inter, system-ui, Avenir, Helvetica, Arial, sans-serif",
			}}
		>
			<Notifications position="top-right" />
			<App />
		</MantineProvider>
	</StrictMode>,
);
