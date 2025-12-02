// Declarations for CSS imports (placed in src/types so tsconfig `typeRoots` picks them up)

declare module "*.module.css" {
	const classes: { [key: string]: string };
	export default classes;
}

declare module "*.css";

declare module "@mantine/core/styles.css";

declare module "@mantine/notifications/styles.css";

declare module "@mantine/dates/styles.css";
