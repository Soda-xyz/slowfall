import type { CSSVariablesResolver, MantineTheme } from "@mantine/core";

/**
 * Convert a Mantine theme into a small set of stable CSS custom properties.
 *
 * This resolver maps select theme tokens (colors, spacing, radii, shadows,
 * font-family, etc.) to a compact variable set prefixed with `--sf-`. It returns
 * an object compatible with Mantine's CSSVariablesResolver type: variables, light, dark.
 *
 * The returned variables are intended for use with MantineProvider's
 * cssVariablesResolver option and allow existing CSS Modules to read theme
 * values via var(--sf-...).
 */
export const mantineCssVariableResolver: CSSVariablesResolver = (theme: MantineTheme) => {
	const prefix = "--sf-";

	const colorsRecord = theme.colors as unknown as Record<string, readonly string[] | undefined>;

	/**
	 * Get a shade value from the theme palette by name and shade index.
	 * Returns undefined when a palette or shade is not available.
	 */
	const getPaletteColor = (name: string | undefined, shade = 6): string | undefined => {
		if (!name) return undefined;
		const palette = colorsRecord[name];
		if (palette && typeof palette[shade] === "string") return palette[shade];
		return undefined;
	};

	const maybePrimaryShade = (theme as Partial<{ primaryShade?: number }>).primaryShade;
	const primaryShade = typeof maybePrimaryShade === "number" ? maybePrimaryShade : 6;

	const fallbackPrimary = getPaletteColor("blue", 6) ?? "#228be6";
	const primary = getPaletteColor(theme.primaryColor, primaryShade) ?? fallbackPrimary;

	const success = getPaletteColor("green", 6) ?? "#37b24d";
	const danger = getPaletteColor("red", 6) ?? "#f03e3e";
	const warning = getPaletteColor("yellow", 6) ?? "#f59f00";
	const info = getPaletteColor("blue", 6) ?? "#228be6";

	const gray0 = colorsRecord.gray?.[0] ?? theme.white ?? "#ffffff";
	const gray5 = colorsRecord.gray?.[5] ?? "#868e96";

	const variables: Record<string, string> = {
		[`${prefix}font-family`]:
			theme.fontFamily ?? "Inter, system-ui, Avenir, 'Helvetica Neue', Helvetica, Arial",
		[`${prefix}radius-sm`]: theme.radius?.sm ?? "4px",
		[`${prefix}radius-md`]: theme.radius?.md ?? "8px",
		[`${prefix}radius-lg`]: theme.radius?.lg ?? "12px",
		[`${prefix}spacing-sm`]:
			(theme.spacing as Record<string, string | number>)?.sm?.toString() ?? "8px",
		[`${prefix}spacing-md`]:
			(theme.spacing as Record<string, string | number>)?.md?.toString() ?? "12px",
		[`${prefix}spacing-lg`]:
			(theme.spacing as Record<string, string | number>)?.lg?.toString() ?? "20px",
		[`${prefix}shadow-sm`]: theme.shadows?.sm ?? "none",
		[`${prefix}shadow-md`]: theme.shadows?.md ?? "none",
		[`${prefix}shadow-lg`]: theme.shadows?.lg ?? "none",

		[`${prefix}primary`]: primary,
		[`${prefix}success`]: success,
		[`${prefix}danger`]: danger,
		[`${prefix}warning`]: warning,
		[`${prefix}info`]: info,
		[`${prefix}muted`]: gray5,
	};

	const light: Record<string, string> = {
		[`${prefix}background`]: theme.white ?? gray0,
		[`${prefix}surface`]: gray0,
		[`${prefix}text`]: theme.black ?? "#000000",
		[`${prefix}accent`]: primary,
		[`${prefix}accent-foreground`]: theme.black ?? "#000000",
	};

	const dark: Record<string, string> = {
		[`${prefix}background`]: colorsRecord.dark?.[7] ?? theme.black ?? "#000000",
		[`${prefix}surface`]: colorsRecord.dark?.[6] ?? theme.black ?? "#000000",
		[`${prefix}text`]: colorsRecord.dark?.[0] ?? theme.white ?? "#ffffff",
		[`${prefix}accent`]: primary,
		[`${prefix}accent-foreground`]: theme.white ?? "#ffffff",
	};

	return {
		variables,
		light,
		dark,
	};
};

export default mantineCssVariableResolver;
