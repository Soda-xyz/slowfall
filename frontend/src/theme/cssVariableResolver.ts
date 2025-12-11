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

	const brandName = String(theme.primaryColor ?? "brand");
	const brandPalette =
		colorsRecord[brandName] ??
		(colorsRecord.brand as unknown as readonly string[] | undefined) ??
		undefined;
	if (brandPalette && Array.isArray(brandPalette)) {
		brandPalette.forEach((shade, idx) => {
			if (typeof shade === "string") {
				variables[`${prefix}brand-${idx}`] = shade;
				variables[`--brand-${idx}`] = shade;
			}
		});
	}

	const otherTokensRaw = (theme as unknown as Record<string, unknown>)?.other as
		| undefined
		| Record<string, unknown>;
	const otherTokens = otherTokensRaw?.tokens as
		| undefined
		| { light?: Record<string, string>; dark?: Record<string, string> };

	/** Prefer a light token from otherTokens if available */
	const prefer = (lightKey: string, fallback: string) => otherTokens?.light?.[lightKey] ?? fallback;
	/** Prefer a dark token from otherTokens if available */
	const preferDark = (darkKey: string, fallback: string) =>
		otherTokens?.dark?.[darkKey] ?? fallback;

	const light: Record<string, string> = {
		[`${prefix}background`]: prefer("bg", theme.white ?? gray0),
		[`${prefix}surface`]: prefer("surface", gray0),
		[`${prefix}text`]: prefer("text", theme.black ?? "#000000"),
		[`${prefix}accent`]: prefer("accent", primary),
		[`${prefix}accent-foreground`]: prefer("accentForeground", theme.black ?? "#000000"),

		"--bg": prefer("bg", theme.white ?? gray0),
		"--card-bg": prefer("cardBg", gray0),
		"--text": prefer("text", theme.black ?? "#000000"),
		"--accent": prefer("accent", primary),
		"--accent-foreground": prefer("accentForeground", theme.black ?? "#000000"),
		"--font-family":
			theme.fontFamily ?? "Inter, system-ui, Avenir, 'Helvetica Neue', Helvetica, Arial",
		"--button-bg": prefer("buttonBg", primary),
		"--button-text": prefer("buttonText", theme.white ?? "#ffffff"),
	};

	const dark: Record<string, string> = {
		[`${prefix}background`]: preferDark("bg", colorsRecord.dark?.[7] ?? theme.black ?? "#000000"),
		[`${prefix}surface`]: preferDark("surface", colorsRecord.dark?.[6] ?? theme.black ?? "#000000"),
		[`${prefix}text`]: preferDark("text", colorsRecord.dark?.[0] ?? theme.white ?? "#ffffff"),
		[`${prefix}accent`]: preferDark("accent", primary),
		[`${prefix}accent-foreground`]: preferDark("accentForeground", theme.white ?? "#ffffff"),

		// compatibility aliases for global CSS (dark)
		"--bg": preferDark("bg", colorsRecord.dark?.[7] ?? theme.black ?? "#000000"),
		"--card-bg": preferDark("cardBg", colorsRecord.dark?.[6] ?? theme.black ?? "#000000"),
		"--text": preferDark("text", colorsRecord.dark?.[0] ?? theme.white ?? "#ffffff"),
		"--accent": preferDark("accent", primary),
		"--accent-foreground": preferDark("accentForeground", theme.white ?? "#ffffff"),
		"--font-family":
			theme.fontFamily ?? "Inter, system-ui, Avenir, 'Helvetica Neue', Helvetica, Arial",
		"--button-bg": preferDark("buttonBg", primary),
		"--button-text": preferDark("buttonText", theme.black ?? "#000000"),
	};

	return {
		variables,
		light,
		dark,
	};
};

export default mantineCssVariableResolver;
