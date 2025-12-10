type LogLevel = "debug" | "info" | "warn" | "error" | "silent";
const PRIORITY: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3, silent: 4 };

const envLevel =
	(import.meta.env?.VITE_LOG_LEVEL as LogLevel | undefined) ??
	((import.meta.env?.MODE ?? "development") === "production" ? "warn" : "debug");
const CURRENT_LEVEL: LogLevel =
	PRIORITY[envLevel as LogLevel] === undefined ? "debug" : (envLevel as LogLevel);

/**
 * Return true when the requested log level should be emitted based on CURRENT_LEVEL.
 */
function shouldLog(level: LogLevel): boolean {
	return PRIORITY[level] >= PRIORITY[CURRENT_LEVEL];
}

/**
 * Build a consistent prefix for log messages including the app tag and level.
 */
function formatPrefix(level: string): string {
	return `[slowfall][${level}]`;
}

export const logger = {
	/**
	 * Debug-level logging (visible when VITE_LOG_LEVEL allows debug output).
	 */
	debug: (...args: unknown[]): void => {
		if (shouldLog("debug")) console.debug(formatPrefix("debug"), ...args);
	},
	/**
	 * Informational logging.
	 */
	info: (...args: unknown[]): void => {
		if (shouldLog("info")) console.info(formatPrefix("info"), ...args);
	},
	/**
	 * Non-fatal warning logging.
	 */
	warn: (...args: unknown[]): void => {
		if (shouldLog("warn")) console.warn(formatPrefix("warn"), ...args);
	},
	/**
	 * Error-level logging (for unexpected or fatal conditions).
	 */
	error: (...args: unknown[]): void => {
		if (shouldLog("error")) console.error(formatPrefix("error"), ...args);
	},
};
