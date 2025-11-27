import { Card, Container, createTheme, Paper, rem, Select } from "@mantine/core";
import type { MantineThemeOverride } from "@mantine/core";

/**
 * Container size tokens used by the application's Mantine Container override.
 * Keys match the `size` prop values and values are valid CSS sizes (rem strings).
 */
const CONTAINER_SIZES: Record<string, string> = {
	xxs: rem("200px"),
	xs: rem("300px"),
	sm: rem("400px"),
	md: rem("500px"),
	lg: rem("600px"),
	xl: rem("1400px"),
	xxl: rem("1600px"),
};

/**
 * Central brand palette: an array of 10 color shades from light to dark.
 *
 * Mantine expects a color palette to be an array of 10 shades. Use this to
 * keep the app's primary/brand color consistent across components.
 */
const BRAND_PALETTE = [
	"#f8fbff",
	"#eaf5ff",
	"#d7efff",
	"#bfe0ff",
	"#99ccff",
	"#66b3ff",
	"#3380ff",
	"#005be6",
	"#0047b3",
	"#002e80",
] as const;

/**
 * Mantine theme override for the application.
 *
 * This object is exported as `theme` and consumed by `MantineProvider` in
 * `src/main.tsx`. It centralizes colors, sizing, spacing, component defaults,
 * and small app-specific design tokens.
 *
 * See Mantine docs — MantineProvider & theme object:
 * https://mantine.dev/theming/mantine-provider/ and
 * https://mantine.dev/theming/theme-object/
 */
export const theme: MantineThemeOverride = createTheme({
	/** Put your mantine theme override here */
	fontSizes: {
		xs: rem("12px"),
		sm: rem("14px"),
		md: rem("16px"),
		lg: rem("18px"),
		xl: rem("20px"),
		"2xl": rem("24px"),
		"3xl": rem("30px"),
		"4xl": rem("36px"),
		"5xl": rem("48px"),
	},
	spacing: {
		"3xs": rem("4px"),
		"2xs": rem("8px"),
		xs: rem("10px"),
		sm: rem("12px"),
		md: rem("16px"),
		lg: rem("20px"),
		xl: rem("24px"),
		"2xl": rem("28px"),
		"3xl": rem("32px"),
	},
	// Add the centralized colors object here. Components can use `color="brand"` or the
	// app can set `primaryColor: 'brand'` so controls that rely on the primary color
	// will pick up this palette automatically.
	colors: {
		brand: BRAND_PALETTE,
	},
	// Set the default primary color for Mantine components to our brand palette
	primaryColor: "brand",
	// Choose a default shade index from the brand palette (0..9). Mantine commonly
	// uses 6 as a balanced default — feel free to change this to a different index.
	primaryShade: 6,
	components: {
		/** Put your mantine component override here */
		Container: Container.extend({
			vars: (_, { size, fluid }) => ({
				root: {
					"--container-size": fluid
						? "100%"
						: size !== undefined && size in CONTAINER_SIZES
							? CONTAINER_SIZES[size]
							: rem(size),
				},
			}),
		}),
		Paper: Paper.extend({
			defaultProps: {
				p: "md",
				shadow: "xl",
				radius: "md",
				withBorder: true,
			},
		}),

		Card: Card.extend({
			defaultProps: {
				p: "xl",
				shadow: "xl",
				radius: "var(--mantine-radius-default)",
				withBorder: true,
			},
		}),
		Select: Select.extend({
			defaultProps: {
				checkIconPosition: "right",
			},
		}),
	},
	other: {
		style: "mantine",
		// App-specific tokens (light & dark). These are used by MantineProvider.globalStyles
		// to expose CSS variables (e.g. --bg, --text) so existing CSS Modules can read them
		// via var(--bg) etc. Keep tokens small and semantic; prefer theme.colors for
		// palettes and semantic colors.
		tokens: {
			dark: {
				bg: BRAND_PALETTE[9],
				surface: BRAND_PALETTE[8],
				cardBg: BRAND_PALETTE[8],
				text: BRAND_PALETTE[0],
				muted: "#CFC0E8",
				accent: BRAND_PALETTE[5],
				accentHover: BRAND_PALETTE[6],
				buttonBg: BRAND_PALETTE[7],
				buttonText: BRAND_PALETTE[0],
			},
			light: {
				bg: "#F6F0FB",
				surface: "#F1EAF8",
				cardBg: "#FFFFFF",
				text: "#2b1633",
				muted: "#6C557D",
				accent: "#9F79FF",
				accentHover: "#7B5BFF",
				buttonBg: "#EDE4FF",
				buttonText: "#2b1633",
			},
		},
	},
});

// How to use:
// - Components that accept a `color` prop can use <Button color="brand"> or similar.
// - The `primaryColor: 'brand'` setting makes components that rely on the primary color
//   pick values from this palette by default.
// - For page-level colors (body background, global text color), either use Mantine's
//   Global component or a top-level CSS rule that references the theme via the
//   `useMantineTheme()` hook and the `Global` component from @mantine/core.
// Docs: Mantine theme object & provider — https://mantine.dev/theming/mantine-provider/
// Theme object & colors — https://mantine.dev/theming/theme-object/
