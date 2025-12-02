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
export const mantineTheme: MantineThemeOverride = createTheme({
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
	colors: {
		brand: BRAND_PALETTE,
	},
	primaryColor: "brand",
	primaryShade: 6,
	components: {
		Container: Container.extend({
			vars: (_theme, { size, fluid }) => {
				void _theme;
				return {
					root: {
						"--container-size": fluid
							? "100%"
							: size !== undefined && size in CONTAINER_SIZES
								? CONTAINER_SIZES[size]
								: rem(size),
					},
				};
			},
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

// Default export for consumers that import the module's default
export default mantineTheme;
